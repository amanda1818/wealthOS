-- Duo (wealthOS) core schema: households, members, scoped financial entities, RLS.
-- Phase 1: safe to charge money. Every OURS/MINE entity carries household_id + scope + owner_user_id.
-- RLS rule: a member reads household rows EXCEPT rows where scope='MINE' and owner_user_id <> auth.uid().

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- households + members
-- ---------------------------------------------------------------------------

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our Household',
  invite_code text not null unique default substr(md5(random()::text || clock_timestamp()::text), 1, 8),
  plan text not null default 'FREE' check (plan in ('FREE', 'DUO', 'SOVEREIGN')),
  base_currency text not null default 'IDR',
  created_at timestamptz not null default now()
);

-- one row per (auth user, household). id == auth.uid() keeps joins trivial and
-- lets RLS policies compare owner_user_id = auth.uid() everywhere.
create table household_members (
  id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid not null references households (id) on delete cascade,
  role text not null default 'MEMBER' check (role in ('CFO', 'MEMBER')),
  display_name text not null,
  email text not null,
  avatar text,
  monthly_income numeric not null default 0,
  allocation_strategy jsonb,
  is_private_mode boolean not null default false,
  created_at timestamptz not null default now()
);

create index household_members_household_id_idx on household_members (household_id);

create or replace function is_household_member(p_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from household_members
    where household_id = p_household_id and id = auth.uid()
  );
$$;

create or replace function current_household_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select household_id from household_members where id = auth.uid() limit 1;
$$;

alter table households enable row level security;
alter table household_members enable row level security;

create policy households_select on households
  for select using (is_household_member(id));

create policy households_update_cfo on households
  for update using (
    exists (select 1 from household_members m where m.household_id = id and m.id = auth.uid() and m.role = 'CFO')
  );

create policy household_members_select on household_members
  for select using (household_id = current_household_id());

create policy household_members_update_self on household_members
  for update using (id = auth.uid());

-- No direct INSERT policy on households/household_members: creation and joining
-- only happen through the SECURITY DEFINER RPCs below, so an invite code is
-- always required to attach a second user to an existing household.

create or replace function create_household(p_household_name text, p_display_name text)
returns household_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household households;
  v_member household_members;
begin
  if exists (select 1 from household_members where id = auth.uid()) then
    raise exception 'User already belongs to a household';
  end if;

  insert into households (name) values (coalesce(nullif(p_household_name, ''), 'Our Household'))
  returning * into v_household;

  insert into household_members (id, household_id, role, display_name, email)
  values (auth.uid(), v_household.id, 'CFO', coalesce(nullif(p_display_name, ''), 'Member'), auth.jwt() ->> 'email')
  returning * into v_member;

  return v_member;
end;
$$;

create or replace function join_household(p_invite_code text, p_display_name text)
returns household_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household households;
  v_member household_members;
begin
  if exists (select 1 from household_members where id = auth.uid()) then
    raise exception 'User already belongs to a household';
  end if;

  select * into v_household from households where invite_code = lower(p_invite_code);
  if not found then
    raise exception 'Invalid invite code';
  end if;

  insert into household_members (id, household_id, role, display_name, email)
  values (auth.uid(), v_household.id, 'MEMBER', coalesce(nullif(p_display_name, ''), 'Member'), auth.jwt() ->> 'email')
  returning * into v_member;

  return v_member;
end;
$$;

