# AscentUI setup checklist

This is the list of things only you can do, in order. Each step says what to do, where, and
what to write down. It is written to be followed without technical background.

**Two rules for the whole list**

1. **Never paste a secret into a chat, an email, a document or the code.** A secret is anything
   marked SECRET below. Secrets go in exactly one place: the hosting provider's "Environment
   variables" screen (step 6).
2. **Use test mode first.** Nothing here needs real money until the last line of step 9.

Things that are not secret (the domain, the company name, price ids, the Supabase project URL)
are fine to tell Claude, and some of them need to go into the code.

## Before you start

- [ ] **Ownership.** A written agreement on what AscentUI may copy from the source engine and
      sell. Nothing goes public before this is signed (`BUSINESS-PLAN.md` §8).
- [ ] **Who sells.** Decide which company takes the money, and ask your accountant about tax on
      overseas digital sales. You need the company's legal name for step 5 and for the licence page.

## 1. Register the domain

- [ ] Buy `ascentui.com` or `ascentui.dev` at any registrar you already use.
- [ ] Turn on auto-renew.
- [ ] Tell Claude the domain. It is not a secret. Claude sets it in `site/src/content.ts`
      (`REGISTRY_BASE`), which removes the "registry address to be set" placeholders on the site.

## 2. Reserve the npm scope

- [ ] Sign in at npmjs.com (create an account if you need one, with two-factor sign-in on).
- [ ] Create an organisation named `ascentui`. The free plan is enough. This reserves `@ascentui`.
- [ ] Do not publish anything yet.

## 3. Create the Supabase project and run the schema

Supabase holds who paid, their seats and their access keys, and handles sign-in.

- [ ] Sign in at supabase.com and create a project named `ascentui`. Pick the region closest to
      most buyers. Save the database password in your password manager. SECRET.
- [ ] Open **SQL Editor**, choose **New query**, paste the whole of `platform/schema.sql` from
      the repository, and press **Run**. It should finish with "Success. No rows returned".
- [ ] Open **Table Editor** and check four tables exist: `customers`, `purchases`, `seats`,
      `access_keys`. Each should show "RLS enabled".
- [ ] Open **Authentication > Sign In / Providers > Email**. Keep **Email** on and keep
      **Confirm email** on. This matters: buyers get access by signing in with the email they
      paid with, so an email must be proven before it counts.
- [ ] Open **Authentication > URL Configuration** and set **Site URL** to your domain from step 1.
- [ ] Leave the page **Project Settings > API** open in a tab. You need three values from it in step 6.

## 4. Create the Vercel project and connect the repository

Vercel hosts the website.

- [ ] Sign in at vercel.com with the GitHub account that can see `RenTechAU/ascentui`.
- [ ] **Add New > Project**, pick the `ascentui` repository.
- [ ] Set **Framework preset** to Vite, **Build command** to `npm run build -w @ascentui/site`,
      and **Output directory** to `site/dist`. Leave the root directory as the repository root.
- [ ] Deploy. The site should load at the `vercel.app` address Vercel gives you.
- [ ] In **Settings > Domains**, add your domain from step 1 and follow Vercel's instructions at
      your registrar.
- [ ] Keep the repository private, and keep the Vercel address to yourself, until the ownership
      agreement is signed.

## 5. Choose Stripe or Shopify, then create the products

**Recommendation: Stripe.** It suits two one-time products, has no monthly fee, and is what the
code supports today. Shopify is a stub in the code, marked "not decided"; choosing it means more
build work before you can sell.

If Stripe:

- [ ] Create a Stripe account at stripe.com under the selling company. Finish the business details.
- [ ] Switch the dashboard to **Test mode** (in newer dashboards, a **Sandbox**).
- [ ] In **Product catalogue**, create two products and four prices. All prices are **One-off**, in **USD**.

| Product | Price | Amount | Goes in this variable |
| --- | --- | --- | --- |
| AscentUI Individual | Launch | 149.00 | `STRIPE_PRICE_INDIVIDUAL_LAUNCH` |
| AscentUI Individual | Regular | 299.00 | `STRIPE_PRICE_INDIVIDUAL` |
| AscentUI Team (10 seats) | Launch | 399.00 | `STRIPE_PRICE_TEAM_LAUNCH` |
| AscentUI Team (10 seats) | Regular | 699.00 | `STRIPE_PRICE_TEAM` |

- [ ] Open each price and copy its id (it starts with `price_`). Price ids are not secret.
- [ ] Ask your accountant whether to turn on Stripe Tax before taking real payments.

## 6. Set the environment variables

All of these go in **Vercel > your project > Settings > Environment Variables**. Paste each
value into the Value box there and nowhere else. Tick "Sensitive" for the ones marked SECRET.

