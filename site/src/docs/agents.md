# Using with agents

AscentUI is built for people who direct a coding agent such as Claude Code, Cursor, v0 or Codex. This page covers what the agent gets and how a Pro screen is made real.

## What an agent can read

| Thing | What it is | Status |
| --- | --- | --- |
| `llms.txt` | A short index of the catalog and docs, at `{{REGISTRY}}/llms.txt` | Built with the website |
| `llms-full.txt` | The catalog and all the docs in one file, at `{{REGISTRY}}/llms-full.txt` | Built with the website |
| Registry | Every free item as a shadcn registry item, source included | Built with the website |
| Conventions guide | A short file the agent reads first: how to compose a list page, where state lives, how to name things | Planned |
| Page recipes | Step-by-step recipes for the free screens | Planned |
| MCP server | Lets an agent search the catalog, read an item's docs and fetch its source. Pro source will need your access key | Planned |

Until the MCP server exists, point your agent at `llms.txt` and ask it to install items with the shadcn CLI.

```text
Read {{REGISTRY}}/llms.txt, then add the AscentUI data table to the customers page.
```

## The backend recipe

Each Pro screen ships a backend **recipe**, not a backend. A recipe is four small files that travel with the screen.

| File | What it is | Why it matters |
| --- | --- | --- |
| Contract | The typed list of calls the screen makes and the shapes they return | The screen never guesses, and an agent knows exactly what to build |
| Mock client | The same contract answered from demo data, in memory | The screen works the minute it is installed, before any backend exists |
| Agent guide (`AGENTS.md`) | Plain instructions for a coding agent: the tables to create, the rules to enforce, the mistakes to avoid | You say "wire this to my database" and it happens |
| Checks | A test file the agent runs against its own work until it passes | This is what makes the result trustworthy |

Recipes are planned for phase 2, with the first Pro screens. None is published yet.

### Why a recipe and not server code

- **Buyers are on different stacks.** One server framework fits a fraction of them. A contract plus a guide fits all.
- **It is how you already work.** You direct an agent. The recipe gives the agent a precise brief.
- **The business rules are the hard part.** Tax and rounding, bill-once guards, who can see which price, undo. Those are written into the guide as rules and enforced by the checks.

A bare prompt gives no guarantee: two runs produce two different backends. The checks are what turn a prompt into something you can rely on.

### How it goes

1. Install the screen. It runs straight away on the mock client.
2. Ask your agent to follow the screen's `AGENTS.md` for your stack.
3. The agent builds the tables and the calls in the contract.
4. The agent runs the checks and fixes its work until they pass.
5. Swap the mock client for the real one.

A reference server, one real implementation of every contract, is planned for phase 5.

## One rule the components keep

Data comes in through props or a typed client. No component fetches on its own. That is what makes the mock client and your real API interchangeable.
