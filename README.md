# AscentUI

Pre-built business components for people vibe-coding their own platform. Not just how a
screen looks: each module is the **screen + database schema + server logic + demo data**,
copied from Hutch, the system that runs a real business (Chill Bunny). Hutch itself stays
separate and doesn't depend on AscentUI.

- **Free tier (MIT):** building blocks such as tables, pickers, charts, calendars and forms.
- **Pro:** business modules such as dispatch with a field app, CRM, quotes and payments,
  serials and warranty, and an undo history.

Install with the shadcn CLI or let your AI do it through the AscentUI MCP server.

> Status: **pre-release, private.** Nothing is published yet. See [`docs/PLAN.md`](docs/PLAN.md).

## Layout

```
tokens/     @ascentui/tokens   colour, type and spacing variables (MIT)
ui/         @ascentui/ui       free building blocks (MIT)
modules/    @ascentui/<name>   Pro business modules (see modules/README.md)
site/       @ascentui/site     the website: landing, library, docs, pricing, licence
platform/   platform           checkout, purchases, seats, access keys, key-gated registry
scripts/                       build scripts: catalog check, registry and llms files
docs/                          plans, the catalog and the setup checklist
```

| Folder | What it is | Licence |
| --- | --- | --- |
| `tokens/` | The CSS variables every component reads. Change the look here | MIT |
| `ui/` | The free components. Each is a `.tsx` file with its own `.css` file | MIT |
| `modules/` | Pro business modules. None is built yet | Proprietary |
| `site/` | The website, a Vite and React app with hash routing. `site/src/catalog.ts` is the catalog as data; `site/src/docs/` holds the docs as markdown; `site/src/content.ts` holds prices and undecided facts, which show as placeholders | Proprietary |
| `platform/` | What sells and delivers Pro: the database schema, Stripe checkout, access keys and the registry that checks them. Runs in mock mode until the accounts exist. Not deployed | Proprietary |
| `scripts/` | `check-catalog.mjs` fails the build if the catalog and `docs/CATALOG.md` disagree. `build-registry.mjs` writes the shadcn registry and `llms.txt` into `site/public/` | |
| `docs/` | `CATALOG.md` (what ships, free and Pro), `BUSINESS-PLAN.md`, `PLAN.md`, `AFFECTUI-RESEARCH.md`, and `SETUP.md`, the owner's step-by-step account checklist | |

## Develop

```bash
npm install
npm run typecheck
npm test                          # platform unit tests, no network
npm run dev -w @ascentui/site     # the website, in mock mode
npm run build -w @ascentui/site   # catalog check, registry, then the site
```

Node 20 or newer.
