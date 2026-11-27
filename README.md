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
tokens/     @ascentui/tokens   colour, type and spacing variables (light + dark)
ui/         @ascentui/ui       free building blocks (MIT)
modules/    @ascentui/<name>   Pro business modules (see modules/README.md)
docs/       plan and design notes
```

## Develop

```bash
npm install
npm run typecheck
```

Node 20 or newer.
