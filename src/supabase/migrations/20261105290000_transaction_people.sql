-- People on a transaction (PPL-03, 04, spec 20): who an expense was shared with, or who an
-- income came from, and each one's part. A group is never a line, only its members, so
-- each person's part stays their own (decided 2026-11-05).

create table public.transaction_people (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users on delete cascade,
  transaction_id uuid not null,
  position       smallint not null check (position >= 1),
  -- me: my own part of an expense; invited: I paid for them; owes: they will pay me back;
  -- from: an income came from them.
  role           text not null check (role in ('me', 'invited', 'owes', 'from')),
  -- Null for Moi and for a line without a name, which counts its people.
  person_id      uuid,
  head_count     integer not null default 1 check (head_count >= 1),
  input_mode     text not null check (input_mode in ('amount', 'share', 'percent')),
  input_value    numeric(19,4) not null check (input_value >= 0),
  amount         numeric(19,4) not null,
  created_at     timestamptz not null default now(),
  unique (user_id, id),
  unique (transaction_id, position),
  unique (transaction_id, person_id),
  check (role <> 'me' or person_id is null),
  check (person_id is null or head_count = 1),
  check (role = 'me' or input_value > 0),
  foreign key (user_id, transaction_id) references public.transactions (user_id, id)
    on delete cascade,
  -- A deleted person's lines stay, without a name, so the amounts do not change.
  foreign key (user_id, person_id) references public.people (user_id, id)
    on delete set null (person_id)
);

create unique index transaction_people_one_me
  on public.transaction_people (transaction_id) where role = 'me';
create index transaction_people_user_person_idx on public.transaction_people (user_id, person_id);

alter table public.transaction_people enable row level security;
revoke all on public.transaction_people from anon, authenticated;
grant select on public.transaction_people to authenticated;
grant insert (transaction_id, position, role, person_id, head_count, input_mode, input_value, amount),
      delete
  on public.transaction_people to authenticated;

create policy "transaction_people: read own"
  on public.transaction_people for select to authenticated
  using (user_id = (select auth.uid()));
create policy "transaction_people: insert own"
  on public.transaction_people for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "transaction_people: delete own"
  on public.transaction_people for delete to authenticated
  using (user_id = (select auth.uid()));
create policy "transaction_people: mfa required"
  on public.transaction_people as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- Lines only on expenses and incomes; an expense has exactly one Moi and no "from", an
-- income only "from"; one input mode; each part signed like the transaction (Moi can be
-- zero) and the parts sum to its amount.
create function public.check_transaction_people(transaction uuid)
returns void
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  t_kind text;
  t_amount numeric;
  lines integer;
  modes integer;
  mine integer;
  wrong_roles integer;
  total numeric;
  same_sign boolean;
begin
  select t.kind, t.amount into t_kind, t_amount from public.transactions t where t.id = transaction;
  if not found then
    return;
  end if;

  select count(*), count(distinct p.input_mode), count(*) filter (where p.role = 'me'),
         count(*) filter (where case t_kind
           when 'expense' then p.role = 'from'
           else p.role <> 'from' end),
         sum(p.amount), bool_and(p.amount = 0 or sign(p.amount) = sign(t_amount))
  into lines, modes, mine, wrong_roles, total, same_sign
  from public.transaction_people p
  where p.transaction_id = transaction;

  if lines = 0 then
    return;
  end if;
  if t_kind not in ('expense', 'income') or wrong_roles > 0
     or (t_kind = 'expense' and mine <> 1) then
    raise exception 'people_role_invalid' using errcode = '23514';
  end if;
  if modes > 1 then
    raise exception 'people_mixed_modes' using errcode = '23514';
  end if;
  if not same_sign or total <> t_amount then
    raise exception 'people_sum_mismatch' using errcode = '23514';
  end if;
end;
$$;

revoke execute on function public.check_transaction_people(uuid) from public, anon;
grant execute on function public.check_transaction_people(uuid) to authenticated;

create function public.on_transaction_person_changed()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op <> 'DELETE' then
    perform public.check_transaction_people(new.transaction_id);
  end if;
  if tg_op <> 'INSERT' and (tg_op = 'DELETE' or old.transaction_id <> new.transaction_id) then
    perform public.check_transaction_people(old.transaction_id);
  end if;
  return null;
end;
$$;

revoke execute on function public.on_transaction_person_changed() from public, anon, authenticated;

create constraint trigger transaction_people_check_sum
  after insert or update or delete on public.transaction_people
  deferrable initially deferred
  for each row execute function public.on_transaction_person_changed();

