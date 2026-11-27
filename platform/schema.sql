-- AscentUI platform schema. Postgres 15+ on Supabase.
-- Run once in the Supabase SQL editor (docs/SETUP.md step 3). Safe to run on an empty project;
-- it is not a migration tool and does not alter existing tables.
--
-- What is stored: who paid (by email), their purchases, who holds a seat, and their access keys.
-- An access key itself is never stored: only its SHA-256 hash and a short prefix for display.
--
-- Who can do what:
--   * A signed-in customer can READ their own rows (row-level security, matched on the email in
--     their sign-in token). They cannot write anything directly.
--   * All writes go through the server, which uses the service role and the functions below.
--   * Anyone can ask how many launch-offer spots are left. Nothing else is public.

-- ---------------------------------------------------------------- tables

create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique check (email = lower(email) and position('@' in email) > 1),
  created_at  timestamptz not null default now()
);

create table public.purchases (
  id                  uuid primary key default gen_random_uuid(),
  customer_email      text not null references public.customers (email) on update cascade,
  plan                text not null check (plan in ('individual', 'team')),
  amount_cents        integer not null check (amount_cents >= 0),
  currency            text not null default 'usd' check (currency = lower(currency) and length(currency) = 3),
  provider            text not null check (provider in ('stripe', 'shopify')),
  provider_reference  text not null,
  launch_offer        boolean not null default false,
  seats_included      integer not null check (seats_included between 1 and 10),
  status              text not null default 'paid' check (status in ('paid', 'refunded')),
  created_at          timestamptz not null default now(),
  -- One row per payment, however many times the provider tells us about it.
  unique (provider, provider_reference)
);
create index purchases_customer_email_idx on public.purchases (customer_email);

create table public.seats (
  id           uuid primary key default gen_random_uuid(),
  purchase_id  uuid not null references public.purchases (id) on delete cascade,
  email        text not null check (email = lower(email) and position('@' in email) > 1),
  created_at   timestamptz not null default now(),
  removed_at   timestamptz
);
-- A person holds at most one active seat on a purchase.
create unique index seats_active_idx on public.seats (purchase_id, email) where removed_at is null;
create index seats_email_idx on public.seats (email) where removed_at is null;

create table public.access_keys (
  id            uuid primary key default gen_random_uuid(),
  owner_email   text not null references public.customers (email) on update cascade,
  key_hash      text not null unique check (key_hash ~ '^[0-9a-f]{64}$'),  -- SHA-256, hex. Never the key.
  key_prefix    text not null check (length(key_prefix) <= 16),            -- e.g. asc_AbCd1234, for display
  label         text check (length(label) <= 60),
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz
);
create index access_keys_owner_email_idx on public.access_keys (owner_email);

-- ---------------------------------------------------------------- seat limit

create function public.enforce_seat_limit() returns trigger
language plpgsql as $$
declare
  allowed integer;
  used integer;
begin
  -- Lock the purchase so two seats cannot be added at the same moment.
  select seats_included into allowed from public.purchases where id = new.purchase_id for update;
  select count(*) into used from public.seats where purchase_id = new.purchase_id and removed_at is null;
  if used >= allowed then
    raise exception 'All % seats on this purchase are in use', allowed using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger seats_limit before insert on public.seats
  for each row execute function public.enforce_seat_limit();

-- ---------------------------------------------------------------- row-level security

-- The email of the signed-in person, from their Supabase sign-in token.
create function public.current_email() returns text
language sql stable as $$ select lower(nullif(auth.jwt() ->> 'email', '')) $$;

alter table public.customers   enable row level security;
alter table public.purchases   enable row level security;
alter table public.seats       enable row level security;
alter table public.access_keys enable row level security;

-- Read-only, own rows only. No insert, update or delete policies exist, so a signed-in customer
-- cannot write; the service role (used only by the server) bypasses row-level security.
create policy customers_read_own on public.customers for select to authenticated
  using (email = public.current_email());

create policy purchases_read_own on public.purchases for select to authenticated
  using (customer_email = public.current_email());

-- A person sees their own seat, and a buyer sees every seat on their purchases.
create policy seats_read_own on public.seats for select to authenticated
  using (
    email = public.current_email()
    or exists (select 1 from public.purchases p where p.id = seats.purchase_id and p.customer_email = public.current_email())
  );

create policy access_keys_read_own on public.access_keys for select to authenticated
  using (owner_email = public.current_email());

revoke all on public.customers, public.purchases, public.seats, public.access_keys from anon, authenticated;
grant select on public.customers, public.purchases, public.seats, public.access_keys to authenticated;
-- The hash is useless without the key, but there is no reason to hand it out either.
revoke select on public.access_keys from authenticated;
grant select (id, owner_email, key_prefix, label, created_at, last_used_at, revoked_at) on public.access_keys to authenticated;

-- ---------------------------------------------------------------- launch offer

-- Spots left at the launch price, out of 100, across both plans. Counts paid purchases only.
-- Public: this is the only thing a visitor who is not signed in can read.
create function public.launch_offer_spots_remaining() returns integer
language sql stable security definer set search_path = public as $$
  select greatest(0, 100 - count(*))::integer from public.purchases where launch_offer and status = 'paid'
$$;
revoke all on function public.launch_offer_spots_remaining() from public;
grant execute on function public.launch_offer_spots_remaining() to anon, authenticated, service_role;

-- ---------------------------------------------------------------- server-only functions

-- Records a purchase and gives the buyer the first seat. Returns true when it was new, false
-- when this payment was already recorded (the payment provider can send the same event twice).
create function public.record_purchase(
  p_email text, p_plan text, p_amount_cents integer, p_currency text,
  p_provider text, p_provider_reference text, p_launch_offer boolean
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(trim(p_email));
  v_purchase uuid;
begin
  insert into customers (email) values (v_email) on conflict (email) do nothing;
  insert into purchases (customer_email, plan, amount_cents, currency, provider, provider_reference, launch_offer, seats_included)
  values (v_email, p_plan, p_amount_cents, lower(p_currency), p_provider, p_provider_reference, p_launch_offer,
          case p_plan when 'team' then 10 else 1 end)
  on conflict (provider, provider_reference) do nothing
  returning id into v_purchase;
  if v_purchase is null then
    return false;
  end if;
  insert into seats (purchase_id, email) values (v_purchase, v_email);
  return true;
end $$;

-- True when this person holds a seat on a purchase that is paid and not refunded.
create function public.has_active_seat(p_email text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from seats s join purchases p on p.id = s.purchase_id
    where s.email = lower(trim(p_email)) and s.removed_at is null and p.status = 'paid'
  )
$$;

-- Stores a new access key (hash and prefix only) for a seat holder.
create function public.create_access_key(p_email text, p_hash text, p_prefix text, p_label text)
returns public.access_keys
language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(trim(p_email));
  v_row access_keys;
begin
  if not has_active_seat(v_email) then
    raise exception 'No active seat for this email' using errcode = 'insufficient_privilege';
  end if;
  insert into customers (email) values (v_email) on conflict (email) do nothing;
  insert into access_keys (owner_email, key_hash, key_prefix, label)
  values (v_email, p_hash, p_prefix, p_label) returning * into v_row;
  return v_row;
end $$;

revoke all on function public.record_purchase(text, text, integer, text, text, text, boolean) from public, anon, authenticated;
revoke all on function public.has_active_seat(text) from public, anon, authenticated;
revoke all on function public.create_access_key(text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_purchase(text, text, integer, text, text, text, boolean) to service_role;
grant execute on function public.has_active_seat(text) to service_role;
grant execute on function public.create_access_key(text, text, text, text) to service_role;
