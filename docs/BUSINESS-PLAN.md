# AscentUI business plan

Drafted 2026-11-28. Status: proposal for review. Companion to `CATALOG.md` (what we ship) and
`PLAN.md` (how we build). Revenue figures are targets built from stated assumptions, not forecasts.

## 1. The goal

**100 paying customers by 30 April 2027.**

That is the whole launch offer sold: the first 100 buyers at USD 149 (Individual) or USD 399 (Team).
At an assumed 85 Individual and 15 Team, that is about **USD 18,600**.

Why this goal: it is one number, it has a date, and selling out the launch offer proves the two
things that matter before investing further: people find it, and people pay for it.

| Milestone | Date | Measure |
| --- | --- | --- |
| Free tier public | 22 Dec 2026 | Site live, every free item installs with one command |
| First sale | 15 Feb 2027 | Checkout works end to end; one stranger pays |
| **100 customers** | **30 Apr 2027** | **Launch offer sold out** |
| 400 customers | 30 Nov 2027 | Year-one target, about USD 126,000 in total (§5) |

## 2. What we sell

Business-ready React components and screens for people who build apps with coding agents.

- **Free:** every component, the theme and the agent kit. MIT licence.
- **Pro, one payment, lifetime:** screens that work (sign in, list, record, form, dashboard, then
  dispatch, field app, CRM, quotes, assets), each with a backend recipe an agent can follow.

Pitch: **buy once, use forever; a ready app in a day; only the essentials.**

## 3. Who buys

| Buyer | What they are doing | Why they pay |
| --- | --- | --- |
| **Solo builder with an agent** (main) | Building an internal tool or a small SaaS with Claude Code, Cursor or v0 | Their agent builds screens that look right but don't hang together. We give it the pattern and the checks |
| **Small agency or freelancer** | Building back-office apps for clients | Reuse across clients; the Team licence |
| **Service business with a technical owner** | Wants its own dispatch or CRM tool, not a subscription | The industry screens in phase 3 |

Where they are: X, YouTube build-in-public channels, Reddit (r/ClaudeAI, r/cursor, r/SaaS), the
shadcn ecosystem and registry directories, and inside the agents themselves through MCP and `llms.txt`.

## 4. How we win

1. **Organised around the loop, not breadth.** Most business software is sign in, list, record,
   form, states. We ship that loop done properly on desk and phone (`CATALOG.md` §4). Rivals ship
   hundreds of loose parts.
2. **Screens come with a backend recipe.** Contract, mock, agent guide and checks. No other kit
   tells the agent how to make the screen real and then tests that it did.
3. **Taken from a running business.** The rules for money, roles and undo come from Hutch.
4. **Free is generous on purpose.** Every component is free, so agents and people install us by
   default. Pro is the step from parts to a working app.

Closest comparison: affectUI (USD 249 / 699, 255 items, AI-agent interfaces, no backend). We are
smaller, cheaper at launch, and aimed at operations software instead of AI products.

## 5. The numbers

**Prices (USD, one-time):** Individual 149 for the first 100 buyers, then 299. Team (10 seats)
399 for the first 100, then 699. The 100 is one pool across both plans.

**Year-one target**

| | Customers | Mix assumed | Revenue |
| --- | --- | --- | --- |
| Launch offer (to 30 Apr 2027) | 100 | 85 Individual, 15 Team | 18,650 |
| Regular price (May to Nov 2027) | 300 | 255 Individual, 45 Team | 107,700 |
| **Year one** | **400** | | **126,350** |

Assumption behind 300 more: about 43 sales a month for seven months. At a 2% visitor-to-buyer
rate that needs roughly 2,150 pricing-page visitors a month. That traffic is the thing to build,
and it is the least certain number here.

**Costs** (estimates to confirm)

| Item | Cost |
| --- | --- |
| Payment fees | About 3% of sales, plus currency conversion |
| Domain, hosting, database, email | Low; free or entry tiers cover launch volumes |
| Agent usage for the build | The main running cost; varies with how much is built hands-off |
| Legal: ownership agreement, licence text, trademark search | One-off; get a quote |
| Tax and bookkeeping on overseas digital sales | Ask the accountant before the first sale |

One-time pricing means no recurring revenue: each month starts at zero. Year two needs either
new buyers at the same rate or a second product (the deployable app, a hosted version, paid
upgrades for major versions). That is a decision for mid-2027, noted in §9.

## 6. How it gets built

