<div align="center">

# briefly<span>.</span>

**Find your perfect creator. From brief to paid.**

An AI-powered marketplace where brands find creators who can actually make the content they have in mind, hire them by swiping, and track deliverables and payments in one place.

_Built for the **GenZtea × localhost:nyc Creator Economy Hackathon** · Powered by the **You.com API**_

</div>

---

## The pitch

> **Stop matching brands with follower counts. Start matching them with creators who can actually deliver the content they envision.**

Briefly is **Tinder meets Uber Eats for the creator economy**:

| | What it borrows | In Briefly |
|---|---|---|
| 🔥 **Tinder** | Swipe, match | Swipe through AI-ranked creators. A match happens only when the creator accepts. |
| 🛵 **Uber Eats** | Order, track, pay | Place a campaign, track each deliverable, and release milestone payments. |
| 🧠 **AI** | Understand, research, draft | Turn a rough brief into a spec, find creators with live web search, and draft clear terms. |

## The problem

Brand–creator deals still run on Instagram DMs, spreadsheets, PDFs, and invoices people chase by hand.

- **Brands can't find the right creators.** Social-platform algorithms surface whoever is popular. A creator with 10k followers and great product demos can fit a UGC brief better than one with 500k.
- **Brands can't put their vision into words.** "Funny, authentic, Gen Z, not too salesy" doesn't say what to film.
- **Creators can't find paid work** unless brands come to them first.
- **"Done" is never defined.** Vague deliverables lead to endless revisions, unpaid extra work, and payment disputes.

## How it works

```
 Brief ──▶ Discover ──▶ Swipe ──▶ Invite ──▶ Match ──▶ Agreement ──▶ Deliver ──▶ Paid
  AI        You.com     shortlist  terms     creator    AI draft     tracked    simulated
  spec      search                           accepts                 milestones
```

1. **Brief builder:** describe the campaign in plain English. Claude turns it into a structured brief you can edit. A *Campaign Ready* meter shows what's still missing.
2. **AI discovery, in three You.com steps:**
   - **Search** (`/v1/search`) finds pages that *name* relevant creators: roundups, "top creators" lists, and brand-partner lists.
   - **Contents** (`/v1/contents`) reads the best of those pages in full.
   - **Extraction** pulls out the individual creators each page names, with their handle, platform, and a description quoted from the page. Mentions of the same creator across pages are merged, and every creator keeps a link to its source page.
3. **Compatibility engine:** each candidate is scored on niche, style, portfolio, format, budget, and availability. Every reason given points to evidence.
4. **Swipe deck:** swipe right to shortlist, left to pass, tap for details, and compare your shortlist side by side.
5. **Match moment:** the creator accepts your invite. *It's a match.*
6. **Collaboration agreement:** the brief becomes a draft agreement covering deliverables, specs, deadlines, milestones, revision limits, usage rights, and disclosure.
7. **Tracking and payment:** follow each deliverable from production to review to approval to paid.

## Honesty rules (non-negotiable)

These are built into the code, not just the copy:

- **Unknown stays unknown.** You.com results don't include rates, availability, or follower counts, so those fields stay `unknown`. Missing signals **lower the confidence**. They are never counted as a match.
- **No fake precision.** If less than 70% of the score's weight is backed by real signals, the UI shows a band ("Promising — needs confirmation") instead of a percentage.
- **The score is an estimate.** It is *not* the probability that a campaign succeeds.
- **No made-up creators.** A creator is only listed if a page we actually fetched names them. Claude's evidence quotes must appear word for word in that page or they are dropped, and profile URLs are kept only if they appear in the page. Live results are labeled **unverified**. Demo profiles are fictional and always labeled **Sample profile**.
- **No contact details.** Emails and phone numbers in creator bios are stripped from the evidence text.
- **Swiping right means shortlisting, not booking.** A real match needs the creator to accept. Simulated acceptance is labeled `Demo: Creator acceptance simulated`.
- **Payments are simulated.** No real money is held, escrowed, or transferred in this MVP.
- **The discovery animation only shows steps that ran.** `/api/discover` reports each step as `done`, `skipped`, or `failed`.

## Compatibility scoring

