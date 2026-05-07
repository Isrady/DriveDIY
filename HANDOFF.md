# DriveDIY — Project Handoff

**Business**: UAE-based DIY car servicing facility, Al Quoz, Dubai  
**Status**: Pre-launch. Codebase complete, Vercel deployed, awaiting real credentials and Supabase setup.  
**Founder**: Ismail  
**Branch**: `claude/build-drivediy-platform-xdbZF`  
**Repo**: `isrady/drivediy`

---

## What's Built

### Tech Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.5 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (CSS custom properties) |
| Auth + DB | Supabase (SSR, RLS, Realtime) |
| AI | Anthropic Claude (`claude-sonnet-4-5`) |
| Payments | Stripe v22 (`2026-04-22.dahlia`) |
| Messaging | Twilio WhatsApp |
| Email | Resend |
| Calendar | Google Calendar API |
| Deploy | Vercel (Hobby plan) |

### Routes (16 total)
```
/                          Landing page (static)
/auth/login                Email + Google sign-in
/auth/signup               Email + Google sign-up
/auth/callback             OAuth callback handler
/dashboard/app             Mobile app UI (phone shell)
/dashboard/commander       AI Commander dashboard (admin)
/api/commander             SSE-streaming Claude agent
/api/agents/ops            Ops sub-agent
/api/agents/marketing      Marketing sub-agent
/api/agents/crm            CRM sub-agent
/api/permissions           List pending permissions
/api/permissions/[id]      Approve / deny permissions
/api/webhooks/stripe       Stripe payment & subscription events
/api/webhooks/twilio       WhatsApp inbound messages
```

### File Structure
```
/agents/          commander.ts, ops.ts, marketing.ts, crm.ts
/app/             Next.js App Router pages + API routes
/components/
  landing/        Hero, Nav, Pricing, FAQ, ServicesTabSwitcher, etc.
  dashboard/
    MobileAppShell.tsx          Phone-frame UI container
    screens/                    Home, BookBay, MyGarage, Academy, Profile
    commander/                  CommanderLayout, ChatArea, AgentSidebar,
                                PermissionsPanel, LaunchChecklist, RecommendationsFeed
/lib/
  supabase/client.ts            Browser client
  supabase/server.ts            Server client (SSR cookies)
  claude.ts                     callClaude() + callClaudeStream()
  stripe.ts                     getStripe(), payment intents, subscriptions
  email.ts                      sendBookingConfirmation(), sendFollowUpEmail()
  twilio.ts                     sendWhatsAppMessage(), validateTwilioSignature()
  calendar.ts                   checkBayAvailability(), createBayBookingEvent()
/types/           database.ts, agents.ts
/supabase/        schema.sql (run this in Supabase SQL Editor)
/proxy.ts         Route protection (Next.js 16 middleware)
```

### Business Logic
- **Bay rental**: AED 85/hr — 5 bays (2 standard, 2 two-post lift, 1 detail)
- **Tool kits**: AED 25/kit add-on at booking
- **Subscriptions**: Builder AED 349/mo, Gearhead AED 749/mo
- **Mechanic assist**: AED 120/hr on-demand

### AI Agent Architecture
```
Commander (gold) ← Ismail chats here
  ├── Ops Agent (red)       — facility, bays, tools, safety
  ├── Marketing Agent (purple) — Instagram/TikTok/Snapchat/WhatsApp content
  └── CRM Agent (blue)     — customer comms EN/AR/UR/TL
```
Commander responds in structured JSON (`message`, `route_to`, `needs_permission`, `recommendations`, `checklist_updates`). All actions that affect the real world require Ismail's explicit approval via the Permissions Panel.

---

## Setup Checklist

