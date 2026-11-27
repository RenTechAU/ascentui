# CLAUDE.md

Guidance for Claude Code working in this repository.

## How to respond

Be direct. Skip preambles. Give simple, non-technical explanations unless asked for detail.

## What this is

**AscentUI** is a kit of pre-built business components for vibe coders. It is extracted from
**Hutch** (`RenTechAU/chillbunny`), Chill Bunny's admin engine. The full plan is
[`docs/PLAN.md`](docs/PLAN.md). Read it before structural work.

## Rules

- **Extract, don't fork.** A component moves *out* of Hutch into AscentUI, and Hutch installs it
  back as a published `@ascentui/*` package. Never keep two copies that can drift. A change
  ships here first, then Hutch bumps the version.
- **Nothing Chill Bunny–specific ships.** No owner names, no ice bath/sauna/RLT product types, no
  legacy-import columns, no Australia-only assumptions baked in (tax, bank fields and states are
  config).
- **Data comes in through props or a typed client interface**, never a hidden fetch. Demos pass
  a mock client; Hutch passes its real API.
- **Every item installs cleanly by an AI agent**: the shadcn registry and an `AGENTS.md` per module.
- **Styles travel with the component.** Use the CSS variables from `@ascentui/tokens`, and keep
  styles in the component's own CSS file, never in a global stylesheet.

## Module contract

Every `modules/<name>/` has `schema/` (one clean SQL file, plus its `requires:`), `server/` (a
Hono router factory), `ui/` (components taking a typed client), `demo/` (seed data for a
fictional company), `README.md` and `AGENTS.md`. See `modules/README.md`.

## Licensing

`ui/` and `tokens/` are **MIT**. Everything under `modules/` is **proprietary** (Pro). Don't
move Pro code into an MIT package.

## Branching

`main` is the release branch. Work on `feature/<slug>` / `fix/<slug>` / `chore/<slug>` and merge
by pull request.
