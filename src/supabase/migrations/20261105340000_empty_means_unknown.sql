-- An empty field means not known yet, on any line (decided 2026-11-08). An empty Me doit
-- is set by its reimbursement, in every mode; empty Moi or Invité lines take what the
-- others leave. In Montant the typed lines keep their amounts and the empty ones absorb
-- what a reimbursement changes; with none empty, Moi does.

alter table public.transaction_people
  add column fills_rest boolean not null default false;

alter table public.transaction_people drop constraint transaction_people_unknown_check;
alter table public.transaction_people
  add constraint transaction_people_unknown_check check (not amount_unknown or role = 'owes'),
  add constraint transaction_people_fills_check check (not fills_rest or role <> 'owes');

grant insert (fills_rest) on public.transaction_people to authenticated;

-- The lines that absorb a part not known yet: in Montant those left empty, else Moi; in
-- Parts or %, every known line, by its weight.
create function public.absorbs(
  amount_unknown boolean, input_mode text, fills_rest boolean, role text, any_empty boolean
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select not amount_unknown and (
    input_mode <> 'amount' or fills_rest or (not any_empty and role = 'me'));
$$;

revoke execute on function public.absorbs(boolean, text, boolean, text, boolean) from public, anon;
grant execute on function public.absorbs(boolean, text, boolean, text, boolean) to authenticated;

-- How much the parts not known yet of an expense can take, together: its amount less the
-- lines that keep theirs.
create function public.empty_part_room(transaction uuid)
returns numeric
language sql
stable
security invoker
set search_path = ''
as $$
  with lines as (
    select p.*, bool_or(p.fills_rest) over () as any_empty
    from public.transaction_people p
    where p.transaction_id = transaction
  )
  select abs(t.amount) - coalesce(sum(abs(l.input_value)) filter (
      where not l.amount_unknown and not public.absorbs(l.amount_unknown, l.input_mode, l.fills_rest, l.role, l.any_empty)), 0)
  from public.transactions t
  left join lines l on true
  where t.id = transaction
  group by t.amount;
$$;

revoke execute on function public.empty_part_room(uuid) from public, anon;
grant execute on function public.empty_part_room(uuid) to authenticated;

create or replace function public.recompute_people(transaction uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  t_amount numeric;
  minor integer;
  mode text;
  any_empty boolean;
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
  select min(p.input_mode), bool_or(p.fills_rest) into mode, any_empty
  from public.transaction_people p where p.transaction_id = transaction;

  update public.transaction_people p
  set amount = (select sign(t_amount) * sum(r.amount) from public.reimbursements r where r.owed_line_id = p.id)
  where p.transaction_id = transaction and p.amount_unknown;

  -- Lines that keep their typed amount (Montant only).
  update public.transaction_people p
  set amount = sign(t_amount) * p.input_value
  where p.transaction_id = transaction and not p.amount_unknown and not public.absorbs(p.amount_unknown, p.input_mode, p.fills_rest, p.role, any_empty);

  select t_amount - coalesce(sum(p.amount) filter (
           where p.amount_unknown or not public.absorbs(p.amount_unknown, p.input_mode, p.fills_rest, p.role, any_empty)), 0),
         sum(case when mode = 'amount' then 1 else p.input_value end)
           filter (where public.absorbs(p.amount_unknown, p.input_mode, p.fills_rest, p.role, any_empty)),
         count(*) filter (where public.absorbs(p.amount_unknown, p.input_mode, p.fills_rest, p.role, any_empty))
  into rest, weight, lines
  from public.transaction_people p
  where p.transaction_id = transaction;

  for line in
    select p.id, case when mode = 'amount' then 1 else p.input_value end as w
    from public.transaction_people p
    where p.transaction_id = transaction and public.absorbs(p.amount_unknown, p.input_mode, p.fills_rest, p.role, any_empty)
    order by p.position
  loop
    i := i + 1;
    share := case
      when i = lines then rest - done
      when coalesce(weight, 0) = 0 then 0
      else round(rest * line.w / weight, minor)
    end;
    update public.transaction_people p set amount = share where p.id = line.id;
    done := done + share;
  end loop;
end;
$$;

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
             coalesce((e.p ->> 'fills_rest')::boolean, false) as fills_rest,
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
        (transaction_id, position, role, person_id, head_count, input_mode, input_value, amount, fills_rest)
      values (saved, line.n, line.role, line.person_id, line.head_count, people_mode, line.input_value, share,
              line.fills_rest);
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
      -- A part not known yet takes what is left of the income, but never more than the
      -- lines that absorb it can give up (empty_part_room).
      take := case when owed.amount_unknown
                   then least(left_over, public.empty_part_room(owed.transaction_id) - owed.back)
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
