-- Holdings, their dated values, the employer and government money, and the holding a
-- contribution pays into (NW-01, 02, 03, 05, spec 19, ADR-045). A holding is an investment,
-- an asset or a debt; bank accounts count through their balance. My own contributions are
-- the transactions pointing at the holding, so they are never entered twice.

-- Holding types (NW-01, SET-06, LOC-02). Loaded from src/data/reference/holding-types.csv.
-- country is empty for a type that exists anywhere.
create table public.holding_types (
  code     text primary key check (code ~ '^[A-Z0-9_]+$'),
  kind     text not null check (kind in ('investment', 'asset', 'debt')),
  country  char(2) check (country ~ '^[A-Z]{2}$'),
  label_fr text not null,
  label_en text not null
);

alter table public.holding_types enable row level security;
revoke all on public.holding_types from anon, authenticated;
grant select on public.holding_types to authenticated;

create policy "holding_types: read"
  on public.holding_types for select to authenticated
  using (true);

create policy "holding_types: mfa required"
  on public.holding_types as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

insert into public.holding_types (code, kind, country, label_fr, label_en) values
  ('CA_TFSA', 'investment', 'CA', 'CELI', 'TFSA'),
  ('CA_RRSP', 'investment', 'CA', 'REER', 'RRSP'),
  ('CA_DPSP', 'investment', 'CA', 'RPDB', 'DPSP'),
  ('CA_FHSA', 'investment', 'CA', 'CELIAPP', 'FHSA'),
  ('CA_RESP', 'investment', 'CA', 'REEE', 'RESP'),
  ('CA_NONREG', 'investment', 'CA', 'Compte non enregistré', 'Non-registered'),
  ('CH_PILLAR2', 'investment', 'CH', '2e pilier (LPP)', '2nd pillar (BVG/LPP)'),
  ('CH_PILLAR3A', 'investment', 'CH', '3e pilier A', 'Pillar 3a'),
  ('CH_PILLAR3B', 'investment', 'CH', '3e pilier B', 'Pillar 3b'),
  ('CH_VESTED', 'investment', 'CH', 'Compte de libre passage', 'Vested benefits account'),
  ('ANY_BROKERAGE', 'investment', null, 'Compte de courtage', 'Brokerage'),
  ('ANY_LIFE_INSURANCE', 'asset', null, 'Assurance-vie (valeur de rachat)', 'Life insurance (buyout value)'),
  ('ANY_PROPERTY', 'asset', null, 'Immobilier', 'Real estate'),
  ('ANY_LOAN', 'debt', null, 'Prêt', 'Loan'),
  ('ANY_STUDENT_LOAN', 'debt', null, 'Prêt étudiant', 'Student loan'),
  ('ANY_MORTGAGE', 'debt', null, 'Hypothèque', 'Mortgage'),
  ('ANY_CREDIT_LINE', 'debt', null, 'Marge de crédit', 'Line of credit');

-- Holdings. Every value is in the holding's currency, one of the user's currencies. An
-- open holding has a unique name, ignoring case and accents; a closed one frees it.
create table public.holdings (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null default auth.uid() references auth.users on delete cascade,
  type                    text not null references public.holding_types,
  institution_id          uuid,
  name                    text not null check (length(trim(name)) between 1 and 100),
  country                 char(2) check (country ~ '^[A-Z]{2}$'),
  currency                char(3) not null,
  opened_on               date not null default current_date,
  closed_on               date check (closed_on >= opened_on),
  exclude_from_net_worth  boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (user_id, id),
  foreign key (user_id, institution_id) references public.institutions (user_id, id),
  foreign key (user_id, currency) references public.user_currencies (user_id, code)
);

create unique index holdings_user_open_name_key
  on public.holdings (user_id, public.fold_name(name)) where closed_on is null;
create index holdings_user_institution_idx
  on public.holdings (user_id, institution_id) where institution_id is not null;
create index holdings_user_currency_idx on public.holdings (user_id, currency);
create index holdings_type_idx on public.holdings (type);

