-- The import (IMP-01, 04, 05, 06, ADR-033 to ADR-036): one call checks every row of the
-- fixed CSV format and, with no error, writes the lot; one call undoes it.

-- A batch is what one import created, so it can be undone (IMP-05).
create table public.import_batches (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users on delete cascade,
  file_names     text[] not null default '{}',
  row_count      integer not null default 0 check (row_count >= 0),
  -- What it created, by kind, and the opening balances it replaced, for the undo.
  created_counts jsonb not null default '{}',
  restored       jsonb not null default '[]',
  committed_at   timestamptz not null default now(),
  undone_at      timestamptz,
  unique (user_id, id)
);

alter table public.import_batches enable row level security;
revoke all on public.import_batches from anon, authenticated;
grant select on public.import_batches to authenticated;
grant insert (file_names, row_count, created_counts, restored),
      update (created_counts, restored, undone_at)
  on public.import_batches to authenticated;

create policy "import_batches: read own"
  on public.import_batches for select to authenticated
  using (user_id = (select auth.uid()));
create policy "import_batches: insert own"
  on public.import_batches for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "import_batches: update own"
  on public.import_batches for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "import_batches: mfa required"
  on public.import_batches as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- Each transaction keeps the `ref` it came with, unique per user, so a second import of the
-- same file skips it; and the batch, so the undo finds it.
alter table public.transactions
  add column import_ref text check (length(import_ref) between 1 and 200),
  add column import_batch_id uuid,
  add foreign key (user_id, import_batch_id) references public.import_batches (user_id, id)
    on delete set null (import_batch_id);
create unique index transactions_user_import_ref_key
  on public.transactions (user_id, import_ref) where import_ref is not null;
create index transactions_user_batch_idx
  on public.transactions (user_id, import_batch_id) where import_batch_id is not null;
grant insert (import_ref, import_batch_id), update (import_ref, import_batch_id)
  on public.transactions to authenticated;

-- Whatever an import creates carries its batch too.
alter table public.accounts add column import_batch_id uuid,
  add foreign key (user_id, import_batch_id) references public.import_batches (user_id, id)
    on delete set null (import_batch_id);
alter table public.institutions add column import_batch_id uuid,
  add foreign key (user_id, import_batch_id) references public.import_batches (user_id, id)
    on delete set null (import_batch_id);
alter table public.categories add column import_batch_id uuid,
  add foreign key (user_id, import_batch_id) references public.import_batches (user_id, id)
    on delete set null (import_batch_id);
alter table public.merchants add column import_batch_id uuid,
  add foreign key (user_id, import_batch_id) references public.import_batches (user_id, id)
    on delete set null (import_batch_id);
alter table public.people add column import_batch_id uuid,
  add foreign key (user_id, import_batch_id) references public.import_batches (user_id, id)
    on delete set null (import_batch_id);
alter table public.events add column import_batch_id uuid,
  add foreign key (user_id, import_batch_id) references public.import_batches (user_id, id)
    on delete set null (import_batch_id);
alter table public.merchant_aliases add column import_batch_id uuid,
  add foreign key (user_id, import_batch_id) references public.import_batches (user_id, id)
    on delete set null (import_batch_id);
alter table public.person_aliases add column import_batch_id uuid,
  add foreign key (user_id, import_batch_id) references public.import_batches (user_id, id)
    on delete set null (import_batch_id);
grant insert (import_batch_id)
  on public.accounts, public.institutions, public.categories, public.merchants, public.people, public.events,
     public.merchant_aliases, public.person_aliases
  to authenticated;

-- "Alimentation > Épicerie" as its parts, and as a key that ignores case and accents.
create function public.split_category_path(path text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(trim(t.p) order by t.n) filter (where trim(t.p) <> ''), '{}')
  from regexp_split_to_table(path, '>') with ordinality as t (p, n);
$$;

create function public.category_key(path text)
returns text
language sql
immutable
set search_path = ''
as $$
  select string_agg(public.fold_name(t.p), ' > ' order by t.n)
  from unnest(public.split_category_path(path)) with ordinality as t (p, n);
$$;