### 1. Supabase (Required first)
1. Create project at [supabase.com](https://supabase.com)
2. SQL Editor → paste and run `supabase/schema.sql`
3. Copy from Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Enable Google OAuth: Authentication → Providers → Google (needs Google Cloud OAuth app)
5. Set redirect URL in Supabase Auth: `https://your-domain.vercel.app/auth/callback`

### 2. Anthropic (Required for AI agents)
1. Get key at [console.anthropic.com](https://console.anthropic.com)
2. Set `ANTHROPIC_API_KEY`

### 3. Stripe (Required for payments)
1. Create account, get test keys
2. Create two products:
   - **Builder** — AED 349/mo recurring → copy price ID to `STRIPE_BUILDER_PRICE_ID`
   - **Gearhead** — AED 749/mo recurring → copy price ID to `STRIPE_GEARHEAD_PRICE_ID`
3. Webhooks → Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Twilio WhatsApp (Required for comms)
1. Twilio console → Messaging → WhatsApp sandbox
2. Set inbound webhook URL: `https://your-domain.vercel.app/api/webhooks/twilio`
3. Copy `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
4. When ready for production, apply for WhatsApp Business API

### 5. Resend Email (Required for booking confirmations)
1. Sign up at [resend.com](https://resend.com)
2. Add and verify your sending domain (`drivediy.ae`)
3. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL=noreply@drivediy.ae`

### 6. Google Calendar (Optional — bay availability)
1. Google Cloud Console → Create project → Enable Calendar API
2. Create OAuth 2.0 credentials
3. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_CALENDAR_ID`

### 7. Vercel Environment Variables
In Vercel → Project → Settings → Environment Variables, add all of the above plus:
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```
Then **redeploy** after adding vars.

---

## Known Limitations (Hobby Plan)

| Issue | Impact | Fix |
|---|---|---|
| No `dxb1` region on Hobby | App serves from nearest region, not Dubai | Upgrade to Vercel Pro |

Function timeouts are **not** a Hobby plan limitation — the platform default is 300s on all plans. AI agent calls will work fine.

**To add Dubai region**: Upgrade to Vercel Pro, then add to `vercel.ts`:
```ts
export const config: VercelConfig = {
  regions: ["dxb1"],
  // ... rest of config
};
```

---

## Admin Access

The Commander dashboard (`/dashboard/commander`) requires `role = 'admin'` in the `users` table. To grant yourself admin access after signing up:

```sql
UPDATE users SET role = 'admin' WHERE email = 'ismail@youremail.com';
```

Run this in Supabase SQL Editor after your first sign-up.

---

## Local Development

```bash
git clone https://github.com/isrady/drivediy
cd drivediy
git checkout claude/build-drivediy-platform-xdbZF
npm install

# Copy and fill in your real credentials
cp .env.local.example .env.local  # or edit .env.local directly

npm run dev        # http://localhost:3000
npm run build      # production build check
```

---

## What's Not Built Yet

| Feature | Notes |
|---|---|
| Real bay booking flow (Stripe payment UI) | `BookBayScreen` has the wizard UI; needs live Stripe keys + `createBookingPaymentIntent()` wired to it |
| Google Calendar conflict checking | `lib/calendar.ts` is built; not yet called from the booking wizard |
| Parts marketplace | Schema has `parts` + `orders` tables; no UI |
| DIY Academy video content | `AcademyScreen` UI built; no real video URLs |
| Push notifications | Not implemented |
| Arabic/Urdu/Tagalog UI translations | CRM agent supports these languages; UI is English-only |
| Physical POS / check-in system | Out of scope for web app |

---

## Key Decisions & Constraints

- **Next.js 16** uses `proxy.ts` not `middleware.ts` — export must be named `proxy`, not `middleware`
- **Tailwind v4** uses `@import "tailwindcss"` + `@theme` in CSS — no `tailwind.config.ts`
- **Supabase SSR** uses `@supabase/ssr` (not deprecated `auth-helpers-nextjs`)
- **Stripe webhooks** use `req.text()` for raw body (required for signature verification)
- **SSE streaming** uses `new Response(stream)` not `NextResponse` 
- **All service clients** (Stripe, Resend, Anthropic) use lazy initialization to avoid build-time errors

---

*Built with Claude Code — session `888ae295-f0fb-42e3-ba3b-fb232e326f31`*