-- One value per holding per date, in the holding's currency. A debt's value is positive.
create table public.holding_snapshots (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  holding_id  uuid not null,
  on_date     date not null,
  amount      numeric(19,4) not null check (amount >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, id),
  unique (user_id, holding_id, on_date),
  foreign key (user_id, holding_id) references public.holdings (user_id, id) on delete cascade
);

-- Money that did not leave one of my accounts: an employer, a government grant.
create table public.holding_contributions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  holding_id  uuid not null,
  on_date     date not null,
  amount      numeric(19,4) not null check (amount > 0),
  label       text check (length(trim(label)) between 1 and 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, id),
  foreign key (user_id, holding_id) references public.holdings (user_id, id) on delete cascade
);

create index holding_contributions_user_holding_idx
  on public.holding_contributions (user_id, holding_id, on_date);

create trigger holdings_set_updated_at
  before update on public.holdings
  for each row execute function public.set_updated_at();
create trigger holding_snapshots_set_updated_at
  before update on public.holding_snapshots
  for each row execute function public.set_updated_at();
create trigger holding_contributions_set_updated_at
  before update on public.holding_contributions
  for each row execute function public.set_updated_at();

alter table public.holdings enable row level security;
alter table public.holding_snapshots enable row level security;
alter table public.holding_contributions enable row level security;

revoke all on public.holdings, public.holding_snapshots, public.holding_contributions
  from anon, authenticated;
grant select, delete on public.holdings, public.holding_snapshots, public.holding_contributions
  to authenticated;
grant insert (type, institution_id, name, country, currency, opened_on, closed_on, exclude_from_net_worth),
      update (type, institution_id, name, country, currency, opened_on, closed_on, exclude_from_net_worth)
  on public.holdings to authenticated;
grant insert (holding_id, on_date, amount), update (holding_id, on_date, amount)
  on public.holding_snapshots to authenticated;
grant insert (holding_id, on_date, amount, label), update (holding_id, on_date, amount, label)
  on public.holding_contributions to authenticated;

create policy "holdings: read own"
  on public.holdings for select to authenticated using (user_id = (select auth.uid()));
create policy "holdings: insert own"
  on public.holdings for insert to authenticated with check (user_id = (select auth.uid()));
create policy "holdings: update own"
  on public.holdings for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "holdings: delete own"
  on public.holdings for delete to authenticated using (user_id = (select auth.uid()));
create policy "holdings: mfa required"
  on public.holdings as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

create policy "holding_snapshots: read own"
  on public.holding_snapshots for select to authenticated using (user_id = (select auth.uid()));
create policy "holding_snapshots: insert own"
  on public.holding_snapshots for insert to authenticated with check (user_id = (select auth.uid()));
create policy "holding_snapshots: update own"
  on public.holding_snapshots for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "holding_snapshots: delete own"
  on public.holding_snapshots for delete to authenticated using (user_id = (select auth.uid()));
create policy "holding_snapshots: mfa required"
  on public.holding_snapshots as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

create policy "holding_contributions: read own"
  on public.holding_contributions for select to authenticated using (user_id = (select auth.uid()));
create policy "holding_contributions: insert own"
  on public.holding_contributions for insert to authenticated with check (user_id = (select auth.uid()));
create policy "holding_contributions: update own"
  on public.holding_contributions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "holding_contributions: delete own"
  on public.holding_contributions for delete to authenticated using (user_id = (select auth.uid()));
create policy "holding_contributions: mfa required"
  on public.holding_contributions as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- A value or an employer contribution is no finer than the holding's currency and not after
-- the day the holding closed.
create function public.check_holding_entry()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  h record;
begin
  select x.currency, x.closed_on into h
  from public.holdings x
  where x.user_id = new.user_id and x.id = new.holding_id;

  if exists (
    select 1 from public.currencies c
    where c.code = h.currency and new.amount <> round(new.amount, c.minor_units)
  ) then
    raise exception 'amount_precision' using errcode = '23514';
  end if;
  if h.closed_on is not null and new.on_date > h.closed_on then
    raise exception 'holding_closed' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.check_holding_entry() from public, anon, authenticated;

create trigger holding_snapshots_check_entry
  before insert or update of holding_id, on_date, amount on public.holding_snapshots
  for each row execute function public.check_holding_entry();
