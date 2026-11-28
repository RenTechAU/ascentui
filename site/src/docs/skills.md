# Agent skills

**Planned.** Nothing on this page exists yet. It describes what we intend to ship, so you know what is coming and can plan around it.

An agent skill is a small set of instructions a coding agent loads when a task matches it. Where `llms.txt` tells an agent what AscentUI is, a skill tells it **how to do one job with it**, step by step, with checks at the end.

## What is planned

| Skill | What it would do | Tier |
| --- | --- | --- |
| **AscentUI conventions** | Teaches the agent the house rules before it writes anything: install with the CLI, never rewrite a component, data through props or a typed client, styles stay in the component | Free |
| **Build a list page** | Turns a description such as "a customers page" into a page from the free parts: Data Table, Empty State, Toaster with Undo, loading and error states | Free |
| **Wire a Pro screen** | Follows a Pro screen's agent guide for your stack: creates the tables, implements the contract, runs the checks until they pass | Pro |
| **Bring your brand** | Reads your colours and corner style and writes the matching theme overrides | Pro |
| **Audit a page** | Checks a page against the accessibility and responsive rules on the [Accessibility](#docs-accessibility) page and fixes what it finds | Pro |

The list may change before launch. The free conventions skill comes first, with the agent kit in phase 1.

## Until then

You can already give an agent most of this by hand:

1. Point it at `llms.txt`, which lists the rules for agents and every installable item.
2. Tell it to install components with the shadcn CLI rather than writing its own.
3. Ask it to read the component page's **Usage** and **API reference** before using a component.

```text
Read {{REGISTRY}}/llms.txt and follow its rules for agents. Then build a customers page with the AscentUI Data Table, an empty state, and a toast with Undo when a customer is archived.
```

The **MCP** button on each component page copies a prompt like this for that component. See [Using with agents](#docs-agents) for what an agent can read today.