- **Hands-off:** agents build the components, website, registry, docs and screens against
  `CATALOG.md`, on feature branches, with draft pull requests. Nothing merges to `main` and
  nothing goes public without your say.
- **Hands-on, yours:** account setup (§8), every design decision, the ownership agreement, and
  pressing publish.
- **Design:** the design system is the single place design is decided. Each step is a short
  review: I put up options, you pick or redirect, then the agents build to it.

## 7. Timeline

| When | Phase | Result |
| --- | --- | --- |
| 28 Nov to 5 Dec 2026 | **Setup and design language** | Accounts created, ownership settled, colour, type and shape signed off |
| 6 to 22 Dec | **Phase 1: core** | 31 components, theme, agent kit, website with docs. Free tier public on 22 Dec |
| 4 Jan to 12 Feb 2027 | **Phase 2: the working loop** | Sign-in, list, record, form, dashboard, on desk and phone. Checkout live. **Pro launches 15 Feb** |
| 15 Feb to 30 Apr | **Phase 3a: dispatch and field app** + selling | The first industry screens. 100 customers by 30 Apr |
| May to Jun | **Phase 3b: CRM, quotes + payments, assets** | Regular price in effect |
| Jul | **Phase 4: illustration, motion, Brand Studio, AI screen** | Reach and polish |
| Aug to Sep | **Phase 5: deployable app** | Reference server and starter apps |

The dates assume design reviews turn around within two or three days. Design sign-off is the
step most likely to slip the plan, because it is the one that needs you.

## 8. Checklist

**Yours: setup (week of 28 Nov)**

- [ ] **Ownership:** written agreement with Chill Bunny on what AscentUI may copy from Hutch and sell. Blocks any public release
- [ ] **Name:** trademark search on "Ascent" in software; "Ascent ERP" and "Ascent Business Systems" exist
- [ ] **Domain:** register `ascentui.com` or `.dev`
- [ ] **npm:** reserve the `@ascentui` scope
- [ ] **Hosting:** create the Vercel project and connect the repo
- [ ] **Database and sign-in:** create the Supabase project
- [ ] **Payments:** decide Stripe or Shopify, then create the account (see note)
- [ ] **Who sells:** which company takes the money, and the tax position on overseas digital sales (accountant)
- [ ] **Email:** a sending domain for receipts and sign-in links

Note on payments: Stripe Checkout is the simpler fit for two one-time products. It has no
monthly fee and is what affectUI uses. Shopify adds a monthly plan and a storefront we don't
need, but makes sense if you already run one and want sales in one place.

**Yours: decisions**

- [ ] Design language: light or dark first, accent colour, corner shape, density
- [ ] Data Table and App Shell stay free (`CATALOG.md` §13)
- [ ] Launch after phase 2, or wait for dispatch
- [ ] Team launch price confirmed at 399

**Build: phase 1 (agents)**

- [ ] Design tokens and theme, light and dark
- [ ] 31 components in one-file style, each with docs and a live preview
- [ ] Agent kit: conventions guide, `llms.txt`, MCP docs server
- [ ] Website: landing, library, docs, pricing, licence
- [ ] Install registry; every free item installs with one command into a blank app

**Build: phase 2 (agents)**

- [ ] Sign-in and account screens, dashboard, staff, settings, undo, trash
- [ ] Phone list and phone record
- [ ] Backend recipe for each screen: contract, mock, agent guide, checks
- [ ] Checkout, sign-in for buyers, access keys, key-gated registry
- [ ] Pro licence text

**Launch**

- [ ] Ten beta users from the build-with-agents crowd, before public launch
- [ ] Launch post, demo video, listing in shadcn registry directories
- [ ] "Spots left" counter driven by real sales

## 9. Risks

| Risk | What we do about it |
| --- | --- |
| **Ownership of the Hutch code is unsettled** | First item on the checklist. Nothing goes public before it is signed |
| **Free is enough** and few upgrade | Watch free-to-paid from the first week. The lever is moving a block or the phone screens, not the components |
| **Agents get good enough** to build the loop unaided | Our value moves to the checks and the business rules, which are knowledge, not code |
| **A bigger kit adds backends** | Stay narrow: operations software, desk plus phone, rules from a real business |
| **One-time pricing runs dry** | Decide the second product by mid-2027 |
| **Design reviews slow the build** | Keep each review small and visual; agents continue on agreed parts meanwhile |
| **Traffic** never reaches about 2,000 pricing visits a month | Free tier is the marketing; if installs are low by February, the problem is reach, not price |
