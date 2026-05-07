import { routes, type VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",

  functions: {
    // Commander uses streaming SSE — give it the full default budget
    "app/api/commander/route.ts": { maxDuration: 300 },
    "app/api/agents/ops/route.ts": { maxDuration: 60 },
    "app/api/agents/marketing/route.ts": { maxDuration: 60 },
    "app/api/agents/crm/route.ts": { maxDuration: 60 },
    "app/api/webhooks/stripe/route.ts": { maxDuration: 30 },
    "app/api/webhooks/twilio/route.ts": { maxDuration: 30 },
  },

  headers: [
    routes.header("/api/webhooks/(.*)", [
      { key: "X-Robots-Tag", value: "noindex" },
    ]),
  ],
};
