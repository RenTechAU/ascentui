# AscentUI — plan

**What it is:** pre-built business components for people vibe-coding their own platform — a
demo or MVP in an afternoon instead of a month. Same model as affectUI (free MIT tier + one-time
Pro), but where affectUI sells *looks* for AI products, AscentUI sells **working business blocks**:
screen + database schema + server logic, copied from Hutch, which runs a real business.

**The gap it fills:** component libraries (affectUI, shadcn) have no business logic; internal-tool
builders (Retool, Softr, Zite) make the owner design every rule; suites (Odoo, ERPNext) are heavy
and need a specialist; vertical SaaS (ServiceM8, Jobber) can't be built on. Nobody ships
"dispatch, warranty, quotes and an undo log, ready for your AI to assemble".

---

## 1. Principles

1. **Hutch stays separate and independent.** AscentUI *copies* from Hutch, one way. Hutch never
   installs, imports or waits on AscentUI, and nothing here may require a change in Hutch.
   AscentUI owns its copy from then on: it can rename, restyle and generalise freely. When
   Hutch improves a component, porting it across is a deliberate choice, not an obligation.
2. **A module is a block, not a screen.** UI + clean SQL schema + server routes + demo data,
   installed together. That bundle is the product.
3. **Data comes in through props or a client interface, never a hidden fetch.** Hutch's big
   drawers call `../api` directly (CaseDrawer: 33 calls) — the AscentUI copy is what gets refactored, never Hutch.
4. **Agent-first install.** Every item installs via the shadcn CLI *and* via an MCP server, so
   Claude / Cursor / v0 can add it from a sentence. Each item ships an `llms.txt`-style usage note.
5. **Nothing Chill-Bunny-specific ships.** No ice-bath/sauna types, no legacy-import columns, no
   owner names, no AU-only assumptions baked in (tax, bank fields, states become config).

## 2. Shape

```
ascentui/                        # its own repo (RenTechAU), npm-workspaces monorepo
  tokens/                        # @ascentui/tokens — CSS variables lifted from admin styles.css :root, light + dark
  ui/                            # @ascentui/ui — FREE primitives (MIT)
  modules/
    foundations/                 # staff + auth + roles/tab access + history/undo + archive/trash
    dispatch/                    # cases board, case drawer, resolve, partner field app
    crm/                         # leads, contacts/companies, deals pipeline, timeline
    quotes/                      # line items, quote page, payments (tax via config)
    assets/                      # products, serial lifecycle, warranty, parts ledger
    tasks/ notifications/ analytics/
  connectors/                    # xero, twilio, gmail, meta, google, calendly — Pro add-ons
  registry/                      # built shadcn registry JSON (generated, not hand-written)
  mcp/                           # install-and-drive MCP server
  create-ascentui/                # `npx create-ascentui` starter: Vite + Hono + Postgres + chosen modules
  site/                          # docs + live demos on a fictional business
```

**Every module has the same contract:**