| Dimension | Weight | Signal source (MVP) |
|---|---:|---|
| Niche relevance | 25% | Brief niche terms found in the profile and evidence |
| Content style | 25% | Requested style words found in the profile and evidence |
| Portfolio evidence | 20% | Number of linkable examples and snippets |
| Campaign format fit | 15% | Format keywords (demo, review, skit…) found in evidence |
| Budget compatibility | 10% | Only when a verified or self-reported rate exists |
| Availability | 5% | Only when the creator has stated it |

```ts
score    = 100 * Σ(weight·signal over KNOWN dims) / Σ(weight of KNOWN dims)
coverage = Σ(weight of KNOWN dims)        // 0..1 → confidence: high ≥ .85, medium ≥ .6
```

These weights are MVP heuristics, not validated predictors. See [`src/lib/matching.ts`](src/lib/matching.ts).

## Tech stack

| Layer | Choice |
|---|---|
| App | Next.js 15 (App Router) + TypeScript |
| Styling / motion | Tailwind CSS v4, Framer Motion |
| Live research | **You.com Search API** (`POST ydc-index.io/v1/search`) + **Contents API** (`POST ydc-index.io/v1/contents`) |
| AI | Claude (`claude-opus-5-5`) via `@anthropic-ai/sdk`, using structured outputs with a Zod schema |
| Validation | Zod |
| Tests | Vitest |

## Getting started

```bash
git clone <this-repo> briefly && cd briefly
npm install
cp .env.example .env.local   # add YOU_API_KEY and ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Both keys are optional for a first run:

| Keys set | What discovery does |
|---|---|
| none | Sample brief and labeled sample creators only |
| `YOU_API_KEY` | Live Search + Contents, with creators extracted by pattern matching (numbered roundup entries, profile links, embedded posts) |
| both | Live Search + Contents, with Claude extracting creators and filtering out brands. Every quote is checked against the page. |

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests (scoring engine) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## API

| Route | Body | Returns |
|---|---|---|
| `POST /api/brief` | `{ description, brandName?, product? }` | `{ brief, readiness: { percent, remaining[] }, mode: "ai" \| "sample" }` |
| `POST /api/discover` | `{ brief, includeSamples? }` | `{ steps[], results: [{ creator, match, signals }] }` |

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Landing (hero + swipe→match→track animation)
│   ├── brief/                # Describe → editable brief + readiness meter
│   ├── discover/             # Live discovery steps → swipe deck → shortlist
│   └── api/
│       ├── brief/route.ts    # Claude → structured CampaignBrief
│       └── discover/route.ts # You.com search → normalize → rank
├── components/
│   └── hero-deck.tsx
├── lib/
│   ├── types.ts              # CreatorCandidate, CampaignBrief, Agreement…
│   ├── matching.ts           # Compatibility engine (+ matching.test.ts)
│   ├── you.ts                # You.com Search + Contents clients, query builder
│   ├── extract.ts            # Page → creators (pattern fallback, merge, guards)
│   ├── extract-ai.ts         # Page → creators with Claude, quotes verified
│   ├── brief.ts              # AI brief builder
│   └── readiness.ts          # "Campaign Ready: 85%" meter
└── data/                     # Fictional sample brief + creators (labeled)
```

## Roadmap

**Hackathon MVP (brand side first)**
- [x] Scaffold, domain types, honesty rules
- [x] Compatibility engine with coverage-aware confidence, plus tests
- [x] You.com Search + Contents pipeline that extracts real, cited creators from roundup pages
- [x] AI brief builder (structured output) with a sample-mode fallback
- [x] Landing page with the swipe → match → track animation
- [x] Brief builder UI with editable fields and the readiness meter (Claude, or rule-based parsing without a key)
- [x] Discovery sequence driven by real `steps`
- [x] Swipe deck (drag, buttons, arrow keys, undo) and shortlist tray
- [ ] Compare view for the shortlist
- [ ] Invite flow and *It's a Match* screen (simulated acceptance, labeled)
- [ ] AI collaboration agreement generator
- [ ] Campaign tracker with simulated milestone payments

**After the hackathon**
- Creator-side app: profiles, opportunity feed, accepting offers
- Verified creator onboarding and self-reported rates
- Milestone payments through a regulated payment provider
- Objective deliverable checks against the brief (length, aspect ratio, brand mention)

## License

MIT