grant execute on function create_household(text, text) to authenticated;
grant execute on function join_household(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Helper: standard RLS for OURS|MINE household-scoped tables.
-- select/insert/update/delete allowed when caller is a household member AND
-- (scope = 'OURS' OR owner_user_id = auth.uid()).
-- ---------------------------------------------------------------------------

create or replace function can_access_scoped_row(p_household_id uuid, p_scope text, p_owner_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select is_household_member(p_household_id)
    and (p_scope = 'OURS' or p_owner_user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- pockets
-- ---------------------------------------------------------------------------

create table pockets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  client_id text not null,
  name text not null,
  balance numeric not null default 0,
  target numeric,
  "group" text not null check ("group" in ('WEALTH', 'SANCTUARY', 'DAILY', 'LIFESTYLE')),
  behavior text not null check (behavior in ('COMMITMENT', 'BUDGET')),
  description text,
  currency text,
  pact_rules jsonb,
  is_shared boolean not null default true,
  lead_id text, -- legacy role-slot id ('user_her'/'user_his'); attribution only, not RLS-relevant
  allow_carryover boolean not null default false,
  scope text not null default 'OURS' check (scope in ('OURS', 'MINE')),
  owner_user_id uuid references household_members (id),
  updated_at timestamptz not null default now(),
  unique (household_id, client_id)
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  client_id text not null,
  date timestamptz not null,
  description text not null,
  amount numeric not null,
  original_amount numeric,
  original_currency text,
  exchange_rate numeric,
  repaid_amount numeric not null default 0,
  net_amount numeric not null,
  category text,
  type text not null,
  pocket text,
  merchant text,
  tags text[],
  split_count integer,
  receivable_amount numeric,
  initial_receivable_amount numeric,
  is_installment boolean not null default false,
  installment_total_months integer,
  status text,
  owner_user_id uuid references household_members (id),
  payer_user_id uuid references household_members (id),
  manual_override boolean not null default false,
  is_verified boolean not null default false,
  payer_notes text,
  scope text not null default 'OURS' check (scope in ('OURS', 'MINE')),
  updated_at timestamptz not null default now(),
  unique (household_id, client_id)
);

create table liabilities (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  client_id text not null,
  name text not null,
  total_amount numeric not null,
  remaining_amount numeric not null,
  monthly_payment numeric not null,
  interest_rate numeric not null default 0,
  category text not null check (category in ('CONSUMPTIVE', 'PRODUCTIVE')),
  currency text not null default 'IDR',
  start_date date,
  months_total integer,
  months_remaining integer,
  linked_asset_id text,
  scope text not null default 'OURS' check (scope in ('OURS', 'MINE')),
  owner_user_id uuid references household_members (id),
  updated_at timestamptz not null default now(),
  unique (household_id, client_id)
);

create table fortress_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  client_id text not null,
  name text not null,
  category text not null,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  deadline date,
  monthly_contribution numeric,
  assets jsonb not null default '[]'::jsonb,
  is_strategic boolean not null default false,
  assumed_inflation_rate numeric,
  expected_annual_return numeric,
  actuarial_future_value numeric,
  required_monthly_velocity numeric,
  scope text not null default 'OURS' check (scope in ('OURS', 'MINE')),
  owner_user_id uuid references household_members (id),
  updated_at timestamptz not null default now(),
  unique (household_id, client_id)
);

-- Meja Piutang / settlement claims. Distinct from transactions so Together
-- (Phase 3 Money Date) can track settlement lifecycle independent of ledger rows.
create table claims (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  client_id text not null,
  transaction_id uuid references transactions (id) on delete set null,
  description text not null,
  amount numeric not null,
  currency text not null default 'IDR',
  counterparty_user_id uuid references household_members (id),
  status text not null default 'PENDING' check (status in ('PENDING', 'SETTLED')),
  scope text not null default 'OURS' check (scope in ('OURS', 'MINE')),
  owner_user_id uuid references household_members (id),
  updated_at timestamptz not null default now(),
  unique (household_id, client_id)
);

create table recurring_obligations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  client_id text not null,
  name text not null,
  amount numeric not null,
  pocket text,
  due_date integer not null check (due_date between 1 and 31),
  merchant text,
  category text,
  scope text not null default 'OURS' check (scope in ('OURS', 'MINE')),
  owner_user_id uuid references household_members (id),
  updated_at timestamptz not null default now(),
  unique (household_id, client_id)
);

-- ---------------------------------------------------------------------------
-- RLS: identical OURS/MINE pattern across all scoped tables above.
-- ---------------------------------------------------------------------------

alter table pockets enable row level security;
alter table transactions enable row level security;
alter table liabilities enable row level security;
alter table fortress_goals enable row level security;
alter table claims enable row level security;
alter table recurring_obligations enable row level security;

create policy pockets_all on pockets
  for all using (can_access_scoped_row(household_id, scope, owner_user_id))
  with check (can_access_scoped_row(household_id, scope, owner_user_id));

create policy transactions_all on transactions
  for all using (can_access_scoped_row(household_id, scope, owner_user_id))
  with check (can_access_scoped_row(household_id, scope, owner_user_id));

create policy liabilities_all on liabilities
  for all using (can_access_scoped_row(household_id, scope, owner_user_id))
  with check (can_access_scoped_row(household_id, scope, owner_user_id));

create policy fortress_goals_all on fortress_goals
  for all using (can_access_scoped_row(household_id, scope, owner_user_id))
  with check (can_access_scoped_row(household_id, scope, owner_user_id));

create policy claims_all on claims
  for all using (can_access_scoped_row(household_id, scope, owner_user_id))
  with check (can_access_scoped_row(household_id, scope, owner_user_id));

create policy recurring_obligations_all on recurring_obligations
  for all using (can_access_scoped_row(household_id, scope, owner_user_id))
  with check (can_access_scoped_row(household_id, scope, owner_user_id));

create index pockets_household_idx on pockets (household_id);
create index transactions_household_idx on transactions (household_id);
create index liabilities_household_idx on liabilities (household_id);
create index fortress_goals_household_idx on fortress_goals (household_id);
create index claims_household_idx on claims (household_id);
create index recurring_obligations_household_idx on recurring_obligations (household_id);

