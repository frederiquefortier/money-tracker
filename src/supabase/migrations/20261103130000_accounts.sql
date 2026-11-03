-- Institutions and accounts (ACC-01..07, spec 11).

-- Account types (ACC-01, SET-06). Loaded from src/data/reference/account-types.csv.
create table public.account_types (
  code     text primary key check (code ~ '^[a-z_]+$'),
  label_fr text not null,
  label_en text not null
);

alter table public.account_types enable row level security;
revoke all on public.account_types from anon, authenticated;
grant select on public.account_types to authenticated;

create policy "account_types: read"
  on public.account_types for select to authenticated
  using (true);

create policy "account_types: mfa required"
  on public.account_types as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

insert into public.account_types (code, label_fr, label_en) values
  ('checking', 'Compte chèque', 'Checking'),
  ('savings', 'Compte épargne', 'Savings'),
  ('credit_card', 'Carte de crédit', 'Credit card'),
  ('prepaid', 'Carte prépayée', 'Prepaid card'),
  ('cash', 'Argent comptant', 'Cash');

-- Institutions (ACC-05). Names are unique per user, ignoring case.
create table public.institutions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  name        text not null check (length(trim(name)) between 1 and 100),
  website_url text check (website_url ~ '^https://[^\s]+$' and length(website_url) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, id)
);

create unique index institutions_user_name_key on public.institutions (user_id, lower(name));

create trigger institutions_set_updated_at
  before update on public.institutions
  for each row execute function public.set_updated_at();

alter table public.institutions enable row level security;
revoke all on public.institutions from anon, authenticated;
grant select, delete on public.institutions to authenticated;
grant insert (name, website_url), update (name, website_url) on public.institutions to authenticated;

create policy "institutions: read own"
  on public.institutions for select to authenticated
  using (user_id = (select auth.uid()));

create policy "institutions: insert own"
  on public.institutions for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "institutions: update own"
  on public.institutions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "institutions: delete own"
  on public.institutions for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "institutions: mfa required"
  on public.institutions as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- Accounts (ACC-01..04). The currency is one of the user's currencies; the composite
-- foreign keys carry user_id (ADR-005). (user_id, id, currency) is the target of the
-- transactions currency key (database.md, Money).
create table public.accounts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users on delete cascade,
  institution_id   uuid,
  name             text not null check (length(trim(name)) between 1 and 100),
  type             text not null references public.account_types,
  currency         char(3) not null,
  opening_balance  numeric(19,4) not null default 0,
  opened_on        date not null default current_date,
  closed_on        date check (closed_on >= opened_on),
  hidden_for_new   boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, id),
  unique (user_id, id, currency),
  foreign key (user_id, institution_id) references public.institutions (user_id, id),
  foreign key (user_id, currency) references public.user_currencies (user_id, code)
);

-- Unique among open accounts (spec 11): a closed "Chèque" frees the name.
create unique index accounts_user_open_name_key
  on public.accounts (user_id, lower(name)) where closed_on is null;
create index accounts_user_institution_idx on public.accounts (user_id, institution_id);
create index accounts_user_currency_idx on public.accounts (user_id, currency);
create index accounts_type_idx on public.accounts (type);

create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

alter table public.accounts enable row level security;
revoke all on public.accounts from anon, authenticated;
grant select, delete on public.accounts to authenticated;
grant insert (institution_id, name, type, currency, opening_balance, opened_on, closed_on, hidden_for_new),
      update (institution_id, name, type, currency, opening_balance, opened_on, closed_on, hidden_for_new)
  on public.accounts to authenticated;

create policy "accounts: read own"
  on public.accounts for select to authenticated
  using (user_id = (select auth.uid()));

create policy "accounts: insert own"
  on public.accounts for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "accounts: update own"
  on public.accounts for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "accounts: delete own"
  on public.accounts for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "accounts: mfa required"
  on public.accounts as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- An open account books in an active currency: a removed one cannot be chosen, and an
-- account in a removed currency cannot be reopened.
create function public.check_account_currency()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.closed_on is null and exists (
    select 1 from public.user_currencies uc
    where uc.user_id = new.user_id and uc.code = new.currency and uc.removed_at is not null
  ) then
    raise exception 'currency_removed' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.check_account_currency() from public, anon, authenticated;

create trigger accounts_check_currency
  before insert or update of currency, closed_on on public.accounts
  for each row execute function public.check_account_currency();

-- Removing a currency: the default and any currency an open account books in stay
-- (CUR-04). Replaces the function from the currencies migration.
create or replace function public.on_user_currency_removed()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.profiles p
    where p.user_id = new.user_id and p.default_currency = new.code
  ) then
    raise exception 'default_currency_cannot_be_removed' using errcode = '23514';
  end if;

  if exists (
    select 1 from public.accounts a
    where a.user_id = new.user_id and a.currency = new.code and a.closed_on is null
  ) then
    raise exception 'currency_used_by_open_account' using errcode = '23514';
  end if;

  update public.profiles p
  set display_currency = p.default_currency
  where p.user_id = new.user_id and p.display_currency = new.code;

  return new;
end;
$$;

-- Balances (ACC-06). The opening balance until transactions exist; the transactions
-- migration replaces this view with the opening balance plus their sum. display_balance
-- is in the profile's display currency at today's rate, null when a rate is missing
-- (ADR-004).
create view public.account_balances
with (security_invoker = true)
as
select
  a.id as account_id,
  a.currency,
  a.opening_balance as balance,
  0::numeric(19,4) as pending,
  p.display_currency,
  round(a.opening_balance * public.exchange_rate(a.currency, p.display_currency, current_date), 4)
    as display_balance
from public.accounts a
join public.profiles p on p.user_id = a.user_id;

-- Group totals in the display currency, open accounts only (ACC-06, CUR-09). A missing
-- rate makes the whole total null, never a partial sum.
create view public.institution_totals
with (security_invoker = true)
as
select
  a.institution_id,
  b.display_currency,
  case when bool_or(b.display_balance is null) then null else sum(b.display_balance) end
    as total,
  bool_or(a.currency <> b.display_currency) as converted
from public.accounts a
join public.account_balances b on b.account_id = a.id
where a.closed_on is null
group by a.institution_id, b.display_currency;

revoke all on public.account_balances, public.institution_totals from anon, authenticated;
grant select on public.account_balances, public.institution_totals to authenticated;
