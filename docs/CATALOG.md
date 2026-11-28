# AscentUI catalog: what we ship, in what order, free vs Pro

Version 5, 2026-11-28. Status: proposal for review. Sits beside `PLAN.md` (how we build) and
`AFFECTUI-RESEARCH.md` (how affectUI sells).

Changes in version 3: the catalog is rebuilt around the 80/20 of what a coding agent needs (§4);
every component was made free, including the app shell (version 5 makes eight power components Pro again, §2); phone components and phone versions of the
core screens are added; an agent kit is a catalog layer of its own. Version 2 added phases, login
screens, late illustration and motion, a late deployable app, and the backend recipe (§3).

## 1. The pitch this has to serve

1. **Buy once, use forever.** One payment, lifetime access.
2. **A ready app in a day.** Start from working screens, not a blank page.
3. **Only the essentials.** A small catalog, kept as simple as possible.

Pricing: Individual USD 149 for the first 100 buyers then 299; Team (10 seats) USD 399 then 699.

## 2. The rule for free vs Pro

> **The basics are free. Power pieces and screens that work are Pro.**
>
> A screen, or a block wired to data, is Pro, except two free showcase screens. A component is free unless it is a
> deal breaker: needed in every real business app, slow to get right, and visibly broken when an agent fakes it.
> Eight pass that test: Data Grid, Chart, Month Grid, Upload, Command Menu, Stepper Form, Bottom Sheet, Pull to Refresh.
> The hooks stay free on purpose (App Shell, Data Table, Combo Box, Toaster, Stat Card): agents install them first.

| | Free (MIT) | Pro (one-time licence) |
| --- | --- | --- |
| Job | Get found, get installed, prove the quality | Be the reason to pay |
| What it is | 24 basic components, the theme, the agent kit, two showcase screens, some motion and illustration | 8 power components; screens and data blocks, each with its backend recipe (§3); later the deployable app |
| Buyer's saving | Minutes to hours | Days to weeks |

Two screens are free on purpose: **Sign in** (every app needs one, so it gets installed) and
**Dashboard** (it shows how the pieces fit together).

## 3. What "backend" means

**Each Pro screen ships a backend recipe, not a backend.** The reference server comes later,
with the deployable app (phase 5).

A recipe is four small files that travel with the screen:

| File | What it is | Why it matters |
| --- | --- | --- |
| **Contract** | The typed list of calls the screen makes (`listCases`, `assignPartner`…) and the shapes they return | The screen never guesses; an agent knows exactly what to build |
| **Mock client** | The same contract answered from demo data, in memory | The screen works the minute it is installed, before any backend exists |
| **Agent guide** (`AGENTS.md`) | Plain instructions for a coding agent: the tables to create, the rules to enforce, the mistakes to avoid, written for whatever stack the buyer uses | The buyer says "wire this to my Supabase" and it happens |
| **Checks** | A test file the agent runs against its own work until it passes | This is what makes a prompt trustworthy |

Why a recipe and not shipped server code:

- **Buyers are on different stacks.** Supabase, Convex, Next with Postgres, Firebase. One server
  framework fits a fraction of them; a contract plus a guide fits all.
- **It keeps us small.** No server to maintain, version and secure for every buyer.
- **It is how the buyers already work.** They direct an agent; we give the agent a precise brief.

Why not a prompt alone:

- **A bare prompt is not worth paying for,** and it gives no guarantee. Two runs produce two
  different backends.
- **The business rules are the hard part.** Tax and rounding, bill-once guards, who can see which
  price, undo. Those are written into the guide as rules and enforced by the checks, taken from a
  system a real business runs on. That is the part an agent can't invent.

So: **prompt, plus contract, plus mock, plus checks.** The checks are what turn "a prompt" into a product.

## 4. The 80/20: what an agent needs to build a working app

Most business software, on a desk or a phone, is the same loop repeated: **sign in, see a list,
open a record, change it, get told it worked.** An agent that has that loop, done properly once,
can build most of an app by repeating it. So the catalog leads with the loop, not with variety.

**The seven things that cover about 80% of the work**

| # | What | Why agents need it handed to them |
| --- | --- | --- |
| 1 | **Shell**: sidebar and top bar on a desk, tab bar on a phone | Every screen sits in one. Agents rebuild it differently on every page |
| 2 | **Sign in and roles** | Needed by every app; easy to get subtly and dangerously wrong |
| 3 | **List**: table on a desk, rows on a phone, with search, filter, sort, paging | The most common screen in business software |
| 4 | **Record**: drawer or page showing one thing, with its history | The second most common |
| 5 | **Form**: fields, validation, save, error | Where most bugs live |
| 6 | **States**: loading, empty, error, saved, confirm, undo | What separates a demo from a working app. Agents skip these unless told |
| 7 | **One way to talk to data**: the contract and mock client (§3) | Without it every screen invents its own, and nothing agrees |

