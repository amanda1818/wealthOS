<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/556a9bff-2a04-42a0-8beb-fb2c2d42096d

## Run Locally

**Prerequisites:** Node.js, a Supabase project, the [Supabase CLI](https://supabase.com/docs/guides/cli)

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL` / `SUPABASE_ANON_KEY` from your Supabase project settings.
3. Apply the database schema: `supabase link --project-ref <your-ref>` then `supabase db push`.
4. Set the Gemini key as an Edge Function secret (never a client env var): `supabase secrets set GEMINI_API_KEY=your-gemini-key`.
5. Deploy the AI gateway function: `supabase functions deploy ai-gateway`.
6. Run the app:
   `npm run dev`
