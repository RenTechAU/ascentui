# Modules (Pro)

A module is a working business block, installed as one unit:

| Part | Content |
| --- | --- |
| `schema/` | One clean SQL file for the module, with a `-- requires: <module>, …` header |
| `server/` | A Hono router factory, e.g. `dispatchRoutes({ db, withActor, auth })` |
| `ui/` | React components that take a typed client (`DispatchClient`), never a hidden fetch |
| `demo/` | Seed data for a fictional company |
| `README.md` | What it does and what it requires |
| `AGENTS.md` | How an AI agent should install and wire it |

Planned, in build order (see `docs/PLAN.md` §3):

1. `foundations`: staff, auth, roles and tab access, history with undo, archive and trash
2. `dispatch`: cases board, case drawer, resolve form, partner field app
3. `crm`, `quotes`, `assets`, `tasks`, `notifications`, `analytics`

Proprietary. Not covered by the MIT licence on `ui/` and `tokens/`.
