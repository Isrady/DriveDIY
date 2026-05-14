import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// In-memory rate limiter — resets per serverless instance cold start.
// For production at scale, replace backing store with Upstash Redis.
const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/bookings/checkout": { max: 10, windowMs: 60_000 },
  "/api/orders/checkout": { max: 10, windowMs: 60_000 },
  "/api/commander": { max: 30, windowMs: 60_000 },
  "/api/agents": { max: 30, windowMs: 60_000 },
};

const hitCounts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, pathname: string): boolean {
  const matchedPrefix = Object.keys(RATE_LIMITS).find((prefix) =>
    pathname.startsWith(prefix)
  );
  if (!matchedPrefix) return false;

  const { max, windowMs } = RATE_LIMITS[matchedPrefix];
  const key = `${ip}:${matchedPrefix}`;
  const now = Date.now();
  const entry = hitCounts.get(key);

  if (!entry || now > entry.resetAt) {
    hitCounts.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  return entry.count > max;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip, pathname)) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /dashboard routes
  if (pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith("/auth/") && user) {
    return NextResponse.redirect(new URL("/dashboard/app", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*", "/api/:path*"],
};
