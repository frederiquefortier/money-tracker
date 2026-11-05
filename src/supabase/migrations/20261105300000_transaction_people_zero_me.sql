-- A Moi line of zero in amounts (I paid entirely for others) was refused by the amount
-- check, which wants a positive amount. Only the people's loop changes.

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

  return saved;
end;
$$;