-- ---------------------------------------------------------------------------
-- household-level shared data (no MINE concept: life cards, advisor log,
-- monthly snapshots, settings). Still gated to household members only.
-- ---------------------------------------------------------------------------

create table life_cards (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  client_id text not null,
  name text not null,
  cost_impact numeric not null default 0,
  upfront_cost numeric not null default 0,
  icon text,
  is_active boolean not null default true,
  inflation_adjusted boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (household_id, client_id)
);

-- Assistant conversation. A message is private when the asking member had
-- private-mode on; enforced the same OURS/MINE way as financial rows.
create table advisor_messages (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  client_id text not null,
  sender text not null check (sender in ('USER', 'ALPHA')),
  text text not null,
  related_metric text,
  scope text not null default 'OURS' check (scope in ('OURS', 'MINE')),
  owner_user_id uuid references household_members (id),
  created_at timestamptz not null default now(),
  unique (household_id, client_id)
);

create table historical_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  client_id text not null,
  month text not null,
  total_revenue numeric not null default 0,
  total_burn numeric not null default 0,
  net_worth numeric not null default 0,
  sovereignty_days integer not null default 0,
  pockets_snapshot jsonb not null default '{}'::jsonb,
  transactions_snapshot jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (household_id, client_id)
);

create table household_settings (
  household_id uuid primary key references households (id) on delete cascade,
  sanctuary_allocation numeric not null default 40,
  daily_allocation numeric not null default 40,
  play_allocation numeric not null default 20,
  tax_rate numeric not null default 20,
  primary_currency text not null default 'IDR',
  secondary_currency text not null default 'USD',
  show_claims_desk boolean not null default true,
  custom_claims_desk_title text,
  custom_client_claims_title text,
  custom_shared_splits_title text,
  show_client_reimbursements boolean not null default true,
  show_partner_splits boolean not null default true,
  settlement_balance numeric not null default 0,
  updated_at timestamptz not null default now()
);

alter table life_cards enable row level security;
alter table advisor_messages enable row level security;
alter table historical_snapshots enable row level security;
alter table household_settings enable row level security;

create policy life_cards_all on life_cards
  for all using (is_household_member(household_id)) with check (is_household_member(household_id));

create policy advisor_messages_all on advisor_messages
  for all using (can_access_scoped_row(household_id, scope, owner_user_id))
  with check (can_access_scoped_row(household_id, scope, owner_user_id));

create policy historical_snapshots_all on historical_snapshots
  for all using (is_household_member(household_id)) with check (is_household_member(household_id));

create policy household_settings_all on household_settings
  for all using (is_household_member(household_id)) with check (is_household_member(household_id));

create index life_cards_household_idx on life_cards (household_id);
create index advisor_messages_household_idx on advisor_messages (household_id);
create index historical_snapshots_household_idx on historical_snapshots (household_id);

-- ---------------------------------------------------------------------------
-- Sanctuary: strictly self-only, no OURS variant. Enforced at the SQL level
-- per REVAMP §1.6 -- nothing scoped MINE ever renders in the partner's view.
-- ---------------------------------------------------------------------------

create table private_reserves (
  owner_user_id uuid primary key references household_members (id) on delete cascade,
  household_id uuid not null references households (id) on delete cascade,
  amount numeric not null default 0,
  updated_at timestamptz not null default now()
);

alter table private_reserves enable row level security;

create policy private_reserves_owner_only on private_reserves
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create index private_reserves_household_idx on private_reserves (household_id);

-- ---------------------------------------------------------------------------
-- AI usage: per-household rate limiting + counters for tier gating (Phase 4).
-- Written only by the ai-gateway edge function via the service role, which
-- bypasses RLS -- clients get read-only visibility into their own household.
-- ---------------------------------------------------------------------------

create table ai_usage (
  household_id uuid not null references households (id) on delete cascade,
  period_start date not null,
  message_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (household_id, period_start)
);

alter table ai_usage enable row level security;

create policy ai_usage_select on ai_usage
  for select using (is_household_member(household_id));

-- Deliberately no insert/update/delete policy for `authenticated`: only the
-- edge function (service role key, RLS-exempt) increments usage.

-- ---------------------------------------------------------------------------
-- Grants. RLS policies above restrict *rows*; Postgres still requires the
-- base table/function privilege before a policy is ever evaluated.
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated;

grant execute on function is_household_member(uuid) to authenticated;
grant execute on function current_household_id() to authenticated;
grant execute on function can_access_scoped_row(uuid, text, uuid) to authenticated;

grant select, update on households to authenticated;
grant select, update on household_members to authenticated;

grant select, insert, update, delete on
  pockets, transactions, liabilities, fortress_goals, claims, recurring_obligations,
  advisor_messages, life_cards, historical_snapshots, household_settings, private_reserves
  to authenticated;

grant select on ai_usage to authenticated;