-- Every category with its full key, to find "Santé > Pharmacie" whatever its depth.
create function public.category_keys()
returns table (id uuid, kind text, color text, key text, depth integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive c as (
    select k.id, k.kind, k.color, public.fold_name(k.name) as key, 1 as depth
    from public.categories k where k.parent_id is null
    union all
    select k.id, k.kind, k.color, c.key || ' > ' || public.fold_name(k.name), c.depth + 1
    from public.categories k join c on k.parent_id = c.id
  )
  select c.id, c.kind, c.color, c.key, c.depth from c;
$$;

revoke execute on function public.split_category_path(text), public.category_key(text), public.category_keys()
  from public, anon;
grant execute on function public.split_category_path(text), public.category_key(text), public.category_keys()
  to authenticated;

-- plpgsql_check (supabase db lint) cannot see a temporary table made inside a function.
-- It takes this no-op, which it recognises by name, for its own pragma and so learns the
-- columns declared in `import_batch`. A schema of its own: the extension puts a function of
-- that name in public, where a stub would stop it installing.
create schema internal;
create function internal.plpgsql_check_pragma(variadic declarations text[])
returns integer
language sql
immutable
set search_path = ''
as 'select 1';
revoke all on schema internal from public, anon;
grant usage on schema internal to authenticated;
revoke execute on function internal.plpgsql_check_pragma(text[]) from public, anon;
grant execute on function internal.plpgsql_check_pragma(text[]) to authenticated;

-- The import. `payload` is {accounts, transactions, splits, people, aliases}, each an array of the
-- rows of the CSV file of that name, every value a string (amounts are never numbers, ADR-004)
-- and an optional `line` for the messages. Names already merged by the author (IMP-06) are
-- already renamed in the rows. Returns {ok: false, errors} and writes nothing when any row
-- is wrong; with dry_run, {ok: true, will_create, counts} and nothing is written either.
create function public.import_batch(payload jsonb, dry_run boolean default false)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_batch uuid;
  v_fee uuid;
  v_errors integer;
  v_max integer;
  v_first date;
  v_last date;
  v_counts jsonb;
  v_will jsonb;
  v_created jsonb;
  v_restored jsonb;
  v_row record;
  v_splits jsonb;
  v_people jsonb;
  v_owed uuid[];
  v_saved uuid;
  v_merchant uuid;
  v_t0 timestamptz := clock_timestamp();
  v_timings jsonb := '{}'::jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if jsonb_typeof(payload) is distinct from 'object' then
    raise exception 'import_payload_invalid' using errcode = '22023';
  end if;
  if jsonb_array_length(coalesce(payload -> 'transactions', '[]')) > 20000 then
    raise exception 'import_too_large' using errcode = '54000';
  end if;

  perform internal.plpgsql_check_pragma(
    'table: i_err (file text, line integer, code text, detail text)',
    'table: i_acc (line integer, name text, institution text, institution_url text, type text, currency text, opening_balance numeric, opened_on date, closed_on date)',
    'table: i_pool (pid integer, id uuid, name text, institution text, currency text, opened_on date, in_app boolean)',
    'table: i_tx (line integer, ref text, d date, account text, institution text, kind text, amount numeric, currency text, original_amount numeric, original_currency text, merchant text, mkey text, event text, status text, grp text, note text, pid integer, skip boolean)',
    'table: i_split (line integer, ref text, category text, key text, amount numeric, cid uuid)',
    'table: i_ppl (line integer, ref text, role text, person text, pkey text, head_count integer, amount numeric, reimburses text)',
    'table: i_v (line integer, ref text, d date, account text, institution text, kind text, amount numeric, currency text, original_amount numeric, original_currency text, merchant text, mkey text, event text, status text, grp text, note text, pid integer, skip boolean, acur text, aopened date, aminor integer, fee boolean, account_id uuid, peoplepath boolean)',
    'table: i_cp (id uuid, kind text, color text, key text, depth integer)',
    'table: i_pref (ref text, depth integer, name text, label text, key text, parent_key text, root_key text, is_income boolean)',
    'table: i_newcat (key text, label text, parent_key text, depth integer, name text, kind text)',
    'table: i_grp (grp text, tid uuid)',
    'table: i_mer (key text, id uuid)',
    'table: i_per (key text, id uuid)',
    'table: i_pk (key text, name text)',
    'table: i_cn (name text, key text)',
    'table: i_alias (line integer, kind text, name text, nkey text, alias text, akey text)');

  drop table if exists pg_temp.i_err, pg_temp.i_acc, pg_temp.i_pool, pg_temp.i_tx, pg_temp.i_split,
    pg_temp.i_ppl, pg_temp.i_v, pg_temp.i_cp, pg_temp.i_pref, pg_temp.i_newcat, pg_temp.i_grp,
    pg_temp.i_mer, pg_temp.i_per, pg_temp.i_pk, pg_temp.i_cn, pg_temp.i_alias;

  create temp table i_err (file text, line integer, code text, detail text) on commit drop;

  -- The rows, parsed once.
  create temp table i_acc on commit drop as
  select coalesce((e.a ->> 'line')::integer, e.n::integer + 1) as line,
         trim(e.a ->> 'name') as name,
         nullif(trim(e.a ->> 'institution'), '') as institution,
         nullif(trim(e.a ->> 'institution_url'), '') as institution_url,
         nullif(trim(e.a ->> 'type'), '') as type,
         upper(nullif(trim(e.a ->> 'currency'), '')) as currency,
         coalesce(nullif(trim(e.a ->> 'opening_balance'), '')::numeric, 0) as opening_balance,
         nullif(trim(e.a ->> 'opened_on'), '')::date as opened_on,
         nullif(trim(e.a ->> 'closed_on'), '')::date as closed_on
  from jsonb_array_elements(coalesce(payload -> 'accounts', '[]')) with ordinality as e (a, n);

  create temp table i_tx on commit drop as
  select coalesce((e.a ->> 'line')::integer, e.n::integer + 1) as line,
         trim(e.a ->> 'ref') as ref,
         nullif(trim(e.a ->> 'date'), '')::date as d,
         trim(e.a ->> 'account') as account,
         nullif(trim(e.a ->> 'institution'), '') as institution,
         trim(e.a ->> 'kind') as kind,
         nullif(trim(e.a ->> 'amount'), '')::numeric as amount,
         upper(trim(e.a ->> 'currency')) as currency,
         nullif(trim(e.a ->> 'original_amount'), '')::numeric as original_amount,
         upper(nullif(trim(e.a ->> 'original_currency'), '')) as original_currency,
         nullif(trim(e.a ->> 'merchant'), '') as merchant,
         public.fold_name(e.a ->> 'merchant') as mkey,
         nullif(trim(e.a ->> 'event'), '') as event,
         coalesce(nullif(trim(e.a ->> 'status'), ''), 'cleared') as status,
         nullif(trim(e.a ->> 'transfer_group'), '') as grp,
         nullif(trim(e.a ->> 'note'), '') as note,
         null::integer as pid,
         false as skip
  from jsonb_array_elements(coalesce(payload -> 'transactions', '[]')) with ordinality as e (a, n);

  create temp table i_split on commit drop as
  select coalesce((e.a ->> 'line')::integer, e.n::integer + 1) as line,
         trim(e.a ->> 'ref') as ref,
         nullif(trim(e.a ->> 'category'), '') as category,
         public.category_key(e.a ->> 'category') as key,
         nullif(trim(e.a ->> 'amount'), '')::numeric as amount,
         null::uuid as cid
  from jsonb_array_elements(coalesce(payload -> 'splits', '[]')) with ordinality as e (a, n);

  create temp table i_ppl on commit drop as
  select coalesce((e.a ->> 'line')::integer, e.n::integer + 1) as line,
         trim(e.a ->> 'ref') as ref,
         trim(e.a ->> 'role') as role,
         nullif(trim(e.a ->> 'person'), '') as person,
         public.fold_name(e.a ->> 'person') as pkey,
         coalesce(nullif(trim(e.a ->> 'head_count'), '')::integer, 1) as head_count,
         nullif(trim(e.a ->> 'amount'), '')::numeric as amount,
         nullif(trim(e.a ->> 'reimburses'), '') as reimburses
  from jsonb_array_elements(coalesce(payload -> 'people', '[]')) with ordinality as e (a, n);

  create index on i_tx (ref);
  create index on i_split (ref);
  create index on i_split (key);
  create index on i_ppl (ref);
  analyze i_tx;
  analyze i_split;
  analyze i_ppl;
  v_timings := v_timings || jsonb_build_object('parse', round(extract(epoch from clock_timestamp() - v_t0)::numeric, 2));
  v_t0 := clock_timestamp();

  create temp table i_alias on commit drop as
  select coalesce((e.a ->> 'line')::integer, e.n::integer + 1) as line,
         trim(e.a ->> 'kind') as kind,
         trim(e.a ->> 'name') as name,
         public.fold_name(e.a ->> 'name') as nkey,
         trim(e.a ->> 'alias') as alias,
         public.fold_name(e.a ->> 'alias') as akey
  from jsonb_array_elements(coalesce(payload -> 'aliases', '[]')) with ordinality as e (a, n);

  -- Merchant texts the author says are a person (the import screen's "this is a person").
  create temp table i_cn on commit drop as
  select trim(e.a ->> 'name') as name, public.fold_name(e.a ->> 'name') as key
  from jsonb_array_elements(coalesce(payload -> 'counterparties', '[]')) with ordinality as e (a, n)
  where nullif(trim(e.a ->> 'name'), '') is not null;

  -- A ref already imported is skipped, which makes a second run harmless (IMP-05).
  update i_tx t set skip = true
  where t.ref <> '' and exists (select 1 from public.transactions x where x.import_ref = t.ref);

  delete from i_split s where exists (select 1 from i_tx t where t.ref = s.ref and t.skip);
  delete from i_ppl p where exists (select 1 from i_tx t where t.ref = p.ref and t.skip);

  select p.transfer_fee_category_id into v_fee from public.profiles p where p.user_id = v_user;

  -- Accounts in the file.
  insert into i_err select 'accounts.csv', a.line, 'account_type_unknown', a.type from i_acc a
    where not exists (select 1 from public.account_types t where t.code = a.type);
  insert into i_err select 'accounts.csv', a.line, 'currency_unknown', a.currency from i_acc a
    where not exists (select 1 from public.currencies c where c.code = a.currency);
  insert into i_err select 'accounts.csv', a.line, 'date_required', 'opened_on' from i_acc a
    where a.opened_on is null;
  insert into i_err select 'accounts.csv', a.line, 'account_dates', a.name from i_acc a
    where a.closed_on < a.opened_on;
  insert into i_err select 'accounts.csv', a.line, 'url_invalid', a.institution_url from i_acc a
    where a.institution_url is not null and a.institution_url !~ '^https://';
  insert into i_err select 'accounts.csv', a.line, 'account_duplicate', a.name from i_acc a
    where (select count(*) from i_acc b where lower(b.name) = lower(a.name)
             and lower(coalesce(b.institution, '')) = lower(coalesce(a.institution, ''))) > 1;
  insert into i_err select 'accounts.csv', a.line, 'account_currency_differs', a.name from i_acc a
    join public.accounts x on lower(x.name) = lower(a.name) and x.currency <> a.currency
    left join public.institutions i on i.id = x.institution_id
    where lower(coalesce(i.name, '')) = lower(coalesce(a.institution, ''));

  -- Every account a row can name: the app's, and the file's that the app does not have.
  create temp table i_pool (pid serial, id uuid, name text, institution text, currency text,
                            opened_on date, in_app boolean) on commit drop;
  insert into i_pool (id, name, institution, currency, opened_on, in_app)
  select a.id, a.name, i.name, a.currency::text,
         coalesce((select f.opened_on from i_acc f
                   where lower(f.name) = lower(a.name)
                     and lower(coalesce(f.institution, '')) = lower(coalesce(i.name, ''))
                     and not exists (select 1 from public.transactions t where t.account_id = a.id)), a.opened_on),
         true
  from public.accounts a left join public.institutions i on i.id = a.institution_id;
  insert into i_pool (id, name, institution, currency, opened_on, in_app)
  select distinct on (lower(f.name), lower(coalesce(f.institution, '')))
         null, f.name, f.institution, f.currency, f.opened_on, false
  from i_acc f
  where not exists (select 1 from i_pool p
                    where lower(p.name) = lower(f.name)
                      and lower(coalesce(p.institution, '')) = lower(coalesce(f.institution, '')));

  -- Which account each transaction names (the institution only tells two of one name apart).
  update i_tx t set pid = m.pid
  from (
    select u.line, min(p.pid) as pid, count(*) as c
    from i_tx u
    join i_pool p on lower(p.name) = lower(u.account)
                 and (u.institution is null or lower(coalesce(p.institution, '')) = lower(u.institution))
    group by u.line
  ) m
  where m.line = t.line and m.c = 1;

  create temp table i_v on commit drop as
  select t.*, p.currency as acur, p.opened_on as aopened, c.minor_units as aminor,
         (t.kind = 'expense' and t.grp is not null) as fee,
         null::uuid as account_id, false as peoplepath
  from i_tx t
  left join i_pool p on p.pid = t.pid
  left join public.currencies c on c.code = p.currency
  where not t.skip;

  create index on i_v (ref);
  create index on i_v (grp);
  analyze i_v;

  -- Transactions.
  insert into i_err select 'transactions.csv', v.line, 'ref_required', '' from i_v v where v.ref is null or v.ref = '';
  insert into i_err select 'transactions.csv', v.line, 'ref_duplicate', v.ref from i_v v
    where v.ref in (select u.ref from i_tx u where u.ref <> '' group by u.ref having count(*) > 1);
  insert into i_err select 'transactions.csv', v.line, 'date_required', 'date' from i_v v where v.d is null;
  insert into i_err select 'transactions.csv', v.line, 'kind_invalid', v.kind from i_v v
    where v.kind not in ('expense', 'income', 'transfer', 'adjustment');
  insert into i_err select 'transactions.csv', v.line,
      case when exists (select 1 from i_pool p where lower(p.name) = lower(v.account)
                         and (v.institution is null or lower(coalesce(p.institution, '')) = lower(v.institution)))
           then 'account_ambiguous' else 'account_unknown' end, v.account
    from i_v v where v.pid is null;
  insert into i_err select 'transactions.csv', v.line, 'currency_mismatch', v.currency || ' / ' || v.acur from i_v v
    where v.pid is not null and v.currency is distinct from v.acur;
  insert into i_err select 'transactions.csv', v.line, 'amount_sign', v.amount::text from i_v v
    where v.amount is null or case v.kind
      when 'expense' then v.amount >= 0
      when 'income' then v.amount <= 0
      else v.amount = 0 end;
  insert into i_err select 'transactions.csv', v.line, 'amount_precision', v.amount::text from i_v v
    where v.amount is not null and v.aminor is not null and v.amount <> round(v.amount, v.aminor);
  insert into i_err select 'transactions.csv', v.line, 'before_account_opened', v.d::text from i_v v
    where v.d < v.aopened;
  insert into i_err select 'transactions.csv', v.line, 'status_invalid', v.status from i_v v
    where v.status not in ('cleared', 'pending');
  insert into i_err select 'transactions.csv', v.line, 'original_incomplete', '' from i_v v
    where (v.original_amount is null) <> (v.original_currency is null);
  insert into i_err select 'transactions.csv', v.line, 'original_kind', v.original_currency from i_v v
    where v.original_currency is not null and v.kind not in ('expense', 'income');
  insert into i_err select 'transactions.csv', v.line, 'original_same_currency', v.original_currency from i_v v
    where v.original_currency is not null and v.original_currency = v.acur;
  insert into i_err select 'transactions.csv', v.line, 'original_sign', v.original_amount::text from i_v v
    where v.original_amount is not null and sign(v.original_amount) <> sign(v.amount);
  insert into i_err select 'transactions.csv', v.line, 'currency_unknown', v.original_currency from i_v v
    where v.original_currency is not null
      and not exists (select 1 from public.currencies c where c.code = v.original_currency);
  insert into i_err select 'transactions.csv', v.line, 'amount_precision', v.original_amount::text from i_v v
    join public.currencies c on c.code = v.original_currency
    where v.original_amount <> round(v.original_amount, c.minor_units);
  insert into i_err select 'transactions.csv', v.line, 'merchant_kind', v.merchant from i_v v
    where v.merchant is not null and v.kind not in ('expense', 'income');
  insert into i_err select 'transactions.csv', v.line, 'event_kind', v.event from i_v v
    where v.event is not null and (v.kind not in ('expense', 'income') or v.fee);
  insert into i_err select 'transactions.csv', v.line, 'event_ambiguous', v.event
    from i_v v
    where v.event is not null
      and (select count(*) from public.events e where public.fold_name(e.name) = public.fold_name(v.event)) > 1;

  -- Transfers: two legs on two accounts, and at most one fee on the departure account.
  insert into i_err select 'transactions.csv', v.line, 'transfer_group_missing', '' from i_v v
    where v.kind = 'transfer' and v.grp is null;
  insert into i_err select 'transactions.csv', v.line, 'transfer_group_kind', v.grp from i_v v
    where v.grp is not null and v.kind not in ('transfer', 'expense');
  insert into i_err
    select 'transactions.csv', min(v.line), 'transfer_incomplete', v.grp
    from i_v v where v.grp is not null
    group by v.grp
    having count(*) filter (where v.kind = 'transfer' and v.amount < 0) <> 1
        or count(*) filter (where v.kind = 'transfer' and v.amount > 0) <> 1
        or count(*) filter (where v.kind = 'expense') > 1
        or count(*) filter (where v.kind not in ('transfer', 'expense')) > 0;
  insert into i_err select 'transactions.csv', o.line, 'transfer_same_account', o.grp
    from i_v o join i_v i on i.grp = o.grp and i.kind = 'transfer' and i.amount > 0
    where o.kind = 'transfer' and o.amount < 0 and o.pid is not null and o.pid = i.pid;
  insert into i_err select 'transactions.csv', o.line, 'transfer_amounts_differ', o.grp
    from i_v o join i_v i on i.grp = o.grp and i.kind = 'transfer' and i.amount > 0
    where o.kind = 'transfer' and o.amount < 0 and o.currency = i.currency and i.amount <> -o.amount;
  insert into i_err select 'transactions.csv', f.line, 'transfer_fee_account', f.grp
    from i_v f join i_v o on o.grp = f.grp and o.kind = 'transfer' and o.amount < 0
    where f.fee and f.pid is distinct from o.pid;
  insert into i_err select 'transactions.csv', f.line, 'fee_category_missing', f.grp
    from i_v f where f.fee and v_fee is null;

  -- Splits.
  create temp table i_cp on commit drop as select * from public.category_keys();
  update i_split s set cid = (
    select k.id from i_cp k
    where k.key = s.key
    order by (k.kind = case when v.kind = 'income' then 'income' else 'expense' end) desc, k.kind
    limit 1)
  from i_v v where v.ref = s.ref and s.category is not null;

  insert into i_err select 'splits.csv', s.line, 'split_ref_unknown', s.ref from i_split s
    where not exists (select 1 from i_tx t where t.ref = s.ref)
       or false;
  insert into i_err select 'splits.csv', s.line, 'split_kind', s.ref from i_split s
    join i_v v on v.ref = s.ref where v.kind in ('transfer', 'adjustment') or v.fee;
  insert into i_err select 'splits.csv', s.line, 'category_required', s.ref from i_split s
    join i_v v on v.ref = s.ref where s.category is null or cardinality(public.split_category_path(s.category)) = 0;
  insert into i_err select 'splits.csv', s.line, 'split_sign', s.amount::text from i_split s
    join i_v v on v.ref = s.ref
    where s.amount is null or sign(s.amount) <> sign(v.amount);
  insert into i_err select 'splits.csv', s.line, 'amount_precision', s.amount::text from i_split s
    join i_v v on v.ref = s.ref
    where s.amount is not null and v.aminor is not null and s.amount <> round(s.amount, v.aminor);
  insert into i_err select 'splits.csv', s.line, 'split_duplicate_category', s.category from i_split s
    join i_v v on v.ref = s.ref
    where s.category is not null and (select count(*) from i_split u
           where u.ref = s.ref and u.key = s.key) > 1;
  -- An archived category is valid up to and including the day it was archived (ADR-035).
  insert into i_err select 'splits.csv', s.line, 'category_archived', s.category from i_split s
    join i_v v on v.ref = s.ref
    where s.cid is not null and not exists (
      select 1 from public.category_active_periods p
      where p.category_id = s.cid
        and (p.active_from is null or v.d >= p.active_from)
        and (p.active_to is null or v.d <= p.active_to));
  insert into i_err select 'transactions.csv', v.line, 'category_missing', v.ref from i_v v
    where v.kind in ('expense', 'income') and not v.fee
      and not exists (select 1 from i_split s where s.ref = v.ref);
  insert into i_err select 'transactions.csv', v.line, 'split_sum_mismatch', v.ref from i_v v
    where v.kind in ('expense', 'income') and not v.fee
      and exists (select 1 from i_split s where s.ref = v.ref)
      and (select sum(s.amount) from i_split s where s.ref = v.ref) is distinct from v.amount;

  -- People.
  insert into i_err select 'people.csv', p.line, 'people_ref_unknown', p.ref from i_ppl p
    where not exists (select 1 from i_tx t where t.ref = p.ref);
  insert into i_err select 'people.csv', p.line, 'people_kind', p.ref from i_ppl p
    join i_v v on v.ref = p.ref where v.kind not in ('expense', 'income') or v.fee;
  insert into i_err select 'people.csv', p.line, 'role_invalid', p.role from i_ppl p
    join i_v v on v.ref = p.ref where p.role not in ('me', 'invited', 'owes', 'from');
  insert into i_err select 'people.csv', p.line, 'role_kind', p.role from i_ppl p
    join i_v v on v.ref = p.ref
    where p.role in ('me', 'invited', 'owes', 'from')
      and case v.kind when 'expense' then p.role = 'from' when 'income' then p.role <> 'from' else false end;
  insert into i_err select 'people.csv', p.line, 'people_me_twice', p.ref from i_ppl p
    where p.role = 'me' and (select count(*) from i_ppl u where u.ref = p.ref and u.role = 'me') > 1;
  insert into i_err select 'people.csv', p.line, 'people_income_one', p.ref from i_ppl p
    join i_v v on v.ref = p.ref
    where v.kind = 'income' and (select count(*) from i_ppl u where u.ref = p.ref) > 1;
  insert into i_err select 'people.csv', p.line, 'person_twice', p.person from i_ppl p
    where p.person is not null and (select count(*) from i_ppl u
           where u.ref = p.ref and public.fold_name(u.person) = public.fold_name(p.person)) > 1;
  insert into i_err select 'people.csv', p.line, 'head_count_invalid', p.head_count::text from i_ppl p
    where p.head_count < 1 or (p.head_count > 1 and p.person is not null) or (p.role = 'me' and p.person is not null);
  insert into i_err select 'people.csv', p.line, 'people_amount_unsupported', p.amount::text from i_ppl p
    join i_v v on v.ref = p.ref
    where p.amount is not null and v.kind = 'expense';
  insert into i_err select 'people.csv', p.line, 'people_sum_mismatch', p.amount::text from i_ppl p
    join i_v v on v.ref = p.ref
    where p.amount is not null and v.kind = 'income' and p.amount <> v.amount;
  insert into i_err select 'people.csv', p.line, 'reimburses_role', p.reimburses from i_ppl p
    where p.reimburses is not null and p.role <> 'from';
  insert into i_err select 'people.csv', p.line, 'reimburses_unknown', p.reimburses from i_ppl p
    where p.reimburses is not null and p.role = 'from'
      and not exists (
        select 1 from i_ppl o join i_v e on e.ref = o.ref
        where o.ref = p.reimburses and o.role = 'owes' and e.kind = 'expense'
          and public.fold_name(o.person) = public.fold_name(p.person))
      and not exists (
        select 1 from public.transactions e
        join public.transaction_people l on l.transaction_id = e.id and l.role = 'owes'
        join public.people q on q.id = l.person_id
        where e.import_ref = p.reimburses and public.fold_name(q.name) = public.fold_name(p.person));

  -- Aliases: another spelling of a merchant or a person, from the file or from a merge.
  insert into i_err select 'aliases.csv', a.line, 'alias_kind_invalid', a.kind from i_alias a
    where a.kind not in ('merchant', 'person');
  insert into i_err select 'aliases.csv', a.line, 'alias_same', a.alias from i_alias a
    where a.akey = a.nkey;
  insert into i_err select 'aliases.csv', a.line, 'alias_duplicate', a.alias from i_alias a
    where a.akey in (select u.akey from i_alias u group by u.akey having count(distinct u.kind || ':' || u.nkey) > 1);
  insert into i_err select 'aliases.csv', a.line, 'alias_target_unknown', a.name from i_alias a
    where a.kind = 'merchant'
      and not exists (select 1 from public.merchants m where public.fold_name(m.name) = a.nkey)
      and not exists (select 1 from public.merchant_aliases x where public.fold_name(x.alias) = a.nkey)
      and not exists (select 1 from i_v v where v.mkey = a.nkey);
  insert into i_err select 'aliases.csv', a.line, 'alias_target_unknown', a.name from i_alias a
    where a.kind = 'person'
      and not exists (select 1 from public.people q where public.fold_name(q.name) = a.nkey)
      and not exists (select 1 from public.person_aliases x where public.fold_name(x.alias) = a.nkey)
      and not exists (select 1 from i_ppl p join i_v v on v.ref = p.ref where p.pkey = a.nkey);
  -- Taken: another merchant's name or alias, or a name the rows themselves use.
  insert into i_err select 'aliases.csv', a.line, 'alias_taken', a.alias from i_alias a
    where a.kind = 'merchant' and (
      exists (select 1 from public.merchants m where public.fold_name(m.name) = a.akey)
      or exists (select 1 from public.merchant_aliases x join public.merchants m on m.id = x.merchant_id
                 where public.fold_name(x.alias) = a.akey and public.fold_name(m.name) <> a.nkey)
      or exists (select 1 from i_v v where v.mkey = a.akey));
  insert into i_err select 'aliases.csv', a.line, 'alias_taken', a.alias from i_alias a
    where a.kind = 'person' and (
      exists (select 1 from public.people q where public.fold_name(q.name) = a.akey)
      or exists (select 1 from public.person_aliases x join public.people q on q.id = x.person_id
                 where public.fold_name(x.alias) = a.akey and public.fold_name(q.name) <> a.nkey)
      or exists (select 1 from i_ppl p join i_v v on v.ref = p.ref where p.pkey = a.akey));

  -- Categories the file names that the app does not have are created, parents first. A new
  -- top-level category is an income one when every split under it is an income.
  create temp table i_pref on commit drop as
  select s.ref, k.k as depth, p.parts[k.k] as name,
         (select string_agg(e, ' > ' order by n) from unnest(p.parts[1:k.k]) with ordinality as u (e, n)) as label,
         (select string_agg(public.fold_name(e), ' > ' order by n) from unnest(p.parts[1:k.k]) with ordinality as u (e, n)) as key,
         case when k.k > 1 then (select string_agg(public.fold_name(e), ' > ' order by n)
                                 from unnest(p.parts[1:k.k - 1]) with ordinality as u (e, n)) end as parent_key,
         public.fold_name(p.parts[1]) as root_key,
         (v.kind = 'income') as is_income
  from i_split s
  join i_v v on v.ref = s.ref and v.kind in ('expense', 'income') and not v.fee
  cross join lateral (select public.split_category_path(s.category) as parts) p
  cross join lateral generate_series(1, coalesce(array_length(p.parts, 1), 0)) as k (k)
  where s.category is not null;

  create temp table i_newcat on commit drop as
  select distinct on (x.key) x.key, x.label, x.parent_key, x.depth, x.name,
         coalesce((select c.kind from i_cp c where c.key = x.root_key limit 1),
                  case when (select bool_and(q.is_income) from i_pref q where q.root_key = x.root_key)
                       then 'income' else 'expense' end) as kind
  from i_pref x
  where not exists (select 1 from i_cp c where c.key = x.key)
  order by x.key, x.name;

  -- A merchant text that is a person's name or alias (existing, or given by the people and
  -- aliases files) is the person: the merchant is theirs (merchants.person_id), "I bought
  -- something from Maman".
  create temp table i_pk on commit drop as
  select distinct on (x.key) x.key, x.name from (
    select public.fold_name(q.name) as key, q.name from public.people q
    union all
    select public.fold_name(a.alias), q.name from public.person_aliases a join public.people q on q.id = a.person_id
    union all
    select p.pkey, p.person from i_ppl p join i_v v on v.ref = p.ref where p.person is not null
    union all
    select a.akey, a.name from i_alias a where a.kind = 'person'
    union all
    select c.key, c.name from i_cn c where exists (select 1 from i_v v where v.mkey = c.key)) x
  order by x.key, x.name;

  -- People, merchants, events, institutions and currencies to create.
  create temp table i_grp on commit drop as
  select g.grp, gen_random_uuid() as tid from (select distinct v.grp from i_v v where v.grp is not null) g;

  select count(*) into v_errors from i_err;
  v_timings := v_timings || jsonb_build_object('checks', round(extract(epoch from clock_timestamp() - v_t0)::numeric, 2));
  v_t0 := clock_timestamp();

  v_counts := jsonb_build_object(
    'transactions', (select count(*) from i_v),
    'skipped', (select count(*) from i_tx where skip),
    'splits', (select count(*) from i_split s join i_v v on v.ref = s.ref),
    'people_lines', (select count(*) from i_ppl p join i_v v on v.ref = p.ref),
    'transfers', (select count(*) from i_grp),
    'reimbursements', (select count(*) from i_ppl p join i_v v on v.ref = p.ref where p.reimburses is not null),
    'aliases', (select count(*) from i_alias));

  v_will := jsonb_build_object(
    'currencies', (select coalesce(jsonb_agg(c.code order by c.code), '[]') from (
        select a.currency as code from i_acc a union select v.original_currency from i_v v where v.original_currency is not null
      ) c where c.code is not null
        and not exists (select 1 from public.user_currencies u where u.code = c.code and u.removed_at is null)),
    'institutions', (select coalesce(jsonb_agg(n order by n), '[]') from (
        select distinct on (lower(a.institution)) a.institution as n from i_acc a
        where a.institution is not null
          and not exists (select 1 from public.institutions i where lower(i.name) = lower(a.institution))) x),
    'accounts', (select coalesce(jsonb_agg(jsonb_build_object('name', p.name, 'institution', p.institution) order by p.name), '[]')
        from i_pool p where not p.in_app),
    'account_changes', (select coalesce(jsonb_agg(jsonb_build_object('name', a.name, 'institution', f.institution,
          'opening_balance', f.opening_balance, 'opened_on', f.opened_on) order by a.name), '[]')
        from i_acc f
        join public.accounts a on lower(a.name) = lower(f.name)
        left join public.institutions i on i.id = a.institution_id
        where lower(coalesce(i.name, '')) = lower(coalesce(f.institution, ''))
          and not exists (select 1 from public.transactions t where t.account_id = a.id)
          and (a.opening_balance <> f.opening_balance or a.opened_on <> f.opened_on)),
    'categories', (select coalesce(jsonb_agg(c.label order by c.key), '[]') from i_newcat c),
    'merchants', (select coalesce(jsonb_agg(n order by n), '[]') from (
        select distinct on (public.fold_name(v.merchant)) v.merchant as n from i_v v
        where v.merchant is not null
          and not exists (select 1 from public.merchants m where public.fold_name(m.name) = public.fold_name(v.merchant))
          and not exists (select 1 from public.merchant_aliases a where public.fold_name(a.alias) = public.fold_name(v.merchant))
          and not exists (select 1 from i_pk k where k.key = v.mkey)) x),
    'counterparties', (select coalesce(jsonb_agg(n order by n), '[]') from (
        select distinct on (public.fold_name(k.name)) k.name as n from i_v v join i_pk k on k.key = v.mkey
        where not exists (select 1 from public.merchants m where public.fold_name(m.name) = v.mkey)
          and not exists (select 1 from public.merchant_aliases a where public.fold_name(a.alias) = v.mkey)) x),
    'people', (select coalesce(jsonb_agg(n order by n), '[]') from (
        select distinct on (public.fold_name(p.person)) p.person as n from (
          select p.person from i_ppl p join i_v v on v.ref = p.ref where p.person is not null
          union all
          select c.name from i_cn c where exists (select 1 from i_v v where v.mkey = c.key)
            and not exists (select 1 from i_alias a where a.kind = 'person' and a.akey = c.key)) p
        where not exists (select 1 from public.people q where public.fold_name(q.name) = public.fold_name(p.person))
          and not exists (select 1 from public.person_aliases a where public.fold_name(a.alias) = public.fold_name(p.person))) x),
    'events', (select coalesce(jsonb_agg(n order by n), '[]') from (
        select distinct on (public.fold_name(v.event)) v.event as n from i_v v
        where v.event is not null
          and not exists (select 1 from public.events e where public.fold_name(e.name) = public.fold_name(v.event))) x));

  if v_errors > 0 then
    return jsonb_build_object('ok', false, 'timings', v_timings, 'error_count', v_errors, 'errors', (
      select coalesce(jsonb_agg(jsonb_build_object('file', e.file, 'line', e.line, 'code', e.code, 'detail', e.detail)), '[]')
      from (select * from i_err order by file, line, code limit 200) e));
  end if;
  if dry_run then
    return jsonb_build_object('ok', true, 'dry_run', true, 'timings', v_timings, 'will_create', v_will, 'counts', v_counts);
  end if;

  if (v_counts ->> 'transactions')::integer = 0 and v_will -> 'accounts' = '[]' and v_will -> 'account_changes' = '[]'
     and not exists (select 1 from i_alias a
                     where not exists (select 1 from public.merchant_aliases x where a.kind = 'merchant' and public.fold_name(x.alias) = a.akey)
                       and not exists (select 1 from public.person_aliases x where a.kind = 'person' and public.fold_name(x.alias) = a.akey)) then
    return jsonb_build_object('ok', true, 'nothing_to_import', true, 'counts', v_counts);
  end if;

  -- Writing starts here: all or nothing, in the caller's transaction.
  insert into public.import_batches (file_names, row_count)
  values (coalesce(array(select jsonb_array_elements_text(coalesce(payload -> 'files', '[]'))), '{}'),
          (select count(*) from i_v) + (select count(*) from i_split) + (select count(*) from i_ppl) + (select count(*) from i_acc))
  returning id into v_batch;

  -- Currencies the list does not have yet.
  insert into public.user_currencies (code)
  select c.code from (
    select a.currency as code from i_acc a union select v.original_currency from i_v v where v.original_currency is not null
  ) c
  where c.code is not null
    and not exists (select 1 from public.user_currencies u where u.code = c.code);
  update public.user_currencies u set removed_at = null
  where u.removed_at is not null
    and u.code in (select a.currency from i_acc a union select v.original_currency from i_v v where v.original_currency is not null);

  -- Institutions and accounts.
  insert into public.institutions (name, website_url, import_batch_id)
  select distinct on (lower(a.institution)) a.institution, a.institution_url, v_batch from i_acc a
  where a.institution is not null
    and not exists (select 1 from public.institutions i where lower(i.name) = lower(a.institution));

  insert into public.accounts (institution_id, name, type, currency, opening_balance, opened_on, closed_on, import_batch_id)
  select (select i.id from public.institutions i where lower(i.name) = lower(p.institution)),
         f.name, f.type, f.currency, f.opening_balance, f.opened_on, f.closed_on, v_batch
  from i_pool p
  join i_acc f on lower(f.name) = lower(p.name) and lower(coalesce(f.institution, '')) = lower(coalesce(p.institution, ''))
  where not p.in_app;

  -- An account with no transactions yet takes the file's opening balance and date (ADR-034).
  select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'opening_balance', a.opening_balance, 'opened_on', a.opened_on)), '[]')
  into v_restored
  from public.accounts a
  join i_acc f on lower(f.name) = lower(a.name)
  left join public.institutions i on i.id = a.institution_id
  where lower(coalesce(i.name, '')) = lower(coalesce(f.institution, ''))
    and a.import_batch_id is distinct from v_batch
    and not exists (select 1 from public.transactions t where t.account_id = a.id)
    and (a.opening_balance <> f.opening_balance or a.opened_on <> f.opened_on);
  update public.accounts a set opening_balance = f.opening_balance, opened_on = f.opened_on
  from i_acc f
  left join public.institutions i on lower(i.name) = lower(f.institution)
  where lower(a.name) = lower(f.name)
    and a.institution_id is not distinct from i.id
    and a.import_batch_id is distinct from v_batch
    and not exists (select 1 from public.transactions t where t.account_id = a.id);
  update i_v v set account_id = a.id
  from public.accounts a left join public.institutions i on i.id = a.institution_id
  where lower(a.name) = lower(v.account)
    and (v.institution is null or lower(coalesce(i.name, '')) = lower(v.institution));

  -- Categories, one depth at a time so a parent exists before its children.
  select coalesce(max(depth), 0) into v_max from i_newcat;
  for v_n in 1..v_max loop
    insert into public.categories (parent_id, name, kind, color, color_is_auto, icon_is_auto, import_batch_id)
    select par.id, n.name, n.kind, coalesce(par.color, '#6b7280'), true, true, v_batch
    from i_newcat n
    left join public.category_keys() par on par.key = n.parent_key
    where n.depth = v_n
      and not exists (select 1 from public.category_keys() x where x.key = n.key);
  end loop;
  update i_split s set cid = (
    select k.id from public.category_keys() k
    where k.key = s.key
    order by (k.kind = case when v.kind = 'income' then 'income' else 'expense' end) desc, k.kind
    limit 1)
  from i_v v where v.ref = s.ref and s.category is not null and s.cid is null;

  -- Merchants and people.
  insert into public.merchants (name, import_batch_id)
  select distinct on (public.fold_name(v.merchant)) v.merchant, v_batch from i_v v
  where v.merchant is not null
    and not exists (select 1 from public.merchants m where public.fold_name(m.name) = public.fold_name(v.merchant))
    and not exists (select 1 from public.merchant_aliases a where public.fold_name(a.alias) = public.fold_name(v.merchant))
    and not exists (select 1 from i_pk k where k.key = v.mkey);
  insert into public.people (name, import_batch_id)
  select distinct on (public.fold_name(p.person)) p.person, v_batch from (
    select p.person from i_ppl p join i_v v on v.ref = p.ref where p.person is not null
    union all
    select c.name from i_cn c where exists (select 1 from i_v v where v.mkey = c.key)
            and not exists (select 1 from i_alias a where a.kind = 'person' and a.akey = c.key)) p
  where not exists (select 1 from public.people q where public.fold_name(q.name) = public.fold_name(p.person))
    and not exists (select 1 from public.person_aliases a where public.fold_name(a.alias) = public.fold_name(p.person));

  create temp table i_per on commit drop as
  select public.fold_name(q.name) as key, q.id from public.people q
  union all
  select public.fold_name(a.alias), a.person_id from public.person_aliases a;
  create index on i_per (key);

  -- The other spellings of a person, so a merchant text that is one finds its person.
  insert into public.person_aliases (person_id, alias, import_batch_id)
  select distinct on (a.akey) (select p.id from i_per p where p.key = a.nkey limit 1), a.alias, v_batch
  from i_alias a
  where a.kind = 'person'
    and not exists (select 1 from public.person_aliases x where public.fold_name(x.alias) = a.akey);
  truncate i_per;
  insert into i_per
  select public.fold_name(q.name), q.id from public.people q
  union all
  select public.fold_name(a.alias), a.person_id from public.person_aliases a;

  -- A person who is a merchant: a merchant named for them, theirs.
  insert into public.merchants (name, person_id, import_batch_id)
  select distinct on (p.id) q.name, p.id, v_batch
  from i_v v
  join i_pk k on k.key = v.mkey
  join i_per p on p.key = public.fold_name(k.name)
  join public.people q on q.id = p.id
  where not exists (select 1 from public.merchants m where public.fold_name(m.name) = v.mkey or m.person_id = p.id
                                                          or public.fold_name(m.name) = public.fold_name(q.name))
    and not exists (select 1 from public.merchant_aliases x where public.fold_name(x.alias) = v.mkey
                                                              or public.fold_name(x.alias) = public.fold_name(q.name));

  create temp table i_mer on commit drop as
  select public.fold_name(m.name) as key, m.id from public.merchants m
  union all
  select public.fold_name(a.alias), a.merchant_id from public.merchant_aliases a
  union all
  select k.key, m.id from i_pk k
  join i_per p on p.key = public.fold_name(k.name)
  join public.merchants m on m.person_id = p.id
  where not exists (select 1 from public.merchants x where public.fold_name(x.name) = k.key)
    and not exists (select 1 from public.merchant_aliases x where public.fold_name(x.alias) = k.key);
  create index on i_mer (key);

  -- The other spellings, now that what they point to exists. One already stored is kept.
  insert into public.merchant_aliases (merchant_id, alias, import_batch_id)
  select distinct on (a.akey) (select m.id from i_mer m where m.key = a.nkey limit 1), a.alias, v_batch
  from i_alias a
  where a.kind = 'merchant'
    and not exists (select 1 from public.merchant_aliases x where public.fold_name(x.alias) = a.akey);

  -- Transactions without people, in bulk: expenses, incomes, transfer legs, fees, adjustments.
  -- An expense shared only with guests ("invited") has nothing to wait for: its parts are
  -- written below in bulk, as save_transaction would. The others (an owed part, an income
  -- from someone) go through it, for the reimbursements.
  update i_v v set peoplepath = true
  where not v.fee and v.kind in ('expense', 'income') and exists (select 1 from i_ppl p where p.ref = v.ref)
    and not (v.kind = 'expense' and not exists (select 1 from i_ppl p where p.ref = v.ref and p.role <> 'invited'));

  insert into public.transactions (account_id, kind, occurred_on, amount, currency, original_amount, original_currency,
                                   status, merchant_id, note, transfer_id, import_ref, import_batch_id)
  select v.account_id, v.kind, v.d, v.amount, v.acur, v.original_amount, v.original_currency, v.status,
         mm.id, v.note, g.tid, v.ref, v_batch
  from i_v v left join i_grp g on g.grp = v.grp left join i_mer mm on mm.key = v.mkey
  where not v.peoplepath;

  insert into public.transaction_splits (transaction_id, category_id, input_mode, input_value, amount)
  select t.id, s.cid, 'amount', abs(s.amount), s.amount
  from i_split s
  join i_v v on v.ref = s.ref and not v.peoplepath
  join public.transactions t on t.import_ref = s.ref;

  -- The parts of those expenses, Moi first and the last line taking the rounding, like
  -- save_transaction (Parts mode: Moi 1, a guest its head count).
  insert into public.transaction_people (transaction_id, position, role, person_id, head_count, input_mode,
                                         input_value, amount, fills_rest)
  select l.tid, l.pos, l.role, l.person_id, l.head_count, 'share', l.w,
         case when l.pos = l.n then l.total - (sum(l.base) over (partition by l.tid) - l.base) else l.base end,
         true
  from (
    select x.*, count(*) over (partition by x.tid) as n,
           round(x.total * x.w / sum(x.w) over (partition by x.tid), x.minor) as base
    from (
      select t.id as tid, 1 as pos, 'me' as role, null::uuid as person_id, 1 as head_count, 1::numeric as w,
             t.amount as total, c.minor_units as minor
      from i_v v
      join public.transactions t on t.import_ref = v.ref
      join public.currencies c on c.code = t.currency
      where v.kind = 'expense' and not v.fee and not v.peoplepath and exists (select 1 from i_ppl p where p.ref = v.ref)
      union all
      select t.id, 1 + row_number() over (partition by p.ref order by p.line), 'invited',
             (select q.id from i_per q where q.key = p.pkey limit 1), p.head_count, p.head_count::numeric,
             t.amount, c.minor_units
      from i_ppl p
      join i_v v on v.ref = p.ref and v.kind = 'expense' and not v.fee and not v.peoplepath
      join public.transactions t on t.import_ref = v.ref
      join public.currencies c on c.code = t.currency
    ) x
  ) l;
  insert into public.transaction_splits (transaction_id, category_id, input_mode, input_value, amount)
  select t.id, v_fee, 'amount', abs(v.amount), v.amount
  from i_v v join public.transactions t on t.import_ref = v.ref
  where v.fee;

  v_timings := v_timings || jsonb_build_object('reference_data_and_bulk_rows', round(extract(epoch from clock_timestamp() - v_t0)::numeric, 2));
  v_t0 := clock_timestamp();

  -- Transactions with people go through save_transaction, so the parts and the reimbursements
  -- follow the app's own rules: the expenses first, then the incomes that repay them.
  for v_row in
    select v.* from i_v v where v.peoplepath order by (v.kind = 'income'), v.d, v.line
  loop
    select jsonb_agg(jsonb_build_object('category_id', s.cid, 'input_mode', 'amount', 'input_value', abs(s.amount)) order by s.line)
    into v_splits from i_split s where s.ref = v_row.ref;
    select m.id into v_merchant from i_mer m where m.key = v_row.mkey limit 1;
    v_owed := null;
    if v_row.kind = 'expense' then
      -- Moi first, then the others; a part left empty takes what is left (Parts), an owed
      -- part is set by its reimbursement.
      select jsonb_build_array(jsonb_build_object('role', 'me', 'person_id', null, 'head_count', 1, 'input_mode', 'share',
                                                  'input_value', 1, 'amount_unknown', false, 'fills_rest', true))
             || coalesce(jsonb_agg(jsonb_build_object(
                  'role', p.role,
                  'person_id', (select x.id from i_per x where x.key = p.pkey limit 1),
                  'head_count', p.head_count, 'input_mode', 'share',
                  'input_value', case when p.role = 'owes' then 0 else p.head_count end,
                  'amount_unknown', p.role = 'owes', 'fills_rest', p.role <> 'owes') order by p.line), '[]')
      into v_people from i_ppl p where p.ref = v_row.ref and p.role <> 'me';
    else
      select jsonb_build_array(jsonb_build_object(
               'role', 'from',
               'person_id', (select x.id from i_per x where x.key = p.pkey limit 1),
               'head_count', p.head_count, 'input_mode', 'amount', 'input_value', abs(v_row.amount),
               'amount_unknown', false, 'fills_rest', false)),
             (select array_agg(l.id) from public.transaction_people l
              join public.transactions e on e.id = l.transaction_id and e.import_ref = p.reimburses
              where l.role = 'owes' and l.person_id is not distinct from
                    (select x.id from i_per x where x.key = p.pkey limit 1))
      into v_people, v_owed
      from i_ppl p where p.ref = v_row.ref and p.role = 'from' limit 1;
    end if;

    begin
      v_saved := public.save_transaction(
        transaction_id => null, account_id => v_row.account_id, kind => v_row.kind, occurred_on => v_row.d,
        amount => abs(v_row.amount), splits => v_splits,
        original_amount => abs(v_row.original_amount), original_currency => v_row.original_currency,
        status => v_row.status, merchant_id => v_merchant, note => v_row.note,
        people => v_people, reimburses => v_owed, event_id => null, event_choice => 'auto');
    exception when others then
      -- Says which row, so the author can find it; the ref is theirs, no amount or name.
      raise exception '% (transactions.csv, ref %)', sqlerrm, v_row.ref using errcode = sqlstate;
    end;
    update public.transactions t set import_ref = v_row.ref, import_batch_id = v_batch where t.id = v_saved;
  end loop;

  v_timings := v_timings || jsonb_build_object('people_rows', round(extract(epoch from clock_timestamp() - v_t0)::numeric, 2));
  v_t0 := clock_timestamp();

  -- Events that already exist link what falls in their dates, as everywhere in the app.
  select min(v.d), max(v.d) into v_first, v_last from i_v v where v.kind in ('expense', 'income');
  if v_first is not null then
    perform public.relink_events(v_first, v_last);
  end if;

  -- Events the file names, created by name with no dates (an event with none links nothing
  -- by itself), and the rows linked by hand so no date rule can take them back.
  insert into public.events (name, import_batch_id)
  select x.name, v_batch
  from (
    select (array_agg(v.event order by v.d, v.line))[1] as name
    from i_v v where v.event is not null
    group by public.fold_name(v.event)
  ) x
  where not exists (select 1 from public.events e where public.fold_name(e.name) = public.fold_name(x.name));
  update public.transactions t set event_id = e.id, event_source = 'manual'
  from i_v v
  join public.events e on public.fold_name(e.name) = public.fold_name(v.event)
  where v.event is not null and t.import_ref = v.ref;

  v_created := jsonb_build_object(
    'transactions', (select count(*) from public.transactions t where t.import_batch_id = v_batch),
    'currencies', jsonb_array_length(v_will -> 'currencies'),
    'institutions', (select count(*) from public.institutions i where i.import_batch_id = v_batch),
    'accounts', (select count(*) from public.accounts a where a.import_batch_id = v_batch),
    'categories', (select count(*) from public.categories c where c.import_batch_id = v_batch),
    'merchants', (select count(*) from public.merchants m where m.import_batch_id = v_batch),
    'people', (select count(*) from public.people p where p.import_batch_id = v_batch),
    'aliases', (select count(*) from public.merchant_aliases a where a.import_batch_id = v_batch)
             + (select count(*) from public.person_aliases a where a.import_batch_id = v_batch),
    'events', (select count(*) from public.events e where e.import_batch_id = v_batch));
  update public.import_batches b set created_counts = v_created, restored = v_restored where b.id = v_batch;

  v_timings := v_timings || jsonb_build_object('events', round(extract(epoch from clock_timestamp() - v_t0)::numeric, 2));
  return jsonb_build_object('ok', true, 'batch_id', v_batch, 'timings', v_timings, 'created', v_created, 'counts', v_counts);
