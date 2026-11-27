# CLAUDE.md

Guidance for Claude Code working in this repository.

## How to respond

Be direct. Skip preambles. Give simple, non-technical explanations unless asked for detail.

## What this is

**AscentUI** is a kit of pre-built business components for vibe coders. It is copied from
**Hutch** (`RenTechAU/chillbunny`), Chill Bunny's admin engine. The full plan is
[`docs/PLAN.md`](docs/PLAN.md). Read it before structural work.

## Rules

- **Hutch stays separate and independent.** AscentUI copies from Hutch, one way. Never make
  Hutch install, import or depend on AscentUI, and never change Hutch as part of AscentUI work.
  AscentUI owns its copies and may diverge freely; porting a later Hutch fix is a choice.
- **Nothing Chill Bunny–specific ships.** No owner names, no ice bath/sauna/RLT product types, no
  legacy-import columns, no Australia-only assumptions baked in (tax, bank fields and states are
  config).
- **Data comes in through props or a typed client interface**, never a hidden fetch. Demos pass
  a mock client; a real app passes its API.
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
