# RIndex — Claims Audit

Factual and functional claims made by the UI that are false, misleading, unverifiable,
or true only under an unstated condition.

Per the audit brief, **nothing in this table was silently removed or rewritten to hide a
problem**. Where a claim was reworded during the polish pass, the "current implementation"
column records both the old and new wording so the underlying issue stays reviewable.

Informal, obviously-rhetorical design copy is excluded. This list covers claims a
reasonable user could act on or be misled by.

Severity key — **Critical**: actively misleads about security or privacy in a way that could
change user behavior. **High**: presents modeled or invented values as measured fact.
**Medium**: overstates capability, precision, or scope. **Low**: imprecise but low-consequence.

---

## Summary

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 6 |
| Medium | 11 |
| Low | 5 |
| **Total** | **22** |

---

## Privacy and data-handling claims

| # | Page / component | Exact claim | Why it may be misleading | Actual implementation | Severity | Recommended correction | Source file |
|---|---|---|---|---|---|---|---|
| 1 | Crypto Lab footer | "No input is ever sent, stored, or logged." | True of the app's own code, but the page is served from a host (Vercel) that necessarily logs the HTTP request and IP address for the page load itself. The claim reads as an absolute guarantee covering the whole session. | No `fetch`/XHR/WebSocket anywhere in `src/`. All computation is local. Hosting-layer request logs are outside the app's control and are not mentioned. | Medium | Scope the claim: "Your input is never sent anywhere — it is processed in this page." Optionally note that the host sees the page request itself, like any website. | `src/pages/CryptoLab.tsx` |
| 2 | Methodology footer | "No answers, toggles, or inputs are transmitted, stored, or logged." | Same scoping issue as #1. Also "stored" is now only *mostly* true — see #4. | Same as above. | Medium | Same as #1. | `src/pages/Methodology.tsx` |
| 3 | Dashboard footer | "Reload this tab and your profile is gone." | Accurate for the profile, but sits next to "No answers were transmitted, stored, or logged", which is now imprecise because the app does write one localStorage key. | Profile lives in React Context only (`src/store/profile.tsx`), verified in-memory. Reload does clear it. | Low | Keep the reload sentence; qualify the "stored" sentence as "no answers are stored". | `src/pages/Dashboard.tsx` |
| 4 | Global / Footer / Preferences | Implied throughout: RIndex stores nothing on your device. Footer strapline still reads "no telemetry · no cookies · no analytics". | The reduced-motion preference **is** persisted to `localStorage` under `rindex-reduce-motion`. It is not personal data and not a cookie, but blanket "stores nothing" phrasing is now inaccurate. | `setReduceMotionOverride()` writes `localStorage`. Service worker also caches app assets on disk (by design, for offline). | Medium | Add one line to the privacy copy: "The only thing saved on your device is your display preference, plus the offline cache." | `src/lib/reduce-motion.ts`, `src/lib/pwa.ts`, `src/components/layout/Footer.tsx` |
| 5 | Home — TrustStrip | "Passwords never touch localStorage, sessionStorage or the network." (now: "What you type in the Password Lab is never written to storage or sent anywhere.") | **Verified true.** Listed only to record that it was checked, since it is the strongest privacy claim on the site. | Password lives in `useState` in `PasswordLab`, cleared on unmount. No storage or network writes. No logging. | Low | None. Claim is accurate. | `src/pages/PasswordLab.tsx`, `src/components/home/TrustStrip.tsx` |
| 6 | Home — Hero | "Works offline after first visit" | Accurate as worded. Recorded because the earlier wording ("Works fully offline") was false on a cold first load. | `vite-plugin-pwa` `generateSW`, 26 precached entries, `navigateFallback` to `index.html`. Verified offline for all routes. | Low | None. Already corrected. | `vite.config.ts`, `src/components/home/Hero.tsx` |
| 7 | Home — Hero / TrustStrip | "Open source & auditable", "Source you can read", links to `github.com/homophobiaa/Rindex` | Repository visibility cannot be verified from the codebase. If the repo is private, both claims are false and the footer links 404 for users. | Links are hardcoded. No license file is referenced in-repo besides the footer link to `/blob/main/LICENSE`. | Medium | Confirm the repo is public and that `LICENSE` exists at that path, or remove the claims and links. **Left for manual review — cannot be checked from source.** | `src/components/layout/Footer.tsx`, `src/components/layout/Navbar.tsx` |

## Modeled numbers presented as measurements