create trigger holding_contributions_check_entry
  before insert or update of holding_id, on_date, amount on public.holding_contributions
  for each row execute function public.check_holding_entry();

-- The currency is fixed once the holding has anything in it, and a closing date cannot
-- come before the last thing recorded on the holding. An open holding cannot book in a
-- currency removed from the user's list.
create function public.check_holding()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  last_entry date;
begin
  if tg_op = 'UPDATE' then
    if new.currency <> old.currency and (
      exists (select 1 from public.holding_snapshots s where s.holding_id = new.id)
      or exists (select 1 from public.holding_contributions c where c.holding_id = new.id)
      or exists (select 1 from public.transactions t where t.holding_id = new.id)
    ) then
      raise exception 'holding_currency_locked' using errcode = '23514';
    end if;
  end if;

  if new.closed_on is not null then
    select max(d) into last_entry from (
      select max(s.on_date) as d from public.holding_snapshots s where s.holding_id = new.id
      union all
      select max(c.on_date) from public.holding_contributions c where c.holding_id = new.id
      union all
      select max(t.occurred_on) from public.transactions t where t.holding_id = new.id
    ) x;
    if last_entry > new.closed_on then
      raise exception 'holding_closed_before_entry' using errcode = '23514';
    end if;
  else
    if exists (
      select 1 from public.user_currencies uc
      where uc.user_id = new.user_id and uc.code = new.currency and uc.removed_at is not null
    ) then
      raise exception 'currency_removed' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.check_holding() from public, anon, authenticated;

create trigger holdings_check
  before insert or update of currency, closed_on on public.holdings
  for each row execute function public.check_holding();

-- Removing a currency also waits for the open holdings that book in it. Replaces the
-- function from the accounts migration.
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

  if exists (
    select 1 from public.holdings h
    where h.user_id = new.user_id and h.currency = new.code and h.closed_on is null
  ) then
    raise exception 'currency_used_by_open_holding' using errcode = '23514';
  end if;

  update public.profiles p
  set display_currency = p.default_currency
  where p.user_id = new.user_id and p.display_currency = new.code;

  return new;
end;
$$;

-- A contribution pays into a holding (ADR-045). Only an expense or an income takes one, and
-- only when every one of its categories is an investment: a contribution is an expense, a
-- withdrawal an income. The holding must not be closed on the transaction's date. Deleting
-- a holding that has transactions is refused.
alter table public.transactions
  add column holding_id uuid,
  add constraint transactions_holding_kind_check
    check (holding_id is null or kind in ('expense', 'income')),
  add constraint transactions_holding_fk foreign key (user_id, holding_id)
    references public.holdings (user_id, id) on delete restrict;

create index transactions_user_holding_idx
  on public.transactions (user_id, holding_id) where holding_id is not null;

grant insert (holding_id), update (holding_id) on public.transactions to authenticated;

create function public.check_transaction_holding(transaction uuid)
returns void
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  t record;
begin
  select x.holding_id, x.occurred_on into t
  from public.transactions x where x.id = transaction;
  if not found or t.holding_id is null then
    return;
  end if;

  if exists (
    select 1
    from public.transaction_splits s
    join public.categories c on c.user_id = s.user_id and c.id = s.category_id
    where s.transaction_id = transaction and c.kind <> 'investment'
  ) then
    raise exception 'holding_needs_investment_category' using errcode = '23514';
  end if;

  if exists (
    select 1 from public.holdings h
    where h.id = t.holding_id and h.closed_on < t.occurred_on
  ) then
    raise exception 'holding_closed' using errcode = '23514';
  end if;
end;
$$;

revoke execute on function public.check_transaction_holding(uuid) from public, anon, authenticated;

create function public.on_transaction_holding_changed()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_table_name = 'transactions' then
    perform public.check_transaction_holding(new.id);
  elsif tg_op <> 'DELETE' then
    perform public.check_transaction_holding(new.transaction_id);
  end if;
  return null;
end;
$$;

revoke execute on function public.on_transaction_holding_changed() from public, anon, authenticated;