end;
$$;

revoke execute on function public.import_batch(jsonb, boolean) from public, anon;
grant execute on function public.import_batch(jsonb, boolean) to authenticated;

-- Undo (IMP-05): the batch's transactions go, then what it created that nothing else uses,
-- and the opening balances it replaced come back.
create function public.import_undo(batch uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  b public.import_batches%rowtype;
  removed jsonb;
  n_tx integer;
  n_events integer;
  n_merchants integer;
  n_people integer;
  n_categories integer := 0;
  n_step integer;
  n_accounts integer;
  n_institutions integer;
  n_aliases integer;
begin
  select * into b from public.import_batches x where x.id = import_undo.batch and x.undone_at is null;
  if not found then
    raise exception 'import_not_found' using errcode = 'P0002';
  end if;

  delete from public.transactions t where t.import_batch_id = b.id;
  get diagnostics n_tx = row_count;

  -- The spellings it taught go with it; a person or merchant it created takes theirs along.
  delete from public.merchant_aliases a where a.import_batch_id = b.id;
  get diagnostics n_aliases = row_count;
  delete from public.person_aliases a where a.import_batch_id = b.id;

  delete from public.events e where e.import_batch_id = b.id
    and not exists (select 1 from public.transactions t where t.event_id = e.id);
  get diagnostics n_events = row_count;
  delete from public.merchants m where m.import_batch_id = b.id
    and not exists (select 1 from public.transactions t where t.merchant_id = m.id);
  get diagnostics n_merchants = row_count;
  delete from public.people p where p.import_batch_id = b.id
    and not exists (select 1 from public.transaction_people x where x.person_id = p.id);
  get diagnostics n_people = row_count;

  loop
    delete from public.categories c where c.import_batch_id = b.id
      and not exists (select 1 from public.transaction_splits s where s.category_id = c.id)
      and not exists (select 1 from public.categories ch where ch.parent_id = c.id)
      and not exists (select 1 from public.merchants m where m.default_category_id = c.id);
    get diagnostics n_step = row_count;
    exit when n_step = 0;
    n_categories := n_categories + n_step;
  end loop;

  delete from public.accounts a where a.import_batch_id = b.id
    and not exists (select 1 from public.transactions t where t.account_id = a.id);
  get diagnostics n_accounts = row_count;
  delete from public.institutions i where i.import_batch_id = b.id
    and not exists (select 1 from public.accounts a where a.institution_id = i.id);
  get diagnostics n_institutions = row_count;

  update public.accounts a set opening_balance = r.opening_balance, opened_on = r.opened_on
  from jsonb_to_recordset(b.restored) as r (id uuid, opening_balance numeric, opened_on date)
  where a.id = r.id;

  removed := jsonb_build_object('transactions', n_tx, 'events', n_events, 'merchants', n_merchants,
    'people', n_people, 'categories', n_categories, 'accounts', n_accounts, 'institutions', n_institutions,
    'aliases', n_aliases);
  update public.import_batches x set undone_at = now() where x.id = b.id;
  return jsonb_build_object('ok', true, 'removed', removed);
end;
$$;

revoke execute on function public.import_undo(uuid) from public, anon;
grant execute on function public.import_undo(uuid) to authenticated;
