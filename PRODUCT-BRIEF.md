# wealthOS — Product Brief (Together + Wealth-Building Direction)

*Companion to REVAMP.md. REVAMP.md covers the technical restructure (Phases 1–2, largely done). This brief covers the product strategy and what to build next, especially the Together surface and the "help build wealth" promise. Written after the strategy session of 2026 — treat as the source of intent when building new features.*

---

## 1. What this product is (one paragraph)

A global, personalization-first wealth-building instrument for ambitious couples who are seriously trying to build wealth together — fast, accurate, and honest. It is not a budgeting app and not a spreadsheet with a nicer skin. Its job is to make a couple feel their real progress toward a shared financial future, and to keep them coming back not out of obligation but because opening it feels good and earned. The moat is depth of personalization (goals, faith, risk-appetite) — the thing that makes it un-generic and hard for Monarch/Honeydue to copy. The soul is an honest "financial influencer in an app": it explains the world and makes it relevant to a couple's real situation, without ever telling them what they *should* do.

## 2. Strategic position (and the graveyard we avoid)

- **Global from day one** — deliberately. Indonesian consumers under-pay for software; the business needs global reach for revenue. Faith/Zakat is NOT the target market — it is one *personalization layer*.
- **The trap we avoid:** "a better couples app" is not a strategy. Everyone who competed on that alone lost. Plenty — best-funded couples wealth app ever (Kevin Durant / Esther Perel backing, $150–200/yr) — was forced free, pivoted, and folded into Wealthsimple. Honeydue/Zeta made "couples" free, so that feature's market price is now $0. Monarch owns "premium household finance" ($95M raised, 500k+ subs) and shipped couples views in late 2025.
- **Why we survive where Plenty died:** Plenty died from broad-but-generic, not from being broad. Our escape is that **deep personalization is itself the differentiation** — an app that genuinely adapts to a couple's faith, goals, and risk appetite is not something built on one-size-fits-all rails can cheaply copy. Global reach + personal feel, where the personalization is the moat.

## 3. The four product pillars

1. **Earned dopamine.** Every hit of delight is anchored to a *real, verifiable* improvement. "You moved your Freedom Date 11 days closer" is dopamine AND honest. A fake streak or confetti over a number that didn't truly move is forbidden — in a wealth app, good feelings attached to false signals lull couples into thinking they're winning when they're not. Delight is engineered *around truth*, never instead of it. This is the hardest and most defining pillar: it's what makes the app feel alive without becoming a lie.
2. **Personalization as moat.** Goals, faith (Zakat native-but-optional), and risk-appetite are layers each couple lights up. A Muslim couple sees Zakat as first-class; a non-Muslim couple never sees it and loses nothing. Same engine, different layers — inclusive by design, personal in feel.
3. **Honest influencer, not advisor.** The app explains markets and wealth principles, made timely and relevant by the couple's real data — but never crosses into "you should." (See §5 — this is a legal boundary, not a style choice.)
4. **Shared, not solo.** The unit is the couple. The core emotional payload is "*we* are winning at *our* future," not two individual dashboards side by side.

## 4. The Together surface — three layers, in build order

**Layer 1 — The "We're Winning" instrument (build first, lowest risk).**
A shared progress signal built from data the app already has. Real movement toward the couple's chosen Freedom Date and joint net worth. Examples: "You moved your Freedom Date 11 days closer this month." "Joint net worth +X% this quarter." "You've both checked in 3 weeks running." This is the earned-dopamine core and the reason to open the app weekly. Pure reorganization of existing data — buildable soon, safely.

**Layer 2 — The Alignment layer (build second, needs a real formula).**
A genuine PartnershipScore derived from *actual behavior* — both partners contributing to joint goals, settlements current, Freedom Date trending the right way — NOT a personality quiz and NOT an invented number. It answers "are we actually rowing together?" Requires a carefully designed formula from real signals; do not ship a faked or hardcoded score.

**Layer 3 — The Influencer layer (build LAST, and separately — highest value AND highest risk).**
Educational market/wealth commentary, made timely by the couple's real holdings, with NO recommendations. This is where the "not another Excel app" magic lives and where the legal line sits. Gets its own dedicated design pass and a fintech lawyer's review before launch. Do not build this tonight or next; it depends on §5.

## 5. The influencer legal boundary (read before building Layer 3)