-- A transaction's amount or kind changing is checked against its people too.
create or replace function public.on_transaction_changed()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op <> 'DELETE' then
    perform public.check_transaction_splits(new.id);
    perform public.check_transaction_people(new.id);
    perform public.check_transfer(new.transfer_id);
  end if;
  if tg_op <> 'INSERT' and (tg_op = 'DELETE' or old.transfer_id is distinct from new.transfer_id) then
    perform public.check_transfer(old.transfer_id);
  end if;
  return null;
end;
$$;

-- How often each person is on a transaction: the people list's Fréquents (the last 90
-- days, ranked) and the count named when deleting one.
create view public.person_usage
with (security_invoker = true)
as
select
  p.person_id,
  count(*)::integer as transaction_count,
  count(*) filter (where t.occurred_on > current_date - 90
    and t.occurred_on <= current_date)::integer as recent_count,
  max(t.occurred_on) as last_on
from public.transaction_people p
join public.transactions t on t.id = p.transaction_id
where p.person_id is not null
group by p.person_id;

revoke all on public.person_usage from anon, authenticated;
grant select on public.person_usage to authenticated;

-- save_transaction takes the people (spec 20). people is [{role, person_id, head_count,
-- input_mode, input_value}] in the order shown; editing replaces them.
drop function public.save_transaction(uuid, uuid, text, date, numeric, jsonb, numeric, text, text, uuid, text);

create function public.save_transaction(
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
  people jsonb default '[]'
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
  people_modes integer;
  people_mode text;
  people_weight numeric;
begin
  if save_transaction.kind is null or save_transaction.kind not in ('expense', 'income') then
    raise exception 'transaction_kind_invalid' using errcode = '23514';
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
                                     original_amount, original_currency, status, merchant_id, note)
    values (save_transaction.account_id, save_transaction.kind, save_transaction.occurred_on, total, account_currency,
            direction * save_transaction.original_amount, save_transaction.original_currency,
            save_transaction.status, save_transaction.merchant_id,
            nullif(trim(save_transaction.note), ''))
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
      note = nullif(trim(save_transaction.note), '')
    where t.id = saved and t.kind in ('expense', 'income') and t.transfer_id is null;
    if not found then
      raise exception 'transaction_not_found' using errcode = 'P0002';
    end if;
    delete from public.transaction_splits s where s.transaction_id = saved;
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
  people_lines := coalesce(jsonb_array_length(save_transaction.people), 0);
  if people_lines > 0 then
    select count(distinct p ->> 'input_mode'), min(p ->> 'input_mode'), sum((p ->> 'input_value')::numeric)
    into people_modes, people_mode, people_weight
    from jsonb_array_elements(save_transaction.people) p;

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
             (e.p ->> 'input_value')::numeric as input_value, e.n
      from jsonb_array_elements(save_transaction.people) with ordinality as e (p, n)
      order by e.n
    loop
      if people_mode = 'amount' then
        perform public.check_money_amount(line.input_value, account_currency);
      end if;
      share := case
        when line.n = people_lines then total - done
        when people_mode = 'amount' then direction * line.input_value
        else round(total * line.input_value / people_weight, minor)
      end;
      insert into public.transaction_people
        (transaction_id, position, role, person_id, head_count, input_mode, input_value, amount)
      values (saved, line.n, line.role, line.person_id, line.head_count, people_mode, line.input_value, share);
      done := done + share;
    end loop;
  end if;

  return saved;
end;
$$;

revoke execute on function public.save_transaction(uuid, uuid, text, date, numeric, jsonb, numeric, text, text, uuid, text, jsonb) from public, anon;
grant execute on function public.save_transaction(uuid, uuid, text, date, numeric, jsonb, numeric, text, text, uuid, text, jsonb) to authenticated;

-- The list shows each row's named people and filters by person (spec 20); a search also
-- matches their names.
drop function public.list_transactions(date, date, uuid[], uuid[], uuid[], text, date, boolean, integer);

