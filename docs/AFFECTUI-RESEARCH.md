# affectUI: how it works (research, 2026-11-27)

Notes from walking affectui.com in a browser: pricing, checkout, delivery of Pro code,
hosting, AI install and licence. AscentUI follows the same business model, so this is the
reference for what to build. Nothing was purchased; the walk stopped at the payment page.

## 1. Summary

| Area | What affectUI does | What it means for AscentUI |
| --- | --- | --- |
| Product | 250+ React items: components, screens, blocks, illustrations, motion. 75 free (MIT), 101 Pro components plus 50 Pro screens | Same split: free building blocks, Pro business modules |
| Format | One `.tsx` per item, styles inside, no Tailwind, no other packages | Adopt (decision: needs React 19, see §7) |
| Install | shadcn CLI, copy and paste, or MCP server | Same three routes |
| Checkout | Stripe-hosted checkout, one line item, no account needed | Same |
| Pro delivery | Personal access key sent as a bearer token to the same registry | Same |
| Hosting | Vite single-page app on Vercel, Supabase sign-in | Railway or Vercel; either works |
| Pricing | $249 Individual, $699 Team (10 seats), one-time | Already the recommended AscentUI pricing |

## 2. Pricing

- **Free, $0:** 75 items, MIT, no account needed. Includes the CLI, MCP and a free agent skill.
- **Individual, $249 once:** all Pro items, 50 app screens, Pro agent skills, unlimited
  commercial projects, lifetime updates, access key, support within 24 hours.
- **Team, $699 once:** 10 seats on one licence, purchase orders and custom invoicing,
  priority component requests, support within 12 hours. More than 10 seats is a custom licence.
- **Sale mechanics:** Black Friday 30% off ($174 / $489) with a countdown. The price data comes
  from an `/api/pricing` endpoint that also has fields for a regional price, a price rise and
  "founder spots" (25, all gone), so those levers exist even when unused.
- **Regional pricing:** Individual is automatically cheaper in some countries; Team is the same everywhere.
- **Refund:** full refund if a Pro item doesn't do what its page says and isn't fixed within 14 days.
- **Sales aids on the page:** a "what would it cost to build yourself" calculator, a logo row,
  one testimonial, and an FAQ.

## 3. Checkout and access

1. "Get lifetime access" calls the site's own `/api/checkout`, which creates a Stripe Checkout
   session and redirects to `checkout.stripe.com`.
2. The Stripe page shows one line item ("affectUI Individual", lifetime licence for one person),
   subtotal, tax and total. No account is needed to pay.
3. After paying, the buyer signs in on the site **with the same email** and has access straight away.
4. Under Account → Downloads the buyer creates a personal access key (`aui_…`).

So the only things the site stores are: who paid (by email), their seats, and their keys.

## 4. How Pro code is delivered

- Every item has a registry address: `https://www.affectui.com/r/<name>.json`. It is a standard
  shadcn registry item with no dependencies and one file whose full source is inside the JSON.
- **Free items:** the address is open to anyone.
- **Pro items:** the same address only answers when the request carries
  `Authorization: Bearer <access key>`. The buyer puts the key in `.env.local` and registers the
  `@affectui` namespace with that header in `components.json`, then installs by name:
  `npx shadcn@latest add @affectui/<name>`.
- Signed-in Pro members also see the code and a copy button on every Pro page.
- Previews and docs for Pro items are public. Only the source is gated.

## 5. AI install

- **MCP server** at `/api/mcp` (HTTP). Tools: `search_components`, `list_components`,
  `get_component` (docs, usage, props, install command) and `get_source`. Pro source needs the
  same access key as a header.
- **`llms.txt`** (index) and **`llms-full.txt`** (every item's docs in one file).
- **Agent skills:** a free one, plus Pro skills that build whole pages, migrate a codebase onto
  the library, pull a brand from Figma or a website, audit, and fix focus and responsive layout.

## 6. How a component is written

- `"use client"` at the top; one exported component.
- The CSS is a template string in the file, rendered through
  `<style href="ui-<name>" precedence="default">`. React 19 hoists and de-duplicates it.
- Class names are a short block prefix with BEM-style parts (`ui-rb`, `ui-rb__btn`). States use
  data attributes and ARIA attributes, not extra classes.
- Theming: each component defines its own variables that read host variables with a hard-coded
  fallback, e.g. `--ui-rb-ink: var(--aui-ink, #404040)`. It works with no token file installed.
- Dark mode: a `.dark` or `[data-theme="dark"]` ancestor. No media query.
- A `prefers-reduced-motion` block turns animation off.

## 7. Licence (Pro)

Allowed: unlimited personal, commercial and client projects; changing the code; shipping inside
finished products; private repos; open-source *apps* with a notice kept at the top of each Pro
file; an internal team starter.

Not allowed: publishing Pro source on its own (files, package, registry, download); selling or
giving it away as a UI kit, template or component library; building a page builder with it;
sharing a key or seat.

**Consequences for AscentUI**
- AscentUI cannot contain affectUI Pro code. Copying the *approach* (file format, delivery,
  pricing) is fine; copying Pro source is not.
- affectUI's free items are MIT and could legally be reused with their notice, but the decision
  is to write our own code from Hutch and only follow the style.
- Their plain-words licence page (allowed, not allowed, common cases) is a good template for
  the AscentUI Pro licence.

## 8. Decisions this raises

1. **React 19.** The styles-inside-one-file trick depends on React 19. `@ascentui/ui` currently
   allows React 18. Recommendation: require 19.
2. **Prefix.** affectUI uses `aui-` for its variables. AscentUI should use `asc-` to avoid a clash
   in projects that install both.
3. **Where AscentUI differs.** A module is more than one file (screen + schema + server + demo
   data), so a registry item will carry several files and the SQL. The key-gated registry still works.
4. **What to build for launch,** in order: registry JSON build, key-gated registry endpoint,
   Stripe Checkout plus email sign-in plus key page, MCP server, `llms.txt`.

## Sources

- https://www.affectui.com/pricing
- https://www.affectui.com/license
- https://www.affectui.com/docs/introduction
- https://www.affectui.com/docs/installation
- https://www.affectui.com/docs/ai
- https://www.affectui.com/r/reaction-bar.json
