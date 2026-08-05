# RIndex — Claims Audit

A working development document. It tracks claims we are still refining, simplifications we
made on purpose, places where the presentation is a little more dramatic than the underlying
arithmetic, and a few recent corrections worth remembering.

This is a curated list, not an exhaustive disclosure of every technical caveat. Anything
already explained properly on the Methodology page (`/methodology`) is not repeated here —
that page covers how scoring works, what the app knows, and what it cannot do. This file is
for the open threads.

**Status labels**

| `Open` | Should probably change. Actionable. |
| `Review` | Needs a human decision, a source, or subject-matter input. |
| `Accepted` | Deliberate simplification or illustration. Documented, not a bug. |
| `Fixed` | Recently corrected. Kept because the history is useful. |

---

## Modeled values

| Dashboard, Assessment | "Modeled attack success — X%" derived from the risk score | `Accepted` | A percentage reads like a measurement. This one is a smoothstep curve `x²(3−2x)` applied to the score — deterministic, but not calibrated against real incident data. | None required; Methodology §6 explains and plots the curve. Revisit if we ever want a non-percentage presentation. | `src/lib/risk/scoring.ts` |
| Dashboard — Exposure by attack type | Per-attack percentages (e.g. "68%") | `Review` | Base values and per-factor weights are hand-assigned. The heading now says "illustrative weighting — not measured odds", but the numbers still look precise. | Decide between keeping labeled percentages or switching to ordered bands (Low / Elevated / High). | `src/lib/dashboard/insights.ts`, `src/components/dashboard/AttackLikelihoods.tsx` |
| Attack Paths — edge probabilities | Percentages on graph edges (e.g. "85%") | `Review` | Hand-authored literals presented as step likelihoods. Reasonable for teaching a chain, but not labeled as illustrative. | Add a short legend note marking edge values as illustrative. | `src/lib/attack-paths/scenarios.ts` |

## Content and sourcing

| Area | Claim or behavior | Status | Why it matters | Next action | Source |

| Attack Paths — scenario narratives | Specific capability claims in step detail text, including a named commercial voice-cloning product | `Open` | Named products and phrases like "indistinguishable" assert more than we can support without a citation. | Generalize the wording, or cite sources. Needs subject-matter review across ~1300 lines. | `src/lib/attack-paths/scenarios.ts` |
| Home — scale illustration | Rounded figures for leak rates, password reuse and entropy | `Accepted` | Presented as teaching figures with a "Simulated" tag and an explicit "not measured data" note, but they carry no citation. | Optional: cite a named annual report, or leave as a labeled illustration. | `src/components/home/LiveMetrics.tsx` |
| Home — hero visual | Mock results screen with example category scores | `Accepted` | It is a product illustration, captioned as such. The category scores are invented rather than generated. | Optional polish: render the mock from the real engine with a fixed sample profile so it cannot drift from the product. | `src/components/home/HeroVisual.tsx` |

## Password analysis

| Area | Claim or behavior | Status | Why it matters | Next action | Source |

| Password Lab | Crack-time estimates across five attacker tiers | `Open` | Each tier states its assumed guess rate, but the Lab itself does not say these are an upper bound for a *randomly chosen* password. Real attacks start from leaked lists and are far faster. The caveat currently only appears in the Cryptography Lab. | Surface the "upper bound, not average case" note in the Password Lab too. | `src/lib/password/analyze.ts`, `src/components/password-lab/AttackSimulation.tsx` |

## Scope and privacy

| Area | Claim or behavior | Status | Why it matters | Next action | Source |

| Assessment | Score is built entirely from self-reported answers | `Accepted` | The score describes the answers, not the person. Nothing is verified, scanned or looked up. | None. Stated plainly on the Methodology page and in the results footer. | `src/lib/profile/questions.ts` |
| Global | Local storage and caching | `Accepted` | The app writes one key (the reduced-motion preference) and caches its own files for offline use. Assessment answers are never written to storage and never leave the page. | None. Disclosed in the footer and Methodology §9. | `src/lib/reduce-motion.ts`, `src/lib/pwa.ts` |
| Scoring weights | Pillar weights and factor deltas | `Accepted` | Hand-tuned so a careful profile scores low and a careless one scores high. Not fitted to breach data — no such dataset was used. | None. Stated on the Methodology page; weights are published in source. | `src/lib/risk/pillars.ts`, `src/lib/risk/factors.ts` |

## Recently fixed

| Area | Claim or behavior | Status | Why it matters | Next action | Source |

| Methodology — weak links | Formula `1 − ∏(1 − pᵢ)` was paired with a diagram showing a sequential chain | `Fixed` | The formula models independent alternative routes; a sequential chain would be `∏ pᵢ`. Diagram and math described different models. Reframed as independent entry routes. | Worth remembering — the two models are easy to conflate when editing this section. | `src/components/methodology/WeakestLinkChain.tsx` |
| Home — entropy preview | Homepage ran its own entropy implementation | `Fixed` | It disagreed with the Password Lab on charset size, penalties and band names, so the same password could score differently on two pages. Now calls the shared `analyzePassword()`. | Keep one analyzer. Do not reintroduce a second scoring path. | `src/components/home/EntropyPreview.tsx` |
| Methodology — pillar bars | Weight bars were magnified by an arbitrary ×3.5 | `Fixed` | Bar length did not match the percentage printed next to it. Bars now scale against the heaviest pillar, with the scale stated inline. | Keep bar length tied to a stated scale. | `src/components/methodology/PillarsGrid.tsx` |
| Dashboard — score summary | Completion ratio was labeled "Confidence" | `Fixed` | Implied statistical reliability. It is simply how many questions were answered. Now labeled "Answered". | — | `src/components/dashboard/ScoreSummary.tsx` |

---

## Priorities

1. **Attack Paths scenario copy** — the largest remaining block of unsourced specifics.
2. **Password Lab crack-time caveat** — small change, removes the most likely misreading.
3. **Exposure-by-attack-type presentation** — decide on percentages vs bands and stop revisiting it.
