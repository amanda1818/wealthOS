# REVAMP.md — wealthOS → "Duo" Revamp Instructions for Claude Code

This document is the single source of truth for revamping this repository. Follow it phase by phase. Do not add features not listed here. When in doubt, cut.

## 0. Mission and strategy (read first, it governs every decision)

We are NOT beating Monarch at Monarch's game (13,000 bank integrations, feature breadth, US market). We beat Monarch on the one dimension a busy dual-income couple actually feels: **time-to-alignment**. Monarch asks couples to browse a rich dashboard; we give them a 30-second daily glance, a 15-minute weekly ritual, and one number that moves. Target user: a working couple in Indonesia/SEA with combined high income, two banks each, kids or demanding jobs, and zero patience. They will not "explore" an app. They will use what fits inside a coffee break, and they will stay because their data compounds and their partner is in it too.

**The one number:** the Freedom Date — the projected date the Independence Gap (committed monthly burn − passive yield) hits zero. Every surface must either move this number or explain it. If a screen does neither, it doesn't ship.

**The dependency loop (this is the product):**
- Daily (30 seconds, optional): open app → Today screen answers "are we okay this month?" in one glance → close.
- Weekly (15 minutes, the core ritual): "Money Date" — a guided Sunday flow: confirm AI-categorized transactions → settle who-owes-who → see the Freedom Date move → one AI insight → done. Streak counted per couple, not per user.
- Monthly (5 minutes): payday → run Waterfall allocation; statement PDFs arrive → upload → AI parses → verify queue feeds next Money Date.
Dependency = ritual + compounding history + partner accountability. Not notifications spam, not gamification sprawl.

## 1. Non-negotiable design principles