**The four things that make the other six work**

| What | Why |
| --- | --- |
| **Theme** | One place to change the look, so screens stay consistent |
| **Conventions guide** | A short file the agent reads first: how to compose a list page, where state lives, how to name things |
| **Phone behaviour** | Bottom sheets, big touch targets, pull to refresh, the tab bar. A desktop layout squeezed onto a phone is not a mobile app |
| **Checks** | Tests the agent runs on its own work, so "it compiles" is not where it stops |

What this changes in the catalog:

- **The loop ships first and is the launch.** Phase 2 is renamed for it.
- **The App Shell is free.** The shell is item 1 on the list; charging for it would cut adoption where it
  matters most. Pro is the eight power components and the wired screens (§2).
- **Phone components join the core set:** Bottom Sheet, List Row, Pull to Refresh.
- **Phone versions of the core screens** join phase 2: phone list and phone record.
- **The agent kit is a layer of its own:** conventions guide, page recipes, `llms.txt`, MCP server.
- **Everything outside the loop is secondary**: boards, schedules, quotes, charts beyond the
  dashboard, illustration, motion. Still planned, but after the loop.

## 5. Phases, from core to secondary

| Phase | Theme | What ships | Free | Pro |
| --- | --- | --- | --- | --- |
| **1. Core** | The parts of the loop | Theme, 32 components (24 free, 8 Pro; desk and phone), built-in motion, 2 layout blocks, agent kit, website and install | 33 | 8 |
| **2. The working loop** | Sign in, list, record, form, states, on desk and phone | Sign-in and account screens, dashboard, admin basics, phone list and record, 6 data blocks | 2 | 18 |
| **3. Business screens** | The reason people come | Dispatch, field app, CRM, quotes + payments, assets + warranty, 8 more blocks. **Pro launches, and the first-100 offer starts, when Dispatch and the field app are done** | 0 | 32 |
| **4. Secondary** | Polish and reach | Illustrations, standalone motion, Brand Studio, AI activity screen | 11 | 9 |
| **5. Deployable app** | The whole thing running | Reference server, 2 starter apps, one-command setup | 0 | 2 |
| | | **Total: 115** | **46** | **69** |

At Pro launch (phase 2 plus Dispatch and the field app) the catalog is 74 items: 35 free, 39 Pro.
The free tier goes public earlier, at the end of phase 1. Every Pro buyer gets later
phases at no extra cost.

## 6. Phase 1: core (24 free components, 8 Pro)