| Part | Content |
| --- | --- |
| `schema/` | One clean SQL file per module (squashed — no replay of Hutch's 161 migrations), plus `requires:` other modules |
| `server/` | A Hono router factory: `dispatchRoutes({ db, withActor, auth })` |
| `ui/` | Components taking a typed client (`DispatchClient`) — an app passes its real API, demos pass a mock |
| `demo/` | Seed data for a fictional company (an HVAC/pool-service business) |
| `README` + `AGENTS.md` | What it does, what it requires, how an AI should wire it |

Styling: keep Hutch's token approach (CSS variables), but each component carries its own CSS file
instead of relying on the 3,000-line global `styles.css` — affectUI's "one file, styles inside"
is a big part of why agents can install it cleanly.

## 3. Phases

### Phase 0 — decide (≈1 week, no code)
Resolve the open decisions in §5. Blocking: **IP ownership** and **name**.

### Phase 1 — free primitives (≈2 weeks)
- `@ascentui/tokens` from `frontend/admin/src/styles.css` `:root` (+ dark).
- Move into `@ascentui/ui`: `DataTable`, `ComboBox`, `Chart`, `MonthGrid`, form kit
  (`FieldLabel`/`Req`/`FormHeading`), `Drawer`, `Switch`, `Avatar`, `Lightbox`; field app's
  `Sheet`, toast, pull-to-refresh. Domain chips (`StagePill`, `WarrantyChip`…) stay behind.
- A demo page renders each one with mock data.
- shadcn registry build + a docs site with live demos.
- **Done when:** the package builds and typechecks, every component renders in the demo, and
  `npx shadcn add <registry>/data-table` works in a blank Vite app.

### Phase 2 — foundations module (≈3 weeks)
Everything else depends on it: staff/auth (PIN + password), roles and tab access, the history
ledger with undo, archive vs delete, trash. Clean schema file; server factory.
- **Done when:** a fresh app from `create-ascentui --modules foundations` logs in, edits a
  record, and undoes it.

### Phase 3 — first paid module: dispatch + field app (≈4–6 weeks)
The most distinctive block. Cases board, case drawer, new case, resolve form, partner app (jobs,
accept, submit, invoices, PIN activation), with the AR/AP split (partners never see client price).
- Refactor `CaseDrawer`/`Cases`/`NewCaseModal` onto a `DispatchClient` interface.
- Generic case types/trades as config, not enums tied to Chill Bunny.
- Demo company + seed; `create-ascentui --template service-business`.
- **Done when:** a non-developer can go from `npx create-ascentui` to a deployed dispatch demo
  (Railway or Supabase) by following the README or asking their AI.

### Phase 4 — launch (≈2 weeks)
Pricing page + checkout, license keys gating the Pro registry, MCP server, landing page,
5–10 hand-picked beta users from the vibe-coding crowd.

### Phase 5 — expand (ongoing, by demand)
CRM → quotes/payments (tax-region config) → assets/serials/warranty (upsell to dispatch) →
tasks, notifications, analytics → connectors as individual add-ons. MCP-driven "drive the app"
server (Hutch's `/mcp` + undo) as the premium hook.

## 4. Genericising checklist (applies to every module)

- [ ] No `Luke` / `Chill Bunny` / product-line strings (≈107 today across admin + API)
- [ ] No legacy columns from the 0004 import or `0040`/`0068` heals
- [ ] Tax: `gst_rate` → a tax-region table (AU GST, NZ GST, US sales tax off, EU VAT)
- [ ] Bank fields (BSB/account) → per-country shape
- [ ] Currency and regions from config, AU not defaulted
- [ ] Product types as data (already true since `0134`), no seeded ice/sauna/RLT
- [ ] Every component renders with mock data in the docs site

## 5. Open decisions

| Decision | Recommendation |
| --- | --- |
| **Who owns the code?** Hutch is Chill Bunny's internal engine | Settle in writing before Phase 1 ships publicly — this blocks launch, not building |
| Name | **Decided: AscentUI.** npm names + `@ascentui` scope free (checked 2026-11-27). Still to do: domain, and a trademark search — Ascent ERP and Ascent Business Systems (field service) exist |
| Repo | **Decided: its own repo under RenTechAU.** Private until launch. **Hutch stays independent** and never depends on AscentUI |
| License | Free tier MIT; Pro = commercial EULA allowing unlimited client projects, banning resale as a kit |
| Pricing | One-time, all-access, lifetime. **Individual: USD 149 for the first 100 buyers, then USD 299** (set 2026-11-28). **Team (10 seats): USD 399 for the first 100 buyers, then USD 699.** The first 100 is one pool shared by both plans |
| Hosting target for starter | Railway first (Hutch already deploys there), Supabase second |
| Multi-tenant hosted version | Not now. Self-hosted code kit only; revisit after 50 paying users |
| affectUI components inside AscentUI | **Kit: no.** The kit is our own code from Hutch, written in affectUI's one-file style. **Website: free MIT items only**, with their notice kept (`site/THIRD-PARTY-NOTICES.md`). Pro items never: their licence bans kits, templates and libraries. See `docs/AFFECTUI-RESEARCH.md` |

## 6. Risks

- **Support load** — every owner's build becomes a ticket. Mitigate: strong `AGENTS.md` per
  module so their AI answers first; paid tier includes community support only.
- **The copies drift from Hutch** — by design, since Hutch stays independent. Port worthwhile
  Hutch fixes across deliberately; AscentUI is free to diverge.
- **Genericising dilutes the edge** — the value is the opinionated rules. Keep them; make only
  locale/brand configurable.
- **A competitor adds business blocks first** (Odoo + AI builders are closest). Ship Phase 1–3
  fast; dispatch + field app is the moat.