| Name | Secret? | Where to find the value |
| --- | --- | --- |
| `SITE_URL` | No | Your domain with `https://` in front, no slash at the end |
| `PAYMENT_PROVIDER` | No | Type `stripe` |
| `STRIPE_SECRET_KEY` | **SECRET** | Stripe > Developers > API keys > Secret key. In test mode it starts with `sk_test_` |
| `STRIPE_WEBHOOK_SECRET` | **SECRET** | You get this in step 7. Come back and add it then |
| `STRIPE_PRICE_INDIVIDUAL_LAUNCH` | No | The price id from step 5 |
| `STRIPE_PRICE_INDIVIDUAL` | No | The price id from step 5 |
| `STRIPE_PRICE_TEAM_LAUNCH` | No | The price id from step 5 |
| `STRIPE_PRICE_TEAM` | No | The price id from step 5 |
| `SUPABASE_URL` | No | Supabase > Project Settings > API > Project URL |
| `SUPABASE_ANON_KEY` | No | Same page: the `anon` (publishable) key |
| `SUPABASE_SERVICE_ROLE_KEY` | **SECRET** | Same page: the `service_role` (secret) key. It can read and change everything, so treat it like a master password |
| `VITE_API_BASE` | No | Your domain with `https://` in front. This switches the pricing page out of mock mode. Add it only after step 8 works |

- [ ] Add every row. The names must match exactly.
- [ ] After adding or changing variables, redeploy (Deployments > the latest one > Redeploy).

Anything left empty keeps that part in mock mode: the site says so, and no payment is taken.

## 7. Set up the payment webhook

The webhook is how Stripe tells AscentUI that someone paid.

- [ ] Do step 8 first if it is not done: the webhook needs an address to call.
- [ ] In Stripe (still in test mode): **Developers > Webhooks > Add endpoint** (in newer
      dashboards: Workbench > Webhooks > Add destination).
- [ ] Endpoint URL: `https://<your-domain>/api/webhook`.
- [ ] Events to send: choose only `checkout.session.completed`.
- [ ] Save, then reveal the **Signing secret** (it starts with `whsec_`). SECRET. Paste it into
      Vercel as `STRIPE_WEBHOOK_SECRET` (step 6) and redeploy.

## 8. Ask Claude to connect the API to the hosting

One piece of build work has to wait for the Vercel project to exist, because it cannot be
tested without it: the small entry files that put `platform/` behind `/api/…` and `/r/…` on your
domain, and the sign-in and account page where a buyer creates a key.

- [ ] Tell Claude: "The Vercel and Supabase projects exist. Wire up the platform API and the
      account page." You do not need to share any secret for this.
- [ ] When it is deployed, open `https://<your-domain>/api/launch-offer` in a browser. It should
      show `"remaining": 100` and `"mock": false`. If it says `"mock": true`, a variable in
      step 6 is missing or misspelt.

## 9. Make a test purchase

Still in Stripe test mode. No real money moves.

- [ ] Open the pricing page on your domain and press **Get all-access**.
- [ ] On the Stripe page, pay with the test card `4242 4242 4242 4242`, any future expiry date,
      any three-digit code, and an email address you can open.
- [ ] In Stripe > Developers > Webhooks, the event should show as delivered (a green tick, status 200).
- [ ] In Supabase > Table Editor, `purchases` should have one row with your email, `plan`
      `individual`, `amount_cents` `14900` and `launch_offer` `true`. `seats` should have one row.
- [ ] Open `https://<your-domain>/api/launch-offer` again. It should now say `"remaining": 99`.
- [ ] Sign in on the site with the same email, create an access key, and copy it. It is shown once.
- [ ] In Stripe, resend the same webhook event. `purchases` should still have one row.
- [ ] Delete the test rows in Supabase (`purchases`, then `customers`) so the counter starts at 100.

**Going live**, only after everything above passes and the ownership agreement is signed:

- [ ] In Stripe, switch to live mode and repeat step 5 (products and prices) and step 7 (webhook).
- [ ] In Vercel, replace `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and the four price ids
      with the live values, and redeploy.
- [ ] Make one real purchase yourself, then refund it in Stripe.

## Still open, and where it shows

| Decision | Where it shows until decided |
| --- | --- |
| Domain | "registry address to be set" in the docs; `https://<your-domain>` in examples |
| Company legal name | "company name to be set" in the footer and on the licence page |
| Refund terms | "to be confirmed" on the pricing and licence pages |
| Licence legal text | The licence page is labelled "Draft, not yet legal text". It needs a lawyer |
| Stripe or Shopify | Stripe is built. Shopify is a stub |
| Where Pro source is kept | Not decided. There are no Pro items yet, so the key-gated registry has nothing to serve |

## What is built and what is not

Built and tested without any account: the price rules, access keys, licence and seat checks,
the checkout, webhook, key and registry handlers, and the database schema (run on a local
Postgres with stand-ins for Supabase's roles).

Not built, because it needs the accounts above: the hosting entry files and the account page
(step 8), sending receipt or sign-in emails from your own sending domain, giving a team seat to
a colleague from the site, and marking a purchase refunded automatically (for now, set `status`
to `refunded` on the row in Supabase by hand; the key stops working straight away).

Not yet run against the real services: the Stripe and Supabase code is tested against
stand-ins only. Step 9 is the first real run, and it is where to expect small fixes.

One limit to know: the launch price is decided when a buyer opens checkout. If several people
open checkout at the same moment as the last spots sell, a few more than 100 can get the launch
price.