Status key: **Have** = in the AscentUI repo (PR #1). **ChillOps** = designed in the ChillOps
prototype on affectUI components; needs our own components underneath. **Hutch** = exists in
Hutch, to copy and make generic. **New** = to write.

**Theme (1)**

| Item | Notes | Status |
| --- | --- | --- |
| Tokens + brand config | Light and dark colours, one font, corner radius, spacing. One `brand` object re-themes everything | Have (tokens); ChillOps (brand config) |

**Components (31)**, with how many of ChillOps' 16 screens use each in brackets

| Group | Components | Status |
| --- | --- | --- |
| Actions and display (10) | Button (13) · Badge (12) · Card (11) · Avatar (7) · Stat Card (5) · Empty State (4) · Icon Button (3) · Separator (3) · Skeleton + Spinner · Tooltip | New; Avatar from Hutch |
| Forms (9) | Form kit · Segmented Control (6) · Select + Combo Box (5) · Switch + Checkbox (4) · Date + Time Picker (3) · Text Field (2) · Text Area (2) · Number Input (2) · PIN Input (2) | Form kit and Combo Box: Have. Switch: Hutch. Rest: New |
| Data and overlays (5) | Toaster (14) · Dialog + Drawer (5) · Chart (4) · Data Table (3) · Month Grid | Data Table, Chart, Month Grid: Have. Toaster, Drawer: Hutch |
| App frame (4) | App Shell (6): sidebar, top bar, phone tab bar, account menu · Command Menu · Stepper Form · Upload | ChillOps; Upload from Hutch |
| Phone (3) | Bottom Sheet · List Row · Pull to Refresh | Hutch field app |

**Built-in motion (5):** number count-up, skeleton shimmer, enter and exit for overlays, list
reorder, press and focus feedback. One switch turns it all off; reduced-motion is respected.

**Layout blocks (2):** Page header · Filter bar.

**Agent kit (1):** the conventions guide, page recipes for the free screens, `llms.txt`, and the
MCP server for docs. Counted as one item; it is what an agent reads before it writes anything.

**Also in phase 1:** the website and the install registry.

## 7. Phase 2: the working loop

Everything here ships with its backend recipe (§3).

**Sign-in and account screens (7)**

| Screen | Tier | Status |
| --- | --- | --- |
| Sign in (email and password) | **Free** | Hutch |
| Sign up | Pro | New |
| Forgot and reset password | Pro | New |
| Accept invite and set password | Pro | Hutch |
| Verify code (email or text) | Pro | New |
| PIN sign-in (phone, for field staff) | Pro | ChillOps |
| Profile and account | Pro | ChillOps |

**App basics (5)**

| Screen | Tier | Status |
| --- | --- | --- |
| Dashboard | **Free** | ChillOps |
| Staff and roles | Pro | Hutch |
| Settings | Pro | Hutch |
| History and undo | Pro | Hutch |
| Trash and archive | Pro | Hutch |

**Phone versions (2, Pro):** Phone list (rows, search, pull to refresh) · Phone record (detail with
actions in a bottom sheet). Status: Hutch field app, ChillOps.

**Data blocks (6, Pro):** Record list page · Record drawer · Timeline · Settings form · Bulk
action bar · Undo history panel.

## 8. Phase 3: business screens

| Module | Screens | Status |
| --- | --- | --- |
| **Dispatch** (6) | Cases board · Cases list · New case · Case work area · Partners · Schedule | ChillOps |
| **Field app**, phone (7) | Job offers · Today's jobs · Job detail and on-site status · Service report · Open jobs · Alerts · Invoices | ChillOps |
| **CRM** (4) | Contacts · Companies · Deals pipeline · Lead inbox | ChillOps (3), Hutch (1) |
| **Quotes + payments** (4) | Quote builder · Customer quote page · Invoices · Payments | Hutch |
| **Assets + warranty** (3) | Products · Serial numbers · Warranty lookup | Hutch |

**Data blocks (8, Pro):** Board · Notes and comments · Line items editor · Money summary ·
Approval card · Schedule view · Setup guide · Photo report.

Order within the phase: Dispatch and Field app first (they already exist as ChillOps and are the
most distinctive), then CRM, then Quotes + payments, then Assets + warranty.

## 9. Phase 4: secondary

Illustration and motion match affectUI's approach, where free showpieces do the marketing, but
they come after the product works.

| Item | Count | Free | Pro | Notes |
| --- | --- | --- | --- | --- |
| Illustrations | 12 | 8 | 4 | Animated business scenes for landing pages and empty states: a dispatch board filling, a quote being accepted, a job moving across a map, an invoice paid, an undo |
| Standalone motion | 6 | 3 | 3 | Text reveal, number ticker, list stagger (free); page transition, drag physics, background (Pro) |
| Brand Studio screen | 1 | 0 | 1 | Edit the brand live, export the config |
| AI activity screen | 1 | 0 | 1 | What the assistant did, with approve and undo |

Until then the website uses affectUI's free MIT items for its own effects, as it does today.

## 10. Phase 5: the deployable app

| Item | What it is |
| --- | --- |
| Reference server | One real implementation of every contract (Hono + Postgres), passing the same checks buyers' agents run |
| **Service business** starter | Console + field app, deployed with demo data. Built from phases 2 and 3 |
| **Sales CRM** starter | Console for leads, deals and quotes |

One command creates the app, seeds a fictional company and prints a login. It comes last
because by then every contract has been proven by buyers on their own stacks.

## 11. What each tier gets

| | Free | Pro |
| --- | --- | --- |
| Theme, 24 basic components, built-in motion, 2 layout blocks, agent kit | Yes | Yes |
| 8 power components (Data Grid, Chart, Month Grid, Upload, Command Menu, Stepper Form, Bottom Sheet, Pull to Refresh) | | Yes |
| Sign in and Dashboard screens | Yes | Yes |
| 8 illustrations, 3 motion effects (phase 4) | Yes | Yes |
| 12 more loop screens (desk and phone), 24 business screens | | Yes |
| 14 data blocks | | Yes |
| Backend recipe with every screen | | Yes |
| Remaining illustrations and motion, Brand Studio, AI screen | | Yes |
| Reference server and starter apps (phase 5) | | Yes |
| AI install | Docs for everything | Source for everything |

## 12. Against affectUI

| | affectUI | AscentUI |
| --- | --- | --- |
| Catalog | 255 items, 29% free | 114 items at full build, 46% free |
| Niche | AI agents and chat | Service, CRM and finance operations |
| What Pro is | More interface | Interface plus the recipe to make it work |
| Screens | 50, none free, front-end only | 40, two free, each with a backend recipe |
| Illustration and motion | 38 items, 22 free | 18 standalone items, 11 free, in phase 4 |
| Data Table, Combobox, Stat Card, Toaster, App Shell | Pro | Free |
| Data Grid (grouping, saved views), charts, calendar, upload, command menu | Pro | Pro |
| Organised around | Breadth: a component for everything | The loop an agent repeats to build an app |
| Whole deployable app | No | Phase 5 |

## 13. Future phases: the full business suite (reserved)

Decided 28 Nov 2026. AscentUI's long-term aim is that **a new business can set up its whole system by
directing a coding agent**: a CRM like HubSpot, finance like Xero and field and operations
management like an ERP, connected to its other software and to any AI model. This is reserved for
phases after 5. Nothing here changes the launch or the counts in §5.

**Target:** feature parity over time, built in order of demand, after the first 100 buyers.

| Area | What it adds beyond phases 1–5 |
| --- | --- |
| **CRM** (HubSpot-like) | Activities and tasks, email and call logging, sequences, forms, segments, lead scoring |
| **Finance** (Xero-like) | Bills, chart of accounts and journal, bank feeds and reconciliation, tax settings, P&L, balance sheet, aged receivables and payables, multi-currency |
| **Operations** (ERP-like) | Inventory and stock locations, purchase orders, suppliers, capacity and scheduling, job costing |
| **Integrations** | A connector framework (OAuth and secret storage, webhooks in and out, sync jobs with retries and logs), then connectors by demand: payments, accounting, email and calendar, messaging |
| **AI and agents** | Any model through the Vercel AI SDK: hosted providers and self-hosted ones (Ollama, vLLM, anything OpenAI-compatible). An in-app assistant, agent runs, agentic workflows, and an approvals queue |
| **Authorisations for agents** | Agents act only through scoped tools. Risky actions wait for a person's approval, every action is in the audit log, and everything is undoable |
| **Admin** | Organisation settings, invites, roles and a permissions matrix, single sign-on, two-factor, sessions, audit log |
| **Analytics** | Dashboard builder, report builder, saved metrics, scheduled exports |

**How it will ship**

- **Server kits.** Each module from here on ships real server code alongside its screens. Recipes
  alone can't hold secrets, OAuth callbacks, webhooks or model calls. Supabase and Postgres come first.
- **AI layer:** the Vercel AI SDK, so one interface covers 20+ hosted providers and any
  OpenAI-compatible self-hosted model.
- **Setup by agent.** A business app template plus a setup playbook the agent follows end to end:
  accounts the owner creates, then auth, modules, brand and demo data wired by the agent.
- **Compliance.** Payroll, e-invoicing and tax filing are regulated per country. They need specialist
  review before they ship, and may stay out.

## 14. Decisions and open questions

Decided on 28 Nov 2026:

- **Data Table splits** (28 Nov): a free Data Table (sort, paging, phone layout) and a Pro Data Grid (grouping, saved views, column choices, bulk actions, inline edit).
- **App Shell is free.** Eight power components are Pro (§2); the rest are free. Watch free-to-paid conversion.
- **Pro components ship from the paid registry, not the MIT `ui/` package.** Chart and Month Grid, built as MIT on a private branch, move before anything goes public.
- **Sign in and Dashboard are the two free screens.**
- **Pro launches with Dispatch and the field app,** not straight after phase 2.
- **Payments: Stripe.**
- **The full business suite** (CRM, finance, operations, integrations, AI and agents, admin, analytics) is reserved for phases after 5; see §13.
- **Lifetime scope:** every licence covers phases 1–5. The first 100 buyers (the launch pool) also get the full suite for life; later buyers get it as a separate purchase, priced later. Public roadmap at `#roadmap`, target months shown as targets.
- **AI layer:** Vercel AI SDK. **Server code:** shipped as server kits with each module from the suite onwards.

Still open:

1. **Which stacks do the agent guides name first?** Recommendation: Supabase, then plain Postgres.
2. **Illustrations:** which twelve scenes, and which eight are free.
3. **Is the reference server its own catalog item?** Counted inside the starter apps today. If separate, totals become 115 items, 62 Pro.
4. **Code ownership** (from `PLAN.md`): Hutch is Chill Bunny's. To be settled in writing before launch.
