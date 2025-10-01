# Publicis Knowledge Arena

A production-ready SvelteKit + Supabase implementation for the gamified quiz platform requested by Publicis. The project uses server-side rendering, signed cookies for session management, Supabase for persistence + RLS, and OpenAI for AI-generated question authoring.

## Features

- Identity capture via Name, Agency, Function with signed session cookies (no OAuth/SSO)
- Configurable categories and levels backed by Supabase tables and seed scripts
- AI question engine with dedupe, retry, and rate limiting against OpenAI GPT-4o-mini
- 10-question quiz flow with 15 second timer, keyboard-friendly UI, and secure scoring server-side
- Leaderboards (global, by category, level, and agency) with near-real-time updates
- Player history view with performance charts and per-attempt insights
- REST API endpoints matching the specification for profile, quiz lifecycle, leaderboards, and history
- Unit tests covering scoring matrix, rate limiting, and hash stability
- Deployable to Vercel with Supabase backend and OpenAI integration

## Prerequisites

- Node.js 20+
- pnpm or npm (examples use npm)
- Supabase project with service role key
- OpenAI API key

## Environment variables

Create a `.env` file with the following:

```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SESSION_SECRET=change_me
```

## Local development

```bash
npm install
npm run db:migrate   # runs supabase db push (requires Supabase CLI)
npm run db:seed      # seeds categories & levels using service role key
npm run dev
```

The dev server runs at `http://localhost:5173`.

### Tests

```bash
npm test
```

## Deploying to Vercel

1. Push this repository to GitHub (or your preferred Git remote).
2. Create a new Vercel project and import the repo.
3. Set the environment variables above in Vercel project settings.
4. Configure the build command (`npm run build`) and output directory (`.svelte-kit/vercel` handled by adapter).
5. Provision a Supabase project, run the SQL in `supabase/migrations/0001_init.sql`, then run `npm run db:seed` locally or via Vercel Deploy Hooks.
6. Deploy. Vercel will build the SvelteKit project and connect to Supabase via environment variables.

## Example data

To showcase the UI without AI calls, create sample users/attempts via Supabase SQL or the dashboard. Example inserts are provided in `supabase/seed.sql` for taxonomy. You can generate attempts manually using Supabase table editor.

## No-code blueprint (Appendix)

### WeWeb
- Build pages for Profile (Name, Agency dropdown, Function), Play (category/level selectors), Quiz (timer + question cards), Results, Leaderboard.
- Use WeWeb collections bound to Xano endpoints for categories, levels, quiz attempts, and leaderboards.
- Store session data in browser storage with generated user ID.

### Xano
- Tables mirror the SQL schema: users, categories, levels, questions, quiz_attempts, attempt_items, leaderboard.
- Endpoints: `/profile/upsert`, `/catalog`, `/quiz/start`, `/quiz/submit`, `/leaderboard`, `/history` with authentication keyed off custom session tokens.
- Implement rate limiting via Xano Add-on functions (IP + user key window counters).
- Scheduled task aggregates leaderboard summaries per agency.

### n8n
- Workflow triggered by Xano webhook when new quiz start requested and question pool < 10.
- Nodes: HTTP Request → OpenAI (JSON prompt from spec) → Function to dedupe hash → Xano API call to persist question.
- Include retry logic (max 2) and notify Slack channel when generation fails.

### CSV Export & Analytics
- Xano endpoints to export attempts/leaderboard as CSV.
- Optional Auth0 integration stub for future SSO (phase 2), but current build remains simple name/agency/function capture.

## Inspiration credits

- Leaderboard layout ideas adapted from [supabase-community/leaderboard](https://github.com/supabase-community/leaderboard) and [codedgar/leaderboard](https://github.com/codedgar/leaderboard).

---

For further enhancements (admin dashboards, curated question banks, agency analytics), extend Supabase tables with moderation flags and build SvelteKit admin routes gated by role-based policies.