1. **Five-second rule.** Every screen must answer its one question within 5 seconds of loading. Today: "are we okay?" Flow: "where is money going?" Together: "are we settled and aligned?" Freedom: "when are we free?" Mine: "what's mine?"
2. **Zero modals.** The current app has showRevenueModal, showPremiumModal, showHeritageGuide, showDeficitModal, showControlTower, showMobileConsole, showClaimsDesk plus toasts. Replace ALL modals with either (a) inline expansion, (b) a dedicated route, or (c) a single bottom-sheet pattern used sparingly for confirm actions. Toasts survive only for undoable action confirmations.
3. **One of everything.** One dashboard. One assistant. One projection engine. One settings surface. Duplicates are merged per the disposition table in §3.
4. **Progressive disclosure.** Default view = the number + trend. Tap = the why. Tap again = the detail. Never show a table where a sentence works.
5. **Plain names, bilingual.** UI copy in EN + Bahasa Indonesia (i18n keys from day one). Kill theatrical jargon in the UI: "Sovereignty Audit" → "Freedom Gap"; "System Burden" → "Debts"; "Heritage" → "Investments"; "Meja Piutang" stays (it's the correct local term) with EN label "Owed to Us". Marketing can keep the poetry; the UI cannot.
6. **Couple-first defaults.** Every entity carries scope: OURS | MINE | THEIRS. The Sanctuary (MINE) is sacred: nothing scoped MINE ever renders in the partner's views, exports, or AI context. Enforce at the data layer, not the component layer.
7. **Offline-tolerant, sync-backed.** Local-first cache is fine; localStorage as the ONLY store is not (see Phase 1).

## 2. Target information architecture

Five bottom-tab surfaces + one floating assistant. Nothing else at top level.

| Surface | Question it answers | Absorbs (from current code) |
|---|---|---|
| **Today** | Are we okay this month? | ExecutiveDashboard (hero: Freedom Date + monthly burn dial) + ActiveTasks (top 3 only) + GlobalSearchBar |
| **Flow** | Where does money go? | Ledger + TransactionList + WaterfallTier + RecurringManager + VampireHunter + IntelligenceDesk + BankUpload (rebuilt) + PocketCard/PocketDetail |
| **Together** | Are we settled & aligned? | PartnershipScore + SettlementCard + Meja Piutang/Claims desk + ValuesCompass (as one-time onboarding quiz + quarterly re-check) + MergerSimulator (also exposed as public unauthenticated route /simulate for acquisition) |
| **Freedom** | When are we free? | GapDetails + FreedomVelocity + CrystalBall → ONE projection engine with scenario sliders + Fortress (goals/assets) |
| **Mine** | What's mine? | IndividualSanctuary (private pockets, private reserve; partner-invisible by data-layer guarantee) |
| Assistant (floating) | Do it for me / explain this | MagicAssistant + AdvisorChat + AlphaConcierge → one "CFO" chat; premium gating happens INSIDE it (free: 5 messages/week; paid: unlimited-with-fair-use) |

## 3. Component disposition table (execute exactly)

**KEEP (refactor in place):** Ledger (737 lines — split into LedgerView + TransactionRow + filters), ExecutiveDashboard (becomes Today), Fortress, WaterfallTier, IndividualSanctuary, MergerSimulator, PartnershipScore, SettlementCard, VampireHunter, RecurringManager, ValuesCompass, PocketCard, PocketDetail, TransactionList, GlobalSearchBar, GapDetails (becomes the Freedom engine core).

**MERGE:** ControlTower → into Today (delete the overlay; its unique widgets become Today cards). CrystalBall + FreedomVelocity → into the Freedom projection engine (one engine, scenario params). MagicAssistant + AdvisorChat + AlphaConcierge → one Assistant component; AlphaConcierge's upsell content becomes the Assistant's paywall state, not a separate destination. IntelligenceDesk → into Flow as the "Insights" card row. ActiveTasks (514 lines) → strip to a 3-item "Needs attention" card on Today; the full task system is out of scope.

**CUT (delete files, migrate nothing):** ManorAndKikoDesk.tsx (407 lines of virtual-cat/home chore gamification — charming, but it competes with the core ritual for attention and is why the app feels like a theme park; if Kiko must live, it becomes the streak mascot on the Money Date completion screen, max 30 lines). FocusCompass.tsx (234 lines, overlaps ValuesCompass + gamification; ValuesCompass wins because it produces couple-alignment data the AI can use). BurnDial.tsx and BankUpload.tsx are 0-line dead files — delete; BankUpload is rebuilt fresh in Phase 3 as StatementUpload.

**DELETE from code, not UI:** the hardcoded "Victoria/David/HER/HIS" personas inside services/geminiService.ts SYSTEM_INSTRUCTION. Household context must be injected at runtime from real state.

## 4. Phased execution plan (each phase ends green before the next starts)

### Phase 1 — Make it safe to charge money (blockers; nothing ships without these)
1. **Server-side AI.** Move ALL Gemini calls out of the client into Supabase Edge Functions (supabase-js is already in package.json). The client must never see an API key. Add per-household rate limiting (protects inference margin) and a usage counter for tier gating.
2. **Real persistence + auth.** Supabase Postgres with Row-Level Security. Schema: households (id) → users (id, household_id, role) → pockets / transactions / liabilities / goals / claims (all carry household_id + scope OURS|MINE, owner_user_id). RLS: a user reads household rows EXCEPT rows where scope=MINE and owner ≠ self. Supabase Auth (email + Google). Migrate the localStorage AppState shape via a one-time import on first login; keep localStorage only as an offline cache with sync reconciliation (last-write-wins per row, updated_at).
3. **Secrets & config hygiene.** No process.env in client code paths that carry secrets; .env.example added; vite config cleaned.
Acceptance: app runs with zero secrets in the bundle (verify via build output grep); two test users in one household see shared data; MINE rows invisible cross-user at the SQL level; AI answers via edge function only.

### Phase 2 — Structural refactor (the streamlining)
1. Split App.tsx (2,024 lines) into: routes/ (five surfaces), state/ (Zustand or Context+reducer — pick Zustand), and shared ui/ primitives (Card, Sheet, Stat, EmptyState). No component over 300 lines.
2. Execute the §3 disposition table: merges first, then cuts. Delete all six modal state flags; implement the single BottomSheet primitive.
3. i18n scaffold (EN/ID) with the §1.5 renames. One design token file: spacing, type scale (max 2 font sizes per screen), one accent color; dark mode preserved.
Acceptance: 4 old tabs → 5 new surfaces; grep finds zero references to cut components; no modal flags; App.tsx < 150 lines; every screen loads its answer with at most one network roundtrip.

### Phase 3 — The wedge features (what beats Monarch for OUR user)
1. **StatementUpload (rebuild).** PDF/CSV upload → edge function → Gemini parse to a strict JSON schema (date, description, amount, direction, guessed pocket, confidence) → verify queue UI where low-confidence rows need one tap to confirm. Ship parsers tuned for BCA, Mandiri, BRI, BNI, Jago statement formats first; store parse corrections as training signal (this correction corpus is the future data moat).
2. **Money Date flow.** A single guided route: unconfirmed transactions → settlements due → Freedom Date delta since last week ("You moved your freedom date 11 days closer") → one AI insight → couple streak. Completable in under 15 minutes; show a timer-free progress bar (steps, not time).
3. **Waterfall as payday ritual.** "Salary landed" entry point (manual or parsed) → animated cascade through tiers → Zakat computed automatically where enabled → one-tap execute.
4. **Freedom engine.** One projection component: inputs (burn, yield, contribution rate) → Freedom Date + sensitivity sliders ("if we cut Rp 2jt/month → 14 months sooner"). CrystalBall/FreedomVelocity logic folds in here.
Acceptance: a new couple can go from signup → merged view → first Money Date in under 20 minutes with only statement uploads (no bank API); parsing ≥90% field accuracy on 5 sample statements per supported bank (add fixtures to repo).

### Phase 4 — Monetization plumbing
Free: single player, 3 pockets, 1 statement upload/month, 5 assistant messages/week, Merger Simulator public. Duo (Rp 79k/mo, Rp 790k/yr): both partners, unlimited pockets + Waterfall, Sanctuary, Zakat engine, 10 uploads/mo. Sovereign (Rp 149k/mo): unlimited assistant (fair-use), Vampire Hunter, Freedom scenarios, priority parsing. Implement gating as capability checks from the household row (plan, seats), never as hidden UI — locked features render with a one-line value prop and price, no modal, no separate Concierge page. Stripe or Xendit (prefer Xendit for IDR/local payment methods).
Acceptance: plan changes flip capabilities without redeploy; usage counters enforce AI limits server-side.

### Phase 5 — Polish for the habit
PWA (installable, offline cache of last snapshot); push notification for exactly TWO events only: partner completed their Money Date part, and weekly Money Date reminder (user-scheduled day/time) — nothing else, ever; empty states that teach ("Upload last month's statement to see your first Freedom Date"); perf budget: Today interactive < 2s on a mid-range Android.

## 5. What NOT to do
Do not add any new feature category. Do not add more gamification (the streak + Freedom Date delta is the entire reward system). Do not reintroduce modals. Do not build bank-API sync (statement upload IS the strategy for this market). Do not keep dead code "just in case" — git history is the just-in-case. Do not let any single component exceed 300 lines. Do not write UI copy that requires the PRD to understand.

## 6. Definition of done (product-level)
A busy couple, starting cold: signup → invite partner → upload 2 statements each → see Freedom Date, in ≤20 minutes. Weekly ritual ≤15 minutes. Daily glance ≤30 seconds. Zero modals. One assistant. One number that moves. If a change doesn't serve one of those sentences, revert it.
