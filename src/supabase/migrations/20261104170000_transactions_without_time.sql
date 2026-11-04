-- Transactions have a calendar date and no time (spec 15, decided 2026-11-04): a date
-- typed as 17.08.2026 reads 17.08.2026 everywhere, with no time zone to shift it. Drops
-- occurred_at_time and the time argument of save_transaction and save_transfer.

drop function public.save_transaction(uuid, uuid, text, date, numeric, jsonb, time, numeric, text, text, uuid, text);
drop function public.save_transfer(uuid, uuid, uuid, numeric, date, numeric, numeric, uuid, time, text, boolean, boolean);

alter table public.transactions drop column occurred_at_time;

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
  note text default null
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

  return saved;
end;
$$;

revoke execute on function public.save_transaction(uuid, uuid, text, date, numeric, jsonb, numeric, text, text, uuid, text) from public, anon;
grant execute on function public.save_transaction(uuid, uuid, text, date, numeric, jsonb, numeric, text, text, uuid, text) to authenticated;

create function public.save_transfer(
  transfer_id uuid,
  from_account uuid,
  to_account uuid,
  amount numeric,
  occurred_on date,
  received numeric default null,
  fee numeric default null,
  fee_category uuid default null,
  note text default null,
  from_pending boolean default false,
  to_pending boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved uuid := save_transfer.transfer_id;
  from_currency char(3);
  to_currency char(3);
  arrived numeric := save_transfer.received;
  has_fee boolean := coalesce(save_transfer.fee, 0) <> 0;
  fee_id uuid;
  clean_note text := nullif(trim(save_transfer.note), '');
  from_status text := case when save_transfer.from_pending then 'pending' else 'cleared' end;
  to_status text := case when save_transfer.to_pending then 'pending' else 'cleared' end;
begin
  if save_transfer.from_account = save_transfer.to_account then
    raise exception 'transfer_same_account' using errcode = '23514';
  end if;

  select a.currency into from_currency from public.accounts a where a.id = save_transfer.from_account;
  if not found then
    raise exception 'account_not_found' using errcode = 'P0002';
  end if;
  select a.currency into to_currency from public.accounts a where a.id = save_transfer.to_account;
  if not found then
    raise exception 'account_not_found' using errcode = 'P0002';
  end if;

  perform public.check_money_amount(save_transfer.amount, from_currency);
  if from_currency = to_currency then
    if arrived is not null and arrived <> save_transfer.amount then
      raise exception 'transfer_amounts_differ' using errcode = '23514';
    end if;
    arrived := save_transfer.amount;
  else
    if arrived is null then
      raise exception 'transfer_received_required' using errcode = '23514';
    end if;
    perform public.check_money_amount(arrived, to_currency);
  end if;
  if has_fee then
    perform public.check_money_amount(save_transfer.fee, from_currency);
    if save_transfer.fee_category is null then
      raise exception 'transfer_fee_category_required' using errcode = '23514';
    end if;
  end if;

  if saved is null then
    saved := gen_random_uuid();
    insert into public.transactions (account_id, kind, occurred_on, amount, currency,
                                     status, note, transfer_id)
    values
      (save_transfer.from_account, 'transfer', save_transfer.occurred_on,
       -save_transfer.amount, from_currency, from_status, clean_note, saved),
      (save_transfer.to_account, 'transfer', save_transfer.occurred_on,
       arrived, to_currency, to_status, clean_note, saved);
  else
    update public.transactions t set
      account_id = save_transfer.from_account,
      occurred_on = save_transfer.occurred_on,
      amount = -save_transfer.amount,
      currency = from_currency,
      status = from_status,
      note = clean_note
    where t.transfer_id = saved and t.kind = 'transfer' and t.amount < 0;
    if not found then
      raise exception 'transfer_not_found' using errcode = 'P0002';
    end if;

    update public.transactions t set
      account_id = save_transfer.to_account,
      occurred_on = save_transfer.occurred_on,
      amount = arrived,
      currency = to_currency,
      status = to_status,
      note = clean_note
    where t.transfer_id = saved and t.kind = 'transfer' and t.amount > 0;

    select t.id into fee_id from public.transactions t
    where t.transfer_id = saved and t.kind = 'expense';
  end if;

  if not has_fee then
    delete from public.transactions t where t.id = fee_id;
    return saved;
  end if;

  if fee_id is null then
    insert into public.transactions (account_id, kind, occurred_on, amount, currency,
                                     status, transfer_id)
    values (save_transfer.from_account, 'expense', save_transfer.occurred_on,
            -save_transfer.fee, from_currency, from_status, saved)
    returning id into fee_id;
  else
    update public.transactions t set
      account_id = save_transfer.from_account,
      occurred_on = save_transfer.occurred_on,
      amount = -save_transfer.fee,
      currency = from_currency,
      status = from_status
    where t.id = fee_id;
    delete from public.transaction_splits s where s.transaction_id = fee_id;
  end if;

  insert into public.transaction_splits (transaction_id, category_id, input_mode, input_value, amount)
  values (fee_id, save_transfer.fee_category, 'amount', save_transfer.fee, -save_transfer.fee);

  update public.profiles p set transfer_fee_category_id = save_transfer.fee_category
  where p.user_id = (select auth.uid());

  return saved;
end;
$$;

revoke execute on function public.save_transfer(uuid, uuid, uuid, numeric, date, numeric, numeric, uuid, text, boolean, boolean) from public, anon;
grant execute on function public.save_transfer(uuid, uuid, uuid, numeric, date, numeric, numeric, uuid, text, boolean, boolean) to authenticated;