The line between education and regulated advice is thin and regulators drew it to catch clever walk-arounds. "Global from day one" multiplies this — every jurisdiction (Indonesia/OJK, US/SEC, EU, etc.) draws it differently.

- **Legal (education):** "Here's what rising rates historically mean for bond-heavy portfolios like yours." General principle, applied to a category, made relevant by their data.
- **Illegal-without-a-license (personalized advice):** "The market's doing X, you hold Y, so consider Z." The moment a *specific reading* attaches to *their specific holdings* and implies an action, it's advice — disclaimer or not. An influencer talks to a crowd; an app talks to one couple about their actual portfolio, which is the exact fact pattern regulators treat as advice.
- **v1 decision (chosen):** Build the *defensible* version — general explainers made timely/relevant by their data, but never "you should." An LLM left loose WILL drift across this line, so the AI prompt design must hard-enforce "explain, never recommend."
- **Non-negotiable:** a real fintech lawyer reviews Layer 3, across target jurisdictions, before it ships. This is the difference between a $99/yr app and a liability.

## 6. Delight / design direction (grounded, not decoration)

Per the earned-dopamine pillar, delight is a design discipline:
- **The hero is the win, not the number.** The most characteristic moment is *progress made visible* — the Freedom Date moving, framed as a shared achievement — not a big balance with a gradient. Lead every key surface with the true thing that improved.
- **Motion serves truth.** A reveal animation is earned when it reveals a *real* gain (the date moving closer on the weekly report). Ambient/scattered animation that doesn't mark a real event reads as fake and is cut.
- **The weekly report is the signature ritual.** The thing a user "can't wait for": a weekly, couple-level summary of real wins — for me, for my partner, for us together. This is the retention engine and the emotional heart. Design it as the one memorable moment; keep everything around it quiet.
- **Empty/early states teach and invite** ("Add last month's statement to see your first Freedom Date"), never dread. A brand-new couple with no data must still feel a path, not a wall of zeros.
- **Copy from the user's side:** name things by what the couple controls and recognizes; plain verbs; the same word through a whole flow.

## 7. What is NOT this product (guardrails against drift)

- Not a bank-sync aggregator race (statement-upload + AI-parse is the deliberate architecture; see REVAMP.md).
- Not a personalized robo-advisor (that's Layer-3-with-a-license, a different, later company).
- Not a gamification theme park — the ONLY reward system is earned, real-progress delight (no virtual pets, no fake streaks; the deleted ManorAndKiko cat stays deleted).
- Not generic-for-everyone — personalization layers make it personal; that IS the inclusivity.

## 8. Sequenced build plan (what to actually do, in order)

**Now / next (safe, high-value):**
1. Finish REVAMP.md Phase 2 leftovers when rested: populate Together *Layer 1* (the "We're Winning" instrument) using existing data; fix the pre-existing NaN bug on Mine (IndividualSanctuary divides by zero when income is 0); deferred polish (i18n, design tokens, ActiveTasks trim).
2. Design and build the **weekly report** ritual — the signature retention moment (§6). This is the highest-leverage single feature for the "can't wait to open it" goal.

**Soon (needs design thought):**
3. Together *Layer 2* — the real PartnershipScore formula from actual behavior.
4. The personalization engine scaffold (goals / faith / risk-appetite as configurable layers).

**Later (needs legal + careful design):**
5. Together *Layer 3* — the educational influencer layer, AFTER a fintech lawyer reviews the boundary across target jurisdictions.

**Before ANY public launch (pre-launch list, separate from features):**
- Two-person privacy test passed in production (partner cannot see private balances) — verified once already in dev; re-verify in prod.
- Working password reset flow (currently broken).
- Google auth provider enabled in Supabase (currently throws "provider is not enabled") or the button hidden.
- Payments (Xendit preferred for IDR + local methods; Stripe for global).
- Onboarding for a cold couple: signup → invite partner → first Freedom Date in under ~20 min.
- Real-user error handling and empty states.

## 9. The honest scope note

This brief describes a *company*, not a weekend feature. What's decided here — global, personalization-layered, influencer-souled, earned-dopamine wealth-building — implies real investment features, a personalization engine, market-data integration, and multi-jurisdiction legal work: weeks-to-months, and some of it needs a lawyer before it can legally exist. The current app is a solid, secure, modular foundation. Build against this brief in the sequence above; don't try to build the whole vision in one pass. The single most important discipline is Pillar 1: every delightful moment must be earned by a true improvement — that is simultaneously the product's soul and its integrity.
