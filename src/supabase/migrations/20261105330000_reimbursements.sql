-- Reimbursements (TRX-07, PPL-05, spec 21): an income pays back the lines of expenses
-- where someone owed me their part. A part not known yet ("Montant inconnu") is set by
-- what came back, and the other lines share what remains (Parts or % only, so they can be
-- recomputed). Linking is done from the income only (decided 2026-11-05).

alter table public.transaction_people
  add column amount_unknown boolean not null default false,
  alter column amount drop not null;

-- A line not known yet has no value of its own.
alter table public.transaction_people drop constraint transaction_people_check2;
alter table public.transaction_people
  add constraint transaction_people_value_check check (role = 'me' or amount_unknown or input_value > 0),
  add constraint transaction_people_unknown_check check (
    not amount_unknown or (role = 'owes' and input_mode <> 'amount')),
  add constraint transaction_people_amount_check check (amount is not null or amount_unknown);

grant insert (amount_unknown), update (amount) on public.transaction_people to authenticated;

create policy "transaction_people: update own"
  on public.transaction_people for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create table public.reimbursements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  owed_line_id uuid not null,
  income_id    uuid not null,
  amount       numeric(19,4) not null check (amount > 0),
  created_at   timestamptz not null default now(),
  unique (user_id, id),
  unique (owed_line_id, income_id),
  foreign key (user_id, owed_line_id) references public.transaction_people (user_id, id)
    on delete cascade,
  foreign key (user_id, income_id) references public.transactions (user_id, id)
    on delete cascade
);

create index reimbursements_user_line_idx on public.reimbursements (user_id, owed_line_id);
create index reimbursements_user_income_idx on public.reimbursements (user_id, income_id);

alter table public.reimbursements enable row level security;
revoke all on public.reimbursements from anon, authenticated;
grant select, delete on public.reimbursements to authenticated;
grant insert (owed_line_id, income_id, amount) on public.reimbursements to authenticated;

create policy "reimbursements: read own"
  on public.reimbursements for select to authenticated
  using (user_id = (select auth.uid()));
create policy "reimbursements: insert own"
  on public.reimbursements for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "reimbursements: delete own"
  on public.reimbursements for delete to authenticated
  using (user_id = (select auth.uid()));
create policy "reimbursements: mfa required"
  on public.reimbursements as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- Only an owed line, paid back by an income.
create function public.check_reimbursement()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from public.transaction_people p where p.id = new.owed_line_id and p.role = 'owes')
     or not exists (select 1 from public.transactions t where t.id = new.income_id and t.kind = 'income') then
    raise exception 'reimbursement_invalid' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.check_reimbursement() from public, anon, authenticated;

create trigger reimbursements_check
  before insert on public.reimbursements
  for each row execute function public.check_reimbursement();

-- Each owed line with what came back, and whether it is still open: a known part not
-- fully paid back, or a part not known yet with nothing back.
create view public.owed_lines
with (security_invoker = true)
as
select
  p.id,
  p.transaction_id,
  p.person_id,
  p.amount_unknown,
  abs(p.amount) as part,
  coalesce(r.back, 0) as back,
  case when p.amount_unknown then r.back is null
       else coalesce(r.back, 0) < abs(p.amount) end as open,
  t.occurred_on,
  t.currency,
  m.name as merchant,
  c.id as category_id,
  c.name as category
from public.transaction_people p
join public.transactions t on t.id = p.transaction_id
left join public.merchants m on m.id = t.merchant_id
left join lateral (select sum(x.amount) as back from public.reimbursements x where x.owed_line_id = p.id) r on true
left join lateral (
  select k.id, k.name from public.transaction_splits s
  join public.categories k on k.id = s.category_id
  where s.transaction_id = t.id
  order by abs(s.amount) desc, k.name
  limit 1
) c on true
where p.role = 'owes';

-- PPL-05: what each person still owes me, per currency, and how many parts are unknown.
create view public.person_balances
with (security_invoker = true)
as
select
  o.person_id,
  o.currency,
  sum(o.part - o.back) filter (where not o.amount_unknown) as open_amount,
  count(*) filter (where o.amount_unknown)::integer as unknown_count
from public.owed_lines o
where o.open and o.person_id is not null
group by o.person_id, o.currency;

revoke all on public.owed_lines, public.person_balances from anon, authenticated;
grant select on public.owed_lines, public.person_balances to authenticated;