| # | Page / component | Exact claim | Why it may be misleading | Actual implementation | Severity | Recommended correction | Source file |
|---|---|---|---|---|---|---|---|
| 8 | Dashboard, Assessment, Methodology | "Attack-success probability — X% against your current posture" (Methodology now: "Modeled attack success") | Presented as a probability with a concrete percentage. It is **not** derived from any empirical data. It is a smoothstep curve of the risk score: `x²(3−2x)`. Two different users with the same score always get the same "probability" regardless of real-world circumstances. | `attackProbability()` in `src/lib/risk/scoring.ts:147` — pure function of the score, no calibration against incident data. | **High** | Rename to something non-probabilistic, e.g. "Exposure level", or state inline that it is a modeled index derived from the score, not a measured likelihood. | `src/lib/risk/scoring.ts`, `src/components/profiler/LiveScorePanel.tsx`, `src/components/methodology/ScoreSimulator.tsx` |
| 9 | Dashboard — Attack likelihoods | "Attack likelihoods · Estimated success odds, most likely first" with per-attack percentages (e.g. "68%") | Each percentage is a hand-assigned base value plus hand-assigned weights per triggered factor, clamped to 0–1. There is no data source and no calibration, yet the output is rendered as a precise odds figure. | `attackLikelihoods()` in `src/lib/dashboard/insights.ts:285`; base and weights are literals in `ATTACK_MODELS`. | **High** | Replace numeric percentages with ordered qualitative bands (e.g. Low / Elevated / High), or label the panel "Relative exposure by attack type — illustrative weighting, not measured odds". | `src/lib/dashboard/insights.ts`, `src/components/dashboard/AttackLikelihoods.tsx` |
| 10 | Dashboard — Risk reduction timeline | Section titled "Forecast · Risk reduction timeline · Apply the top fixes in order" | "Forecast" and "timeline" imply a projection over time. The chart has no time axis — the x-axis is "Now, Fix 1, Fix 2…", i.e. a sequence of hypothetical states, not dates. | `riskTimeline()` recomputes the composite score with each recommended factor flipped, in impact order. | Medium | Rename to "Projected score after each fix" and label the axis "Fixes applied". Drop the word "Forecast". | `src/components/dashboard/RiskTimeline.tsx`, `src/pages/Dashboard.tsx` |
| 11 | Home — Scale illustration | Previously: 4 drifting counters labeled "live", including "Credentials leaked / second (worldwide): 73", "Avg. password entropy: 38.2 bits", "% of users reusing passwords: 64". | None of the four figures carried a source. Two of them ("avg entropy", "% reusing") are static research-style statistics but were animated as if they were live telemetry, with a pulsing "live" indicator. The drift was `Math.random()`. | **Redesigned in this pass.** Now one explicitly "Simulated" counter at a stated assumed rate, plus three static reference figures with plain-language notes. Section subtitle states "Rounded teaching figures… Not measured data." | **High** | Figures still carry no citation. Either cite a source (e.g. a named breach report, with year) for each, or keep them as clearly-labeled illustrations as they now are. **Numbers left in place for manual sourcing.** | `src/components/home/LiveMetrics.tsx` |
| 12 | Home — Hero visual | Mock results screen showing "52.3 bits", score 68, "HIGH RISK", six category scores, previously "Confidence 94%" and "Signals 23". | Rendered to look like a real product screenshot. "Signals 23" implied the app collects 23 signals; it collects 13 questions across 6 pillars. "Confidence 94%" implied statistical confidence that does not exist. | **Partly corrected in this pass.** Invented metadata replaced with values that match the real product (10 questions, 6 pillars). A caption now states the figures are examples. Category scores remain invented. | Medium | Caption added. Consider generating the mock from the real engine using a fixed sample profile so the illustration cannot drift from reality. | `src/components/home/HeroVisual.tsx`, `src/components/home/Hero.tsx` |
| 13 | Dashboard — Score summary | Chip previously labeled "Confidence · High confidence / Low confidence" | Labeled as confidence, implying statistical reliability of the score. It is purely `answeredCount / totalQuestions`. | **Corrected in this pass** to "Answered · All answered / Partly answered / Barely answered". | Medium | Done. Underlying function name `confidenceFor` still misleading for future maintainers — consider renaming to `completenessFor`. | `src/lib/dashboard/insights.ts`, `src/components/dashboard/ScoreSummary.tsx` |

## Scope and capability claims

