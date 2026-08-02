# PICKUP NOTE — Start Here When You Return (September)

*You're reading this after a month away. Don't try to remember anything — this note has it all. Read top to bottom, then start at §5.*

---

## 1. The 30-second refresher: what this project is

wealthOS → a global, personalization-first wealth-building app for ambitious couples. Honest, fast, delightful. Full strategy is in **PRODUCT-BRIEF.md**. Technical restructure plan is in **REVAMP.md**. A rigorous, tested-not-guessed audit of what actually works is in **FEATURE-AUDIT.md** (written 2026-08-02 — re-read it, then trust §3 below over it where they conflict, since more was built and fixed after it was written). Both PRODUCT-BRIEF.md and REVAMP.md are in the repo root. Read PRODUCT-BRIEF.md first when you're back — it's the "why."

## 2. What is DONE and working (as of this session, 2026-08-03)

- **Secure backend live.** Supabase project `vszpffixxacjvsqzdzmd` (Singapore). Gemini API key is server-side only (Edge Function `ai-gateway`), never in the browser. Data is in Postgres with Row-Level Security, not localStorage.
- **Two-person auth works.** You (aadestia@gmail.com) and Bisma (bismareyhansyah05@gmail.com) are a real household. Verified live.
- **Privacy verified.** Transparent/Private toggle tested: in Private mode, a partner genuinely cannot see the other's personal balance (RLS-enforced). This is the app's core promise and it holds — in dev. Re-verify in production before launch.
- **Phase 1 (backend) — complete.**
- **Phase 2 (streamline) — core complete:** dead components deleted, all modals removed, 3 assistants merged into 1, 3 projection views merged into the Freedom engine, five-surface restructure done (App.tsx 2,000 → ~300 lines, state in `state/store.ts` Zustand, selectors in `state/selectors.ts`).
- **Together tab is now real, not a placeholder:**
  - **Layer 1 ("We're Winning")** — real Freedom Date + net worth movement since the household's last check-in, honest empty state on first visit, real regressions shown plainly. Reload-tested, persists correctly.
  - **Layer 2 (Partnership Score)** — real behavior-derived score (joint contribution, settlement currency, Freedom Date trend), each component independently gated on having real data, never fabricated. Transparent breakdown shown under the gauge.
  - **Weekly Report** — the signature ritual (PRODUCT-BRIEF.md §6), a dedicated full-screen route reached from a banner on Together. For You / For Partner / For Us, all real, rolling 7-day windows, quiet weeks shown honestly as quiet.
- **Mine tab's NaN% bug is fixed** (pact-obligation progress now guards divide-by-zero).
- **All hardcoded "David"/"Victoria" persona leaks removed**, codebase-wide, in two passes — seed data (`state/initialState.ts`) and two remaining always-visible UI/toast strings (`ActiveTasks.tsx`, `state/store.ts`). Final grep confirmed zero user-visible occurrences left. **One exception: see §3.**
- **ai-gateway 502s root-caused and fixed:** the pro-tier model name was invalid (`gemini-3-pro-preview` doesn't exist; fixed to `gemini-3.1-pro-preview`, verified against Google's live docs, not guessed) and the catch-all error handler now surfaces real status/message instead of flattening everything into an opaque 502. **Needs one live re-check — see §5, item 1.**
- **Everything is committed and pushed to main.** Last commit: `aa1f4c0`. Nothing is unsaved. The `phase2-restructure` branch still exists from the big restructure (can delete: `git branch -d phase2-restructure`).

## 3. Known bugs / half-done (NOT blocking, but know about them)

- **AI Chat needs one live re-check.** The ai-gateway fix (model name + error surfacing) is deployed and code-verified, and two of the other four AI action branches (Whisper command bar, Invoke AI Assistant) were re-confirmed working live post-fix. But Chat's own live success couldn't be confirmed the same night — the household's daily AI quota (`AI_DAILY_REQUEST_LIMIT`, default 150/day) was exhausted from testing, not from a code issue. Very likely fixed; just needs the one click. **This is DO-THIS-FIRST item #1 below.**
- **Receipt/image parsing (multimodal) is unreachable through the UI — separate bug, not the model-name one.** `BottomNav.tsx`'s `handleImageSelect` never calls `setSelectedImage`, so `parseMultimodal` can never fire no matter what model it points at. Wire this up when building StatementUpload/receipt upload in Phase 3 — don't forget it's broken independently of the AI fix.
- **One stale chat message survives in your own account.** Your household's Chat history still has the old "Greetings David & Victoria..." message, persisted before the seed-data fix. New signups will never see this (the seed message was removed entirely); only your test account has the old row. Cosmetic only — delete it via Supabase Table Editor (`advisor_messages` table) if it bothers you; not worth automating a cleanup for one row.
- **Password reset flow is broken / missing.** Real users will hit this. Must fix before launch.
- **Google sign-in throws "provider is not enabled."** Either enable Google in Supabase → Authentication → Sign In/Providers (needs Google OAuth setup), or hide the button. Broken until then. (Not re-verified live this session — see FEATURE-AUDIT.md for why.)
- **App.tsx is ~300 lines**, not REVAMP's <150 target. Fine. Not a priority.
- **Together tab's remaining content is still unbuilt on purpose.** MergerSimulator/SettlementCard/ValuesCompass/VampireHunter are still orphaned (never mounted). ValuesCompass specifically has fake, hardcoded quiz-scoring logic — needs real scoring built, not just wiring, before it ever ships.