-- An expense with a part not known yet: that line takes what came back for it, and the
-- other lines share what remains by their weights, the last taking the rounding.
create function public.recompute_people(transaction uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  t_amount numeric;
  minor integer;
  rest numeric;
  weight numeric;
  lines integer;
  i integer := 0;
  done numeric := 0;
  share numeric;
  line record;
begin
  if not exists (
    select 1 from public.transaction_people p where p.transaction_id = transaction and p.amount_unknown
  ) then
    return;
  end if;
  select t.amount, c.minor_units into t_amount, minor
  from public.transactions t join public.currencies c on c.code = t.currency
  where t.id = transaction;
  if not found then
    return;
  end if;

  update public.transaction_people p
  set amount = (select sign(t_amount) * sum(r.amount) from public.reimbursements r where r.owed_line_id = p.id)
  where p.transaction_id = transaction and p.amount_unknown;

  select t_amount - coalesce(sum(p.amount) filter (where p.amount_unknown), 0),
         sum(p.input_value) filter (where not p.amount_unknown),
         count(*) filter (where not p.amount_unknown)
  into rest, weight, lines
  from public.transaction_people p
  where p.transaction_id = transaction;

  for line in
    select p.id, p.input_value from public.transaction_people p
    where p.transaction_id = transaction and not p.amount_unknown
    order by p.position
  loop
    i := i + 1;
    share := case
      when i = lines then rest - done
      when coalesce(weight, 0) = 0 then 0
      else round(rest * line.input_value / weight, minor)
    end;
    update public.transaction_people p set amount = share where p.id = line.id;
    done := done + share;
  end loop;
end;
$$;

revoke execute on function public.recompute_people(uuid) from public, anon;
grant execute on function public.recompute_people(uuid) to authenticated;

-- An income deleted or unlinked: a part it had set is unknown again.
create function public.on_reimbursement_removed()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform public.recompute_people(p.transaction_id)
  from public.transaction_people p where p.id = old.owed_line_id;
  return null;
end;
$$;

revoke execute on function public.on_reimbursement_removed() from public, anon, authenticated;

create trigger reimbursements_removed
  after delete on public.reimbursements
  for each row execute function public.on_reimbursement_removed();

-- A known part is never paid back more than it is.
create or replace function public.check_transaction_people(transaction uuid)
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
         sum(p.amount), bool_and(p.amount is null or p.amount = 0 or sign(p.amount) = sign(t_amount))
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
  if exists (
    select 1 from public.owed_lines o
    where o.transaction_id = transaction and not o.amount_unknown and o.back > o.part
  ) then
    raise exception 'reimbursement_over' using errcode = '23514';
  end if;
end;
$$;

drop function public.save_transaction(uuid, uuid, text, date, numeric, jsonb, numeric, text, text, uuid, text, jsonb);

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
  people jsonb default '[]',
  reimburses uuid[] default null
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
  kept jsonb;
  affected uuid[];
  owed record;
  left_over numeric;
  take numeric;
  expense uuid;
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
             coalesce((e.p ->> 'amount_unknown')::boolean, false) as unknown,
             (e.p ->> 'input_value')::numeric as input_value, e.n
      from jsonb_array_elements(save_transaction.people) with ordinality as e (p, n)
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
        (transaction_id, position, role, person_id, head_count, input_mode, input_value, amount)
      values (saved, line.n, line.role, line.person_id, line.head_count, people_mode, line.input_value, share);
      done := done + share;
    end loop;
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
      take := case when owed.amount_unknown then left_over
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

  return saved;
end;
$$;

drop function public.list_transactions(date, date, uuid[], uuid[], uuid[], text, date, boolean, integer, uuid[], boolean);

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
  person_ids uuid[] default null,
  owed_only boolean default false
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
  reimburses        jsonb,
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
  pending_count     bigint,
  owed_count        bigint
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
      )) as is_pending,
      exists (
        select 1 from public.owed_lines o
        where o.transaction_id = t.id and o.open
      ) as is_owed
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
      and (not list_transactions.owed_only or m.is_owed)
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
      coalesce(rb.reimburses, '[]'::jsonb) as reimburses,
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
    -- Everyone but Moi, in the order of their lines: the row's avatars (a line without a
    -- name with its count) and its colour when someone owes me.
    left join lateral (
      select jsonb_agg(
        jsonb_build_object('name', k.name, 'count', x.head_count, 'role', x.role,
                           'open', coalesce(o.open, false))
        order by x.position
      ) as people
      from public.transaction_people x
      left join public.people k on k.id = x.person_id
      left join public.owed_lines o on o.id = x.id
      where x.transaction_id = t.id and x.role <> 'me'
    ) pp on true
    -- What an income pays back: each expense's merchant, or its largest category, and date.
    left join lateral (
      select jsonb_agg(distinct jsonb_build_object(
        'label', coalesce(o.merchant, o.category), 'date', o.occurred_on)) as reimburses
      from public.reimbursements r
      join public.owed_lines o on o.id = r.owed_line_id
      where r.income_id = t.id
    ) rb on t.kind = 'income'
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
    v.reimburses,
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
    (select count(*) from matched m where m.is_pending),
    (select count(*) from matched m where m.is_owed)
  from converted v
  window day as (partition by v.occurred_on)
  order by v.occurred_on desc, v.entered_at desc, coalesce(v.transfer_id, v.id), v.kind = 'expense', v.id;
$$;

revoke execute on function public.list_transactions(date, date, uuid[], uuid[], uuid[], text, date, boolean, integer, uuid[], boolean) from public, anon;
grant execute on function public.list_transactions(date, date, uuid[], uuid[], uuid[], text, date, boolean, integer, uuid[], boolean) to authenticated;
revoke execute on function public.save_transaction(uuid, uuid, text, date, numeric, jsonb, numeric, text, text, uuid, text, jsonb, uuid[]) from public, anon;
grant execute on function public.save_transaction(uuid, uuid, text, date, numeric, jsonb, numeric, text, text, uuid, text, jsonb, uuid[]) to authenticated;