| # | Page / component | Exact claim | Why it may be misleading | Actual implementation | Severity | Recommended correction | Source file |
|---|---|---|---|---|---|---|---|
| 14 | Home — Hero | Previously: "RIndex analyzes your password strength, phishing awareness, account protection and digital habits" | Implied the assessment measures password *strength* and *phishing awareness* directly. The assessment never sees a password — it asks self-reported multiple-choice questions. Password strength is a separate, optional tool. Phishing is folded into the "behavior" pillar as a single self-reported question, not an awareness test. | 13 self-reported questions across 6 pillars (`src/lib/profile/questions.ts`). `analyzePassword` is only reachable from the Password Lab. | **High** | **Corrected in this pass** to describe self-reported questions. Verify no other surface still implies measurement of phishing skill. | `src/components/home/Hero.tsx`, `src/lib/profile/questions.ts` |
| 15 | Methodology (§2, §5) | "the **upcoming** Personal Risk Profiler", "the **future** Personal Risk Profiler", "what runs in production" | Described an implemented, shipped feature as unbuilt. Stale copy that undermined credibility for anyone who had just used `/assessment`. | Profiler is fully implemented at `/assessment`. **Corrected in this pass.** | Medium | Done. | `src/pages/Methodology.tsx`, `src/components/methodology/ScoreSimulator.tsx` |
| 16 | Methodology (§3) | "A chain breaks at its worst step… the chance an attacker succeeds anywhere along the chain is 1 − ∏(1 − pᵢ)" with four cards drawn as a sequential chain (Password → Email → Social → Payment) | **Mathematical/visual contradiction.** `1 − ∏(1 − pᵢ)` is the probability at least *one* independent attempt succeeds. A sequential chain where every step must succeed is `∏ pᵢ`. The formula and the diagram described different models. | Formula in `chainFailureProbability()` is `1 − ∏(1−pᵢ)`. **Corrected in this pass** by reframing the four cards as independent entry routes, which is what the formula actually models. | **High** | Done. Note `chainFailureProbability` is still a misleading function name for "at least one route succeeds". | `src/lib/risk/scoring.ts`, `src/components/methodology/WeakestLinkChain.tsx`, `src/pages/Methodology.tsx` |
| 17 | Methodology (§1) — Pillars grid | Weight bars rendered at `weight × 100 × 3.5` percent | The bar length did not correspond to the percentage printed beside it. Password (25%) rendered an 87.5%-full bar; Device (5%) rendered 17.5%. Arbitrary magnification with no legend or scale. | **Corrected in this pass** — bars now scale against the heaviest pillar, so full width = the 25% maximum, and an `aria-label` states the real percentage. | Medium | Done. | `src/components/methodology/PillarsGrid.tsx` |
| 18 | Home — Entropy preview | Entropy, band label, and crack time for the example passwords | The homepage carried its **own duplicate entropy implementation** that disagreed with the Password Lab: different symbol-set size (32 vs 33), different penalty rules, and entirely different band names (Critical/Weak/Moderate/Strong/Excellent vs critical/weak/vulnerable/safe/hardened). The same password could be scored differently on two pages. | **Corrected in this pass** — the component now calls the shared `analyzePassword()`. | **High** | Done. | `src/components/home/EntropyPreview.tsx`, `src/lib/password/analyze.ts` |
| 19 | Password Lab | Crack-time figures ("2.3 hours", "4.1e12 years") across five attacker tiers | Precise-looking durations that depend entirely on assumed guess rates (1e2 → 1e12 guesses/sec) and assume the attacker has the hash offline and no prior knowledge. Real attackers use leaked-password and rule-based attacks, which are far faster than brute force. | `computeScenarios()` divides `2^bits / 2` by a hardcoded rate per tier. Tier descriptions do state the assumed rate. Crypto Lab §4 does note "the math here is the upper bound, not the average case". | Medium | Surface the "upper bound, not average case" caveat in the Password Lab itself, not only in the Crypto Lab. | `src/lib/password/analyze.ts`, `src/components/password-lab/AttackSimulation.tsx` |
| 20 | Assessment / Home / CTA | Duration promised: "60 seconds" (intro) vs "3 minutes" (homepage CTA) | Two different figures for the same flow on the same site. | 13 questions defined, ~10 typically shown after conditional skips. **Corrected in this pass** to "about a minute" in both places. | Low | Done. | `src/components/profiler/IntroScene.tsx`, `src/components/home/CTASection.tsx` |
| 21 | Results — posture label | "Enterprise-grade habits — You are a very hard target." | Claimed an enterprise security standard based on ~10 self-reported multiple-choice answers, and asserted the user's real-world difficulty as a target. | **Corrected in this pass** to "Very well protected — Few easy ways in remain." | Medium | Done. | `src/lib/profile/posture.ts` |
| 22 | Attack Paths — scenario narratives | Specific factual assertions inside scenario step details, e.g. "Using 30–60 seconds of target audio, tools like ElevenLabs produce a clone indistinguishable to family members." | Names a specific commercial product and asserts a specific capability threshold ("indistinguishable") with no citation. Other steps carry similar unsourced specifics and named percentages on edges. | `src/lib/attack-paths/scenarios.ts` (1355 lines) — narrative copy and edge probabilities are all hand-authored literals. | Medium | Either cite sources for the named-product claims or generalize them ("voice-cloning tools need only seconds of audio"). Edge percentages should be labeled as illustrative. **Not modified in this pass — large surface, needs subject-matter review.** | `src/lib/attack-paths/scenarios.ts` |

---

## Notes for whoever reviews this

- Items 8, 9 and 22 are the ones most worth fixing next. They are the places where
  invented numbers are rendered with the most authority.
- Items 11 and 22 need a human decision: either find real citations, or commit to
  presenting the values as illustrations. This pass chose "label as illustration" for 11
  and left 22 untouched.
- Item 7 cannot be resolved from the source tree at all — someone needs to open the
  GitHub URL and confirm the repository and its LICENSE file are publicly reachable.
- The function names `attackProbability`, `chainFailureProbability` and `confidenceFor`
  all read as stronger guarantees than what they compute. Renaming them would reduce the
  chance of the misleading labels creeping back into the UI later.
