-- TRX-03: the adjustment form opens from an account on Comptes (spec 16). It shows the
-- app's balance on the chosen date as text, since a numeric over the API arrives as a
-- float (ADR-004). An adjustment being edited is left out of that balance, and
-- save_adjustment now edits one from a new real balance, as it creates one.

-- The balance at the end of a day without the given adjustment, if it counts by then.
create function public.adjustment_base(account_id uuid, on_date date, adjustment_id uuid)
returns numeric
language sql
stable
security invoker
set search_path = ''
as $$
  select public.account_balance_on(adjustment_base.account_id, adjustment_base.on_date)
    - coalesce((
      select t.amount from public.transactions t
      where t.id = adjustment_base.adjustment_id
        and t.kind = 'adjustment'
        and t.account_id = adjustment_base.account_id
        and t.occurred_on <= adjustment_base.on_date
    ), 0);
$$;

revoke execute on function public.adjustment_base(uuid, date, uuid) from public, anon;
grant execute on function public.adjustment_base(uuid, date, uuid) to authenticated;

create function public.adjustment_balance_text(
  account_id uuid,
  on_date date,
  adjustment_id uuid default null
)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select public.adjustment_base(
    adjustment_balance_text.account_id,
    adjustment_balance_text.on_date,
    adjustment_balance_text.adjustment_id
  )::text;
$$;

revoke execute on function public.adjustment_balance_text(uuid, date, uuid) from public, anon;
grant execute on function public.adjustment_balance_text(uuid, date, uuid) to authenticated;

drop function public.save_adjustment(uuid, numeric, date, text);

-- An adjustment keeps its account; editing changes its date, gap and note.
create function public.save_adjustment(
  adjustment_id uuid,
  account_id uuid,
  real_balance numeric,
  occurred_on date,
  note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  account_currency char(3);
  gap numeric;
  saved uuid := save_adjustment.adjustment_id;
  clean_note text := nullif(trim(save_adjustment.note), '');
begin
  select a.currency into account_currency from public.accounts a where a.id = save_adjustment.account_id;
  if not found then
    raise exception 'account_not_found' using errcode = 'P0002';
  end if;
  if saved is not null and not exists (
    select 1 from public.transactions t
    where t.id = saved and t.kind = 'adjustment' and t.account_id = save_adjustment.account_id
  ) then
    raise exception 'adjustment_not_found' using errcode = 'P0002';
  end if;
  -- The real balance can be zero or negative (a credit card), so only its precision is checked.
  if save_adjustment.real_balance is null or exists (
    select 1 from public.currencies c
    where c.code = account_currency
      and save_adjustment.real_balance <> round(save_adjustment.real_balance, c.minor_units)
  ) then
    raise exception 'amount_precision' using errcode = '23514';
  end if;

  gap := save_adjustment.real_balance
    - public.adjustment_base(save_adjustment.account_id, save_adjustment.occurred_on, saved);
  if gap = 0 then
    raise exception 'balance_already_matches' using errcode = '23514';
  end if;

  if saved is null then
    insert into public.transactions (account_id, kind, occurred_on, amount, currency, note)
    values (save_adjustment.account_id, 'adjustment', save_adjustment.occurred_on, gap,
            account_currency, clean_note)
    returning id into saved;
  else
    update public.transactions t
    set occurred_on = save_adjustment.occurred_on, amount = gap, note = clean_note
    where t.id = saved;
  end if;

  return saved;
end;
$$;

revoke execute on function public.save_adjustment(uuid, uuid, numeric, date, text) from public, anon;
grant execute on function public.save_adjustment(uuid, uuid, numeric, date, text) to authenticated;
