-- One income repaying several owed lines kept only the first when a part was not known
-- yet: that part took all that was left, and a line given nothing was dropped (bugs.md).
-- The known parts now go first, in the order ticked, then the parts not known yet share
-- what is left equally, each within its expense's room. Only the repayment block differs
-- from the previous `save_transaction` (20261111160000_holdings.sql).

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
  unknown_ids uuid[];
  unknown_tx uuid[];
  gives numeric[];
  tx_ids uuid[];
  tx_cap numeric[];
  unit numeric;
  active integer;
  step numeric;
  given numeric;
  slot integer;
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

  -- An income pays back the owed lines given (spec 21). The known parts first, in the order
  -- ticked, each taking what it is still owed; then the parts not known yet share what is
  -- left equally, each within what its expense can give up (empty_part_room), a share that
  -- does not fit going to the others (author, 2026-11-19: a part not known yet took all
  -- that was left, and a line given nothing was dropped, so a repayment of several
  -- expenses kept only the first). What is over is a gift.
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
      affected := array_append(affected, owed.transaction_id);
      if owed.amount_unknown then
        unknown_ids := array_append(unknown_ids, owed.id);
        unknown_tx := array_append(unknown_tx, owed.transaction_id);
        gives := array_append(gives, 0::numeric);
        -- The unknown parts of one expense share its room.
        if array_position(tx_ids, owed.transaction_id) is null then
          tx_ids := array_append(tx_ids, owed.transaction_id);
          tx_cap := array_append(tx_cap, public.empty_part_room(owed.transaction_id) - (
            select coalesce(sum(x.amount), 0) from public.reimbursements x
            join public.transaction_people q on q.id = x.owed_line_id
            where q.transaction_id = owed.transaction_id and q.amount_unknown));
        end if;
      else
        take := least(left_over, abs(owed.amount) - owed.back);
        if take > 0 then
          insert into public.reimbursements (owed_line_id, income_id, amount)
          values (owed.id, saved, take);
          left_over := left_over - take;
        end if;
      end if;
    end loop;
    unit := power(10::numeric, -minor);
    loop
      active := 0;
      for i in 1 .. coalesce(array_length(unknown_ids, 1), 0) loop
        if tx_cap[array_position(tx_ids, unknown_tx[i])] > 0 then
          active := active + 1;
        end if;
      end loop;
      exit when active = 0 or left_over <= 0;
      step := greatest(trunc(left_over / active, minor), unit);
      for i in 1 .. array_length(unknown_ids, 1) loop
        slot := array_position(tx_ids, unknown_tx[i]);
        given := least(step, tx_cap[slot], left_over);
        if given > 0 then
          gives[i] := gives[i] + given;
          tx_cap[slot] := tx_cap[slot] - given;
          left_over := left_over - given;
        end if;
      end loop;
    end loop;
    for i in 1 .. coalesce(array_length(unknown_ids, 1), 0) loop
      if gives[i] > 0 then
        insert into public.reimbursements (owed_line_id, income_id, amount)
        values (unknown_ids[i], saved, gives[i]);
      end if;
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