create function public.list_transactions(
  from_date date default null,
  to_date date default null,
  account_ids uuid[] default null,
  category_ids uuid[] default null,
  merchant_ids uuid[] default null,
  search text default null,
  before date default null,
  pending_only boolean default false,
  max_rows integer default 150,
  person_ids uuid[] default null
)
returns table (
  id                uuid,
  transfer_id       uuid,
  kind              text,
  occurred_on       date,
  pending           boolean,
  merchant          text,
  note              text,
  account_name      text,
  institution       text,
  from_account      text,
  from_institution  text,
  to_account        text,
  to_institution    text,
  categories        jsonb,
  people            jsonb,
  amount            text,
  currency          text,
  display_amount    text,
  rate              text,
  day_net           text,
  fee_amount        text,
  fee_category      text,
  received_amount   text,
  received_currency text,
  received_value    text,
  conversion_cost   text,
  more              boolean,
  total             bigint,
  pending_count     bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive branch as (
    select c.id from public.categories c where c.id = any(list_transactions.category_ids)
    union
    select c.id from public.categories c join branch b on c.parent_id = b.id
  ),
  display as (
    select p.display_currency as code, c.minor_units
    from public.profiles p
    join public.currencies c on c.code = p.display_currency
    where p.user_id = (select auth.uid())
  ),
  -- Everything the filters and the search match, at any date.
  matched as (
    select
      t.*,
      t.status = 'pending' or (coalesce(cardinality(list_transactions.account_ids), 0) = 0
        and t.kind = 'transfer' and exists (
        select 1 from public.transactions o
        where o.transfer_id = t.transfer_id and o.status = 'pending'
      )) as is_pending
    from public.transactions t
    left join public.merchants sm on sm.id = t.merchant_id
    join public.accounts sa on sa.id = t.account_id
    left join public.institutions si on si.id = sa.institution_id
    cross join lateral (
      select public.fold_name(trim(coalesce(list_transactions.search, ''))) as text
    ) q
    where (coalesce(cardinality(list_transactions.merchant_ids), 0) = 0
        or t.merchant_id = any(list_transactions.merchant_ids))
      and (coalesce(cardinality(list_transactions.person_ids), 0) = 0 or exists (
        select 1 from public.transaction_people x
        where x.transaction_id = t.id and x.person_id = any(list_transactions.person_ids)
      ))
      and (coalesce(cardinality(list_transactions.category_ids), 0) = 0 or exists (
        select 1 from public.transaction_splits x
        where x.transaction_id = t.id and x.category_id in (select b.id from branch b)
      ))
      -- A fee shows on its transfer, unless categories are filtered.
      and (coalesce(cardinality(list_transactions.category_ids), 0) > 0
        or not (t.kind = 'expense' and t.transfer_id is not null))
      and (q.text = ''
        or exists (
          select 1 from unnest(array[sm.name, t.note, sa.name, si.name]) as v (value)
          where strpos(public.fold_name(coalesce(v.value, '')), q.text) > 0
        )
        or exists (
          select 1 from public.transaction_splits x
          join public.categories k on k.id = x.category_id
          where x.transaction_id = t.id and strpos(public.fold_name(k.name), q.text) > 0
        )
        or exists (
          select 1 from public.transaction_people x
          join public.people k on k.id = x.person_id
          where x.transaction_id = t.id and strpos(public.fold_name(k.name), q.text) > 0
        )
        or (t.transfer_id is not null and exists (
          select 1 from public.transactions o
          join public.accounts oa on oa.id = o.account_id
          left join public.institutions oi on oi.id = oa.institution_id
          where o.transfer_id = t.transfer_id
            and (strpos(public.fold_name(oa.name), q.text) > 0
              or strpos(public.fold_name(coalesce(oi.name, '')), q.text) > 0)
        )))
      and case
        when coalesce(cardinality(list_transactions.account_ids), 0) = 0
          then not (t.kind = 'transfer' and t.amount > 0)
        else t.account_id = any(list_transactions.account_ids)
      end
  ),
  scope as (
    select m.* from matched m
    where (list_transactions.from_date is null or m.occurred_on >= list_transactions.from_date)
      and (list_transactions.to_date is null or m.occurred_on <= list_transactions.to_date)
      and (list_transactions.before is null or m.occurred_on < list_transactions.before)
      and (not list_transactions.pending_only or m.is_pending)
  ),
  cutoff as (
    select s.occurred_on from scope s
    order by s.occurred_on desc
    offset greatest(list_transactions.max_rows, 1) - 1 limit 1
  ),
  page as (
    select s.* from scope s
    where s.occurred_on >= coalesce((select c.occurred_on from cutoff c), '-infinity'::date)
  ),
  listed as (
    select
      t.id,
      t.transfer_id,
      t.kind,
      t.occurred_on,
      min(t.created_at) over (partition by coalesce(t.transfer_id, t.id)) as entered_at,
      t.is_pending as pending,
      m.name as merchant,
      t.note,
      a.name as account_name,
      i.name as institution,
      legs.from_account,
      legs.from_institution,
      legs.to_account,
      legs.to_institution,
      coalesce(s.categories, '[]'::jsonb) as categories,
      coalesce(pp.people, '[]'::jsonb) as people,
      case when coalesce(cardinality(list_transactions.account_ids), 0) = 0 and t.kind = 'transfer'
        then -t.amount else t.amount end
        as amount,
      t.currency,
      public.exchange_rate(t.currency, d.code, t.occurred_on) as rate,
      d.minor_units,
      fee.amount as fee_amount,
      fee.category as fee_category,
      arrival.amount as received_amount,
      arrival.currency as received_currency,
      arrival.value as received_value,
      arrival.market,
      fx.market as fx_market
    from page t
    cross join display d
    join public.accounts a on a.id = t.account_id
    left join public.institutions i on i.id = a.institution_id
    left join public.merchants m on m.id = t.merchant_id
    -- The largest share first, as the row stacks the icons.
    left join lateral (
      select jsonb_agg(
        jsonb_build_object('name', k.name, 'icon', k.icon, 'color', k.color)
        order by abs(x.amount) desc, k.name
      ) as categories
      from public.transaction_splits x
      join public.categories k on k.id = x.category_id
      where x.transaction_id = t.id
    ) s on true
    -- The named people, in the order of their lines, for the row's avatars.
    left join lateral (
      select jsonb_agg(k.name order by x.position) as people
      from public.transaction_people x
      join public.people k on k.id = x.person_id
      where x.transaction_id = t.id
    ) pp on true
    left join lateral (
      select
        max(oa.name) filter (where o.amount < 0) as from_account,
        max(oi.name) filter (where o.amount < 0) as from_institution,
        max(oa.name) filter (where o.amount > 0) as to_account,
        max(oi.name) filter (where o.amount > 0) as to_institution
      from public.transactions o
      join public.accounts oa on oa.id = o.account_id
      left join public.institutions oi on oi.id = oa.institution_id
      where o.transfer_id = t.transfer_id and o.kind = 'transfer'
    ) legs on t.transfer_id is not null
    -- Only the departure row carries the fee and the arrival.
    left join lateral (
      select -f.amount as amount, k.name as category
      from public.transactions f
      left join public.transaction_splits x on x.transaction_id = f.id
      left join public.categories k on k.id = x.category_id
      where f.transfer_id = t.transfer_id and f.kind = 'expense'
      limit 1
    ) fee on t.kind = 'transfer' and t.amount < 0
      and coalesce(cardinality(list_transactions.category_ids), 0) = 0
    left join lateral (
      select
        o.amount,
        o.currency,
        round(o.amount / r.rate, c.minor_units) as value,
        round(-t.amount * r.rate, oc.minor_units) as market
      from public.transactions o
      join public.currencies c on c.code = t.currency
      join public.currencies oc on oc.code = o.currency
      cross join lateral (select public.exchange_rate(t.currency, o.currency, t.occurred_on) as rate) r
      where o.transfer_id = t.transfer_id and o.kind = 'transfer' and o.amount > 0
        and o.currency <> t.currency
    ) arrival on t.kind = 'transfer' and t.amount < 0
    -- Paid in another currency: the market value of the original amount, in the account's.
    left join lateral (
      select round(abs(t.original_amount)
        * public.exchange_rate(t.original_currency, t.currency, t.occurred_on), c.minor_units) as market
      from public.currencies c
      where c.code = t.currency
    ) fx on t.original_currency is not null
  ),
  converted as (
    select
      l.*,
      round(l.amount * l.rate, l.minor_units) as display_value,
      round(-l.fee_amount * l.rate, l.minor_units) as fee_display,
      l.kind in ('expense', 'income') as in_day_net
    from listed l
  )
  select
    v.id,
    v.transfer_id,
    v.kind,
    v.occurred_on,
    v.pending,
    v.merchant,
    v.note,
    v.account_name,
    v.institution,
    v.from_account,
    v.from_institution,
    v.to_account,
    v.to_institution,
    v.categories,
    v.people,
    v.amount::text,
    v.currency::text,
    v.display_value::text,
    v.rate::text,
    case
      when bool_or((v.in_day_net or v.fee_amount is not null) and v.rate is null) over day then null
      else (coalesce(sum(v.display_value) filter (where v.in_day_net) over day, 0)
        + coalesce(sum(v.fee_display) over day, 0))::text
    end,
    v.fee_amount::text,
    v.fee_category,
    v.received_amount::text,
    v.received_currency::text,
    v.received_value::text,
    -- At the market value exactly, rounding the way back would show a cent of cost.
    case
      when v.received_amount = v.market then '0'
      when v.received_amount is not null then (abs(v.amount) - v.received_value)::text
      when v.kind = 'income' then (v.fx_market - abs(v.amount))::text
      else (abs(v.amount) - v.fx_market)::text
    end,
    exists (
      select 1 from scope s
      where s.occurred_on < (select c.occurred_on from cutoff c)
    ),
    (select count(*) from scope),
    (select count(*) from matched m where m.is_pending)
  from converted v
  window day as (partition by v.occurred_on)
  order by v.occurred_on desc, v.entered_at desc, coalesce(v.transfer_id, v.id), v.kind = 'expense', v.id;
$$;

revoke execute on function public.list_transactions(date, date, uuid[], uuid[], uuid[], text, date, boolean, integer, uuid[]) from public, anon;
grant execute on function public.list_transactions(date, date, uuid[], uuid[], uuid[], text, date, boolean, integer, uuid[]) to authenticated;
