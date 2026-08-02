# PICKUP NOTE — Start Here When You Return (September)

*You're reading this after a month away. Don't try to remember anything — this note has it all. Read top to bottom, then start at §5.*

---

## 1. The 30-second refresher: what this project is

wealthOS → a global, personalization-first wealth-building app for ambitious couples. Honest, fast, delightful. Full strategy is in **PRODUCT-BRIEF.md**. Technical restructure plan is in **REVAMP.md**. Both are in the repo root. Read PRODUCT-BRIEF.md first when you're back — it's the "why."

## 2. What is DONE and working (as of this session)

- **Secure backend live.** Supabase project `vszpffixxacjvsqzdzmd` (Singapore). Gemini API key is server-side only (Edge Function `ai-gateway`), never in the browser. Data is in Postgres with Row-Level Security, not localStorage.
- **Two-person auth works.** You (aadestia@gmail.com) and Bisma (bismareyhansyah05@gmail.com) are a real household. Verified live.
- **Privacy verified.** Transparent/Private toggle tested: in Private mode, a partner genuinely cannot see the other's personal balance (RLS-enforced). This is the app's core promise and it holds — in dev. Re-verify in production before launch.
- **Phase 1 (backend) — complete.**
- **Phase 2 (streamline) — core complete:**
  - Deleted dead/clutter components (virtual cat ManorAndKiko, FocusCompass, dead files).
  - Removed all modals (BottomSheet for Revenue/Deficit, ControlTower is now a routed screen, premium gates are inline).
  - Merged 3 AI assistants → 1 Assistant (Chat + Priorities + badge).
  - Merged 3 projection views → 1 Freedom engine (with persisted Life Cards scenarios).
  - **Five-surface restructure done:** App.tsx went 2,000 → 302 lines. Surfaces: Today / Flow / Freedom / Mine / Together. State in Zustand (`state/store.ts`), selectors in `state/selectors.ts`.
- **Everything is committed and pushed to main.** Last commit: `af05b2c`. Nothing is unsaved. The `phase2-restructure` branch still exists (can delete: `git branch -d phase2-restructure`).

## 3. Known bugs / half-done (NOT blocking, but know about them)

- **NaN% on Mine tab.** IndividualSanctuary divides by zero when a user's monthlyIncome is 0 (true for your real accounts). Pre-existing, exposed when Mine was first mounted. Small logic fix — guard the division.
- **Together tab is a placeholder.** It's an empty shell by design — its real content (below) was deliberately deferred to be built with a fresh head. This is your main build target in September.
- **Password reset flow is broken / missing.** Real users will hit this. Must fix before launch.
- **Google sign-in throws "provider is not enabled."** Either enable Google in Supabase → Authentication → Sign In/Providers (needs Google OAuth setup), or hide the button. Broken until then.
- **App.tsx is 302 lines**, not REVAMP's <150 target. Fine. Not a priority.

## 4. The strategy decisions locked in this session (so you don't re-litigate them)

- **Global from day one**, not Indonesia-only (no money in ID-only; need global scale).
- **Personalization is the moat**, not a niche: goals + faith (Zakat native-but-optional) + risk-appetite as layers. Inclusive by design, personal in feel.
- **"Financial influencer in an app," NOT an advisor.** Explain the world, made timely by their data, but NEVER "you should." This is a legal line (see PRODUCT-BRIEF.md §5) — the influencer/market-commentary feature needs a fintech lawyer before it ships. Do not build that layer without legal review.
- **Earned dopamine is the soul.** Every delightful moment must be anchored to a REAL improvement. No fake streaks, no confetti over numbers that didn't truly move. This is why the weekly report wasn't rushed at the end of a long day — it has to be built honest, not fast.

## 5. DO THIS FIRST when you return (in order)

1. **Re-orient (10 min):** read PRODUCT-BRIEF.md, then skim this note's §2–4. Run the app locally (`npm run dev`), log in, click all 5 tabs, confirm it still works. Nothing should have changed — it's all committed.
2. **Warm-up fix (30 min):** fix the NaN bug on the Mine tab. Small, satisfying, gets you back in the code. Instruction for Claude Code: *"Fix the NaN% on the Mine tab — IndividualSanctuary divides by zero when monthlyIncome is 0. Guard the division so it shows 0% or an empty state instead of NaN."* Commit + push.
3. **THE MAIN EVENT — build Together Layer 1, the "We're Winning" instrument** (PRODUCT-BRIEF.md §4). This is the highest-value feature and the reason to open the app weekly. Build it with care, fresh — it's the emotional core. It shows real, honest progress toward the couple's Freedom Date and joint net worth ("You moved your Freedom Date 11 days closer this month"). Use only data the app already has. This is earned-dopamine Pillar 1 made real. Design it deliberately; don't rush it.
4. **Then the weekly-report ritual** — the signature "can't wait to open it" moment. Also earned-dopamine. PRODUCT-BRIEF.md §6.

## 6. The build order after that (from PRODUCT-BRIEF.md §8)

- Together Layer 2 (real PartnershipScore from actual behavior — not a quiz).
- Personalization engine scaffold (goals/faith/risk-appetite layers).
- Together Layer 3 (educational influencer layer) — ONLY after a fintech lawyer reviews it.
- Pre-launch list: prod privacy re-test, password reset, Google auth or hide it, payments (Xendit for IDR + Stripe global), cold-couple onboarding, error/empty states.

## 7. The one rule that matters most

Every delightful moment must be earned by a true improvement. That's the product's soul AND its integrity. When in doubt about any feature, ask: "does this make the couple feel a real win, or a fake one?" Build the real one.

## 8. Working notes for the tools

- Git loop: `git add -A && git commit -m "..." && git push` from `~/Documents/wealthOS`. Push authenticates as `timorbuild-tech` (collaborator with write access).
- Supabase CLI commands (`login`, `link`, `db push`, `functions deploy`, `secrets set`) must run in YOUR OWN terminal, never inside Claude Code's sandbox (it's non-TTY and can't do browser auth — it will fail with LegacyLoginMissingTokenError).
- Claude Code cannot log into your app or your Supabase account — that's always you. It writes and tests code; you own the credentials and the live testing.
- Always test new features live in the browser with two users before trusting "it compiles." Every real bug this project hit was caught by clicking, not by the build passing.