create constraint trigger transactions_check_holding
  after insert or update of holding_id, kind, occurred_on on public.transactions
  deferrable initially deferred
  for each row execute function public.on_transaction_holding_changed();
create constraint trigger transaction_splits_check_holding
  after insert or update of category_id on public.transaction_splits
  deferrable initially deferred
  for each row execute function public.on_transaction_holding_changed();

-- A category that holds contributions stays an investment.
create function public.check_category_holdings()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.kind <> 'investment' and exists (
    select 1
    from public.transaction_splits s
    join public.transactions t on t.user_id = s.user_id and t.id = s.transaction_id
    where s.category_id = new.id and t.holding_id is not null
  ) then
    raise exception 'category_has_holding_transactions' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.check_category_holdings() from public, anon, authenticated;

create trigger categories_check_holdings
  before update of kind on public.categories
  for each row execute function public.check_category_holdings();

-- What each holding has received and what it is worth (NW-03). Placed is the linked
-- expenses minus the linked incomes (withdrawals), each converted to the holding's currency
-- at its own date, plus the employer and government money. Profit is the latest value minus
-- placed; the percent needs placed above zero. Any of them is null, never zero or partial,
-- when a rate is missing or there is no value yet (ADR-004).
create view public.holding_totals
with (security_invoker = true)
as
with moves as (
  select h.user_id, h.id as holding_id,
         -t.amount * public.exchange_rate(t.currency, h.currency, t.occurred_on) as amount
  from public.holdings h
  join public.transactions t on t.user_id = h.user_id and t.holding_id = h.id
  union all
  select c.user_id, c.holding_id, c.amount
  from public.holding_contributions c
),
placed as (
  select m.user_id, m.holding_id,
         case when bool_or(m.amount is null) then null else round(sum(m.amount), 4) end as amount
  from moves m
  group by m.user_id, m.holding_id
),
latest as (
  select distinct on (s.user_id, s.holding_id) s.user_id, s.holding_id, s.on_date, s.amount
  from public.holding_snapshots s
  order by s.user_id, s.holding_id, s.on_date desc
)
select
  h.id as holding_id,
  h.currency,
  case when p.holding_id is null then 0::numeric(19,4) else p.amount::numeric(19,4) end as placed,
  l.on_date as latest_on,
  l.amount as latest_value,
  case when l.amount is null or (p.holding_id is not null and p.amount is null) then null
       else (l.amount - coalesce(p.amount, 0))::numeric(19,4) end as profit,
  case when l.amount is null or p.amount is null or p.amount <= 0 then null
       else round((l.amount - p.amount) / p.amount * 100, 4) end as profit_percent,
  pr.display_currency,
  round(l.amount * public.exchange_rate(h.currency, pr.display_currency, current_date), 4)
    as display_value
from public.holdings h
join public.profiles pr on pr.user_id = h.user_id
left join placed p on p.user_id = h.user_id and p.holding_id = h.id
left join latest l on l.user_id = h.user_id and l.holding_id = h.id;

grant select on public.holding_totals to authenticated;

-- save_transaction takes the holding as its last argument.
drop function public.save_transaction(uuid, uuid, text, date, numeric, jsonb, numeric, text, text, uuid, text, jsonb, uuid[], uuid, text, uuid);

