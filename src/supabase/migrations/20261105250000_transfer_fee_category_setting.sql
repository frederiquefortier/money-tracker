-- TRX-04: the fee category is chosen once, in Réglages, instead of on each transfer.
-- save_transfer takes it from the profile, and set_transfer_fee_category sets it and
-- moves every transfer fee already saved, so all of them stay in one category.

drop function public.save_transfer(uuid, uuid, uuid, numeric, date, numeric, numeric, uuid, text, boolean, boolean);

create function public.save_transfer(
  transfer_id uuid,
  from_account uuid,
  to_account uuid,
  amount numeric,
  occurred_on date,
  received numeric default null,
  fee numeric default null,
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
  fee_category uuid;
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
    select p.transfer_fee_category_id into fee_category
    from public.profiles p where p.user_id = (select auth.uid());
    if fee_category is null then
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
  values (fee_id, fee_category, 'amount', save_transfer.fee, -save_transfer.fee);

  return saved;
end;
$$;

revoke execute on function public.save_transfer(uuid, uuid, uuid, numeric, date, numeric, numeric, text, boolean, boolean) from public, anon;
grant execute on function public.save_transfer(uuid, uuid, uuid, numeric, date, numeric, numeric, text, boolean, boolean) to authenticated;

create function public.set_transfer_fee_category(category uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.categories c
    where c.id = set_transfer_fee_category.category and c.kind = 'expense'
  ) then
    raise exception 'category_not_found' using errcode = 'P0002';
  end if;

  update public.profiles p set transfer_fee_category_id = set_transfer_fee_category.category
  where p.user_id = (select auth.uid());

  update public.transaction_splits s set category_id = set_transfer_fee_category.category
  from public.transactions t
  where t.user_id = s.user_id and t.id = s.transaction_id
    and t.kind = 'expense' and t.transfer_id is not null
    and s.category_id <> set_transfer_fee_category.category;
end;
$$;

revoke execute on function public.set_transfer_fee_category(uuid) from public, anon;
grant execute on function public.set_transfer_fee_category(uuid) to authenticated;
