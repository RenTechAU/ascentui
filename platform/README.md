# platform

The systems behind selling and delivering AscentUI Pro: checkout, purchases, seats, access keys
and the key-gated registry. Private and proprietary. **Nothing here is deployed**, and it runs in
a labelled mock mode until the accounts in [`docs/SETUP.md`](../docs/SETUP.md) exist.

| File | What it is |
| --- | --- |
| `schema.sql` | Postgres/Supabase tables, row-level security and the launch-offer counter |
| `src/keys.ts` | Access keys: `asc_` prefix, SHA-256 hash, constant-time compare |
| `src/pricing.ts` | Which price applies, given launch spots sold |
| `src/licence.ts` | Does this key unlock this item; seat limits |
| `src/payments.ts` | `PaymentProvider` interface, Stripe Checkout, a Shopify stub (not decided), mock |
| `src/store.ts` | The interfaces every side effect goes through, with in-memory fakes |
| `src/supabase.ts` | Those interfaces on Supabase, over plain `fetch` |
| `src/handlers.ts` | `(Request) => Response` handlers: checkout, webhook, keys, registry |
| `src/app.ts` | Builds everything from environment variables and routes requests |

```bash
npm test -w platform        # unit tests, no network
npm run typecheck -w platform
```

Routes served by `createApp`: `POST /api/checkout`, `POST /api/webhook`, `GET|POST|DELETE /api/keys`,
`GET /api/launch-offer`, `GET /r/<name>.json`.

Secrets live only in the hosting provider's environment settings. `.env.example` lists the names.