## 4. The strategy decisions locked in this session (so you don't re-litigate them)

- **Global from day one**, not Indonesia-only (no money in ID-only; need global scale).
- **Personalization is the moat**, not a niche: goals + faith (Zakat native-but-optional) + risk-appetite as layers. Inclusive by design, personal in feel.
- **"Financial influencer in an app," NOT an advisor.** Explain the world, made timely by their data, but NEVER "you should." This is a legal line (see PRODUCT-BRIEF.md §5) — the influencer/market-commentary feature needs a fintech lawyer before it ships. Do not build that layer without legal review.
- **Earned dopamine is the soul.** Every delightful moment must be anchored to a REAL improvement. No fake streaks, no confetti over numbers that didn't truly move. Together Layers 1/2 and the Weekly Report were all built to this rule — every component that lacks real data is *excluded*, never defaulted to 0 or 100 or a placeholder.

## 5. DO THIS FIRST when you return (in order)

1. **Verify AI Chat live (5 min).** Open the Assistant → Chat tab, send any message, confirm it responds with a real answer — not "Alpha Strategist is offline," not a 502, not a 429 (quota resets daily, so this should be clear by September). This closes the loop on the ai-gateway fix. If it still fails, check the Network tab for the *specific* status/message now surfaced by the fix — that'll tell you immediately whether it's the same issue or something new, instead of another opaque 502 hunt.
2. **Re-orient (10 min):** read PRODUCT-BRIEF.md, then skim this note's §2–4 and FEATURE-AUDIT.md. Run the app locally (`npm run dev`), log in, click all 5 tabs, confirm it still works. Nothing should have changed — it's all committed.
3. **THE MAIN EVENT — keep building on Together.** Layer 1 and Layer 2 are real and live; the Weekly Report is real and live. What's left on Together per PRODUCT-BRIEF.md §4/§8: Layer 3 (educational influencer layer) needs a fintech lawyer first — don't build it without that. Otherwise, decide what to do with the orphaned MergerSimulator/SettlementCard/ValuesCompass/VampireHunter (§3).
4. **Then the pre-launch list** (§6) — password reset and Google auth are the two real blockers left.

## 6. The build order after that (from PRODUCT-BRIEF.md §8)

- Personalization engine scaffold (goals/faith/risk-appetite layers).
- Together Layer 3 (educational influencer layer) — ONLY after a fintech lawyer reviews it.
- Pre-launch list: prod privacy re-test, **password reset**, **Google auth or hide it**, payments (Xendit for IDR + Stripe global), cold-couple onboarding, error/empty states, wire up receipt/multimodal parsing (§3) before shipping StatementUpload.

## 7. The one rule that matters most

Every delightful moment must be earned by a true improvement. That's the product's soul AND its integrity. When in doubt about any feature, ask: "does this make the couple feel a real win, or a fake one?" Build the real one. Together Layers 1/2 and the Weekly Report are the reference implementation of this rule — look at how they handle "not enough data" if you need a template for the next feature.

## 8. Working notes for the tools

- Git loop: `git add -A && git commit -m "..." && git push` from `~/Documents/wealthOS`. Push authenticates as `timorbuild-tech` (collaborator with write access).
- Supabase CLI commands (`login`, `link`, `db push`, `functions deploy`, `secrets set`, `secrets list`) work fine from Claude Code's sandbox once already linked/authenticated (confirmed working repeatedly this session) — the earlier caution about needing your own terminal was about the *first-time interactive* `login`/`link`, not routine use afterward. `supabase db dump` is the exception: it shells out to `pg_dump` via Docker, which isn't running in the sandbox, so reading table data directly isn't currently possible from here — only schema changes (migrations) and function deploys are.
- Claude Code cannot log into your app (no typing passwords) and won't read out session auth tokens even via injected JS — that boundary held firm this session when tested. It writes and tests code against your already-logged-in session; you own the credentials and the first login.
- Always test new features live in the browser, not just "it compiles." Every real bug this project hit — the postponedTaskIds sync gap, the NaN%, the ai-gateway model name, the persona-name leaks — was caught by clicking and grepping, not by the build passing.