create or replace function public.save_transaction(
  transaction_id uuid,
  account_id uuid,
  kind text,
  occurred_on date,
  amount numeric,
  splits jsonb,
  original_amount numeric default null,
  original_currency text default null,
  status text default 'cleared',
  merchant_id uuid default null,
  note text default null,
  people jsonb default '[]',
  reimburses uuid[] default null,
  event_id uuid default null,
  event_choice text default 'auto',
  seller_id uuid default null,
  holding_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved uuid := save_transaction.transaction_id;
  account_currency char(3);
  minor integer;
  direction integer := case save_transaction.kind when 'expense' then -1 else 1 end;
  total numeric;
  lines integer;
  modes integer;
  mode text;
  weight numeric;
  positive boolean;
  line record;
  share numeric;
  done numeric := 0;
  people_lines integer;
  money_lines jsonb;
  with_lines jsonb;
  people_modes integer;
  people_mode text;
  people_weight numeric;
  kept jsonb;
  affected uuid[];
  owed record;
  left_over numeric;
  take numeric;
  expense uuid;
  matched uuid;
begin
  if save_transaction.kind is null or save_transaction.kind not in ('expense', 'income') then
    raise exception 'transaction_kind_invalid' using errcode = '23514';
  end if;
  if save_transaction.seller_id is not null and save_transaction.kind <> 'expense' then
    raise exception 'seller_kind_invalid' using errcode = '23514';
  end if;

  select a.currency, c.minor_units into account_currency, minor
  from public.accounts a
  join public.currencies c on c.code = a.currency
  where a.id = save_transaction.account_id;
  if not found then
    raise exception 'account_not_found' using errcode = 'P0002';
  end if;

  perform public.check_money_amount(save_transaction.amount, account_currency);
  total := direction * save_transaction.amount;
  if save_transaction.original_currency is not null then
    perform public.check_money_amount(save_transaction.original_amount, save_transaction.original_currency);
  end if;

  if jsonb_typeof(save_transaction.splits) is distinct from 'array'
     or jsonb_array_length(save_transaction.splits) = 0 then
    raise exception 'transaction_needs_category' using errcode = '23514';
  end if;

  select count(*), count(distinct s ->> 'input_mode'), min(s ->> 'input_mode'),
         sum((s ->> 'input_value')::numeric), bool_and((s ->> 'input_value')::numeric > 0)
  into lines, modes, mode, weight, positive
  from jsonb_array_elements(save_transaction.splits) s;

  if modes <> 1 or mode not in ('amount', 'share', 'percent') then
    raise exception 'splits_mixed_modes' using errcode = '23514';
  end if;
  if not positive then
    raise exception 'amount_not_positive' using errcode = '23514';
  end if;
  if mode = 'amount' and weight <> save_transaction.amount
     or mode = 'percent' and weight <> 100 then
    raise exception 'splits_sum_mismatch' using errcode = '23514';
  end if;

  if saved is null then
    insert into public.transactions (account_id, kind, occurred_on, amount, currency,
                                     original_amount, original_currency, status, merchant_id, note,
                                     seller_person_id, holding_id)
    values (save_transaction.account_id, save_transaction.kind, save_transaction.occurred_on, total, account_currency,
            direction * save_transaction.original_amount, save_transaction.original_currency,
            save_transaction.status, save_transaction.merchant_id,
            nullif(trim(save_transaction.note), ''), save_transaction.seller_id,
            save_transaction.holding_id)
    returning id into saved;
  else
    update public.transactions t set
      account_id = save_transaction.account_id,
      kind = save_transaction.kind,
      occurred_on = save_transaction.occurred_on,
      amount = total,
      currency = account_currency,
      original_amount = direction * save_transaction.original_amount,
      original_currency = save_transaction.original_currency,
      status = save_transaction.status,
      merchant_id = save_transaction.merchant_id,
      note = nullif(trim(save_transaction.note), ''),
      seller_person_id = save_transaction.seller_id,
      holding_id = save_transaction.holding_id
    where t.id = saved and t.kind in ('expense', 'income') and t.transfer_id is null;
    if not found then
      raise exception 'transaction_not_found' using errcode = 'P0002';
    end if;
    delete from public.transaction_splits s where s.transaction_id = saved;
    -- The reimbursements of its owed lines outlive the lines (spec 21): kept by person,
    -- or by position for a line without a name, and put back below.
    select jsonb_agg(jsonb_build_object('person_id', p.person_id, 'position', p.position,
                                        'income_id', r.income_id, 'amount', r.amount))
    into kept
    from public.reimbursements r
    join public.transaction_people p on p.id = r.owed_line_id
    where p.transaction_id = saved;
    delete from public.transaction_people p where p.transaction_id = saved;
  end if;

  for line in
    select (e.s ->> 'category_id')::uuid as category_id, (e.s ->> 'input_value')::numeric as input_value, e.n
    from jsonb_array_elements(save_transaction.splits) with ordinality as e (s, n)
    order by e.n
  loop
    if mode = 'amount' then
      perform public.check_money_amount(line.input_value, account_currency);
    end if;
    share := case
      when line.n = lines then total - done
      when mode = 'amount' then direction * line.input_value
      else round(total * line.input_value / weight, minor)
    end;
    insert into public.transaction_splits (transaction_id, category_id, input_mode, input_value, amount)
    values (saved, line.category_id, mode, line.input_value, share);
    done := done + share;
  end loop;

  -- The people's parts (PPL-03, 04, spec 20), computed like the splits: Moi first on an
  -- expense, the last line taking the rounding. The constraint trigger checks the roles
  -- and the sum at commit.
  -- The people with me have no part: they are set aside, then written after the others. A
  -- line of mine is implied when only they are given.
  money_lines := coalesce((select jsonb_agg(e.p order by e.n)
                           from jsonb_array_elements(save_transaction.people) with ordinality as e (p, n)
                           where e.p ->> 'role' <> 'with'), '[]');
  with_lines := coalesce((select jsonb_agg(e.p order by e.n)
                          from jsonb_array_elements(save_transaction.people) with ordinality as e (p, n)
                          where e.p ->> 'role' = 'with'), '[]');
  if jsonb_array_length(money_lines) = 0 and jsonb_array_length(with_lines) > 0 then
    money_lines := jsonb_build_array(jsonb_build_object(
      'role', 'me', 'head_count', 1, 'input_mode', 'share', 'input_value', 1,
      'amount_unknown', false, 'fills_rest', false));
  end if;
  people_lines := jsonb_array_length(money_lines);
  if people_lines > 0 then
    select count(distinct p ->> 'input_mode'), min(p ->> 'input_mode'), sum((p ->> 'input_value')::numeric)
    into people_modes, people_mode, people_weight
    from jsonb_array_elements(money_lines) p;
    if people_modes <> 1 or people_mode not in ('amount', 'share', 'percent') then
      raise exception 'people_mixed_modes' using errcode = '23514';
    end if;
    if people_weight is null or people_weight <= 0
       or people_mode = 'amount' and people_weight <> save_transaction.amount
       or people_mode = 'percent' and people_weight <> 100 then
      raise exception 'people_sum_mismatch' using errcode = '23514';
    end if;

    done := 0;
    for line in
      select e.p ->> 'role' as role, (e.p ->> 'person_id')::uuid as person_id,
             coalesce((e.p ->> 'head_count')::integer, 1) as head_count,
             coalesce((e.p ->> 'amount_unknown')::boolean, false) as unknown,
             coalesce((e.p ->> 'fills_rest')::boolean, false) as fills_rest,
             (e.p ->> 'input_value')::numeric as input_value, e.n
      from jsonb_array_elements(money_lines) with ordinality as e (p, n)
      order by e.n
    loop
      -- A part not known yet waits for its reimbursement (spec 21); recomputed below.
      if line.unknown then
        insert into public.transaction_people
          (transaction_id, position, role, person_id, head_count, input_mode, input_value, amount, amount_unknown)
        values (saved, line.n, line.role, line.person_id, line.head_count, people_mode, 0, null, true);
        continue;
      end if;
      -- Moi can be zero, when I paid entirely for others.
      if people_mode = 'amount' and line.input_value <> 0 then
        perform public.check_money_amount(line.input_value, account_currency);
      end if;
      share := case
        when line.n = people_lines then total - done
        when people_mode = 'amount' then direction * line.input_value
        else round(total * line.input_value / people_weight, minor)
      end;
      insert into public.transaction_people
        (transaction_id, position, role, person_id, head_count, input_mode, input_value, amount, fills_rest)
      values (saved, line.n, line.role, line.person_id, line.head_count, people_mode, line.input_value, share,
              line.fills_rest);
      done := done + share;
    end loop;

    insert into public.transaction_people
      (transaction_id, position, role, person_id, head_count, input_mode, input_value, amount)
    select saved, people_lines + w.n, 'with', (w.p ->> 'person_id')::uuid, 1, people_mode, 0, 0
    from jsonb_array_elements(with_lines) with ordinality as w (p, n);
  end if;


  -- Back on the lines they paid back, never more than a known part.
  insert into public.reimbursements (owed_line_id, income_id, amount)
  select p.id, (k ->> 'income_id')::uuid,
         least((k ->> 'amount')::numeric, coalesce(abs(p.amount), (k ->> 'amount')::numeric))
  from jsonb_array_elements(coalesce(kept, '[]')) k
  join public.transaction_people p
    on p.transaction_id = saved and p.role = 'owes'
   and case when k ->> 'person_id' is not null
            then p.person_id = (k ->> 'person_id')::uuid
            else p.person_id is null and p.position = (k ->> 'position')::integer end
  where coalesce(abs(p.amount), 1) > 0;
  perform public.recompute_people(saved);

  -- An income pays back the owed lines given, in order (spec 21): each takes what it is
  -- still owed, a line not known yet takes all that is left, and what is over is a gift.
  if save_transaction.kind = 'expense' then
    delete from public.reimbursements r where r.income_id = saved;
  elsif save_transaction.reimburses is not null then
    select array_agg(distinct p.transaction_id) into affected
    from public.reimbursements r
    join public.transaction_people p on p.id = r.owed_line_id
    where r.income_id = saved;
    delete from public.reimbursements r where r.income_id = saved;
    left_over := total;
    foreach expense in array save_transaction.reimburses loop
      select p.id, p.transaction_id, p.amount, p.amount_unknown,
             coalesce((select sum(x.amount) from public.reimbursements x where x.owed_line_id = p.id), 0) as back
      into owed
      from public.transaction_people p
      where p.id = expense and p.role = 'owes';
      if not found then
        raise exception 'owed_line_not_found' using errcode = 'P0002';
      end if;
      -- A part not known yet takes what is left of the income, but never more than the
      -- lines that absorb it can give up (empty_part_room).
      take := case when owed.amount_unknown
                   then least(left_over, public.empty_part_room(owed.transaction_id) - (
                          select coalesce(sum(x.amount), 0) from public.reimbursements x
                          join public.transaction_people q on q.id = x.owed_line_id
                          where q.transaction_id = owed.transaction_id and q.amount_unknown))
                   else least(left_over, abs(owed.amount) - owed.back) end;
      if take > 0 then
        insert into public.reimbursements (owed_line_id, income_id, amount)
        values (owed.id, saved, take);
        left_over := left_over - take;
      end if;
      affected := array_append(affected, owed.transaction_id);
    end loop;
    foreach expense in array coalesce(affected, '{}') loop
      perform public.recompute_people(expense);
    end loop;
  end if;

  -- The event (EVT-03, 07, spec 22). manual: the one chosen; none: cleared by hand, which
  -- remembers the event the rule would give; auto: whatever the rule gives.
  if save_transaction.event_choice = 'manual' and save_transaction.event_id is not null then
    update public.transactions t set event_id = save_transaction.event_id, event_source = 'manual'
    where t.id = saved;
    delete from public.event_exclusions x
    where x.event_id = save_transaction.event_id and x.transaction_id = saved;
  elsif save_transaction.event_choice = 'none' then
    matched := public.matching_event(save_transaction.occurred_on, save_transaction.kind, saved, true);
    if matched is not null then
      insert into public.event_exclusions (event_id, transaction_id) values (matched, saved)
      on conflict do nothing;
    end if;
    update public.transactions t set event_id = null, event_source = null where t.id = saved;
  else
    matched := public.matching_event(save_transaction.occurred_on, save_transaction.kind, saved);
    update public.transactions t
    set event_id = matched, event_source = case when matched is null then null else 'auto' end
    where t.id = saved;
  end if;

  return saved;
end;
$$;

revoke execute on function public.save_transaction(uuid, uuid, text, date, numeric, jsonb, numeric, text, text, uuid, text, jsonb, uuid[], uuid, text, uuid, uuid) from public, anon;
grant execute on function public.save_transaction(uuid, uuid, text, date, numeric, jsonb, numeric, text, text, uuid, text, jsonb, uuid[], uuid, text, uuid, uuid) to authenticated;
