-- Transactions and their splits (TRX-01..06, 09..11, CUR-08, specs 14, 15, 16). Imports
-- (import_ref, import_batch_id), events, recurrences, treats and holdings add their
-- columns with their own tables.

-- An amount typed by the user: above zero, and no finer than the currency's minor unit.
create function public.check_money_amount(amount numeric, currency text)
returns void
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if amount is null or amount <= 0 then
    raise exception 'amount_not_positive' using errcode = '23514';
  end if;
  if exists (
    select 1 from public.currencies c
    where c.code = currency and amount <> round(amount, c.minor_units)
  ) then
    raise exception 'amount_precision' using errcode = '23514';
  end if;
end;
$$;

revoke execute on function public.check_money_amount(numeric, text) from public, anon;
grant execute on function public.check_money_amount(numeric, text) to authenticated;

-- The amount is signed from the account's point of view and always in the account's
-- currency: (user_id, account_id, currency) references the account with its currency, so
-- an account's currency cannot change once it has transactions (database.md, Money).
-- A transfer is two 'transfer' legs sharing transfer_id, plus an optional 'expense' fee.
create table public.transactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users on delete cascade,
  account_id        uuid not null,
  kind              text not null check (kind in ('expense', 'income', 'transfer', 'adjustment')),
  occurred_on       date not null,
  occurred_at_time  time,
  amount            numeric(19,4) not null,
  currency          char(3) not null,
  original_amount   numeric(19,4),
  original_currency char(3),
  status            text not null default 'cleared' check (status in ('pending', 'cleared')),
  merchant_id       uuid,
  note              text check (length(trim(note)) between 1 and 1000),
  transfer_id       uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, id),
  foreign key (user_id, account_id, currency) references public.accounts (user_id, id, currency),
  foreign key (user_id, original_currency) references public.user_currencies (user_id, code),
  foreign key (user_id, merchant_id) references public.merchants (user_id, id)
    on delete set null (merchant_id),
  check (case kind
    when 'expense' then amount < 0
    when 'income' then amount > 0
    else amount <> 0
  end),
  -- CUR-08: the receipt price, only on expenses and incomes paid in another currency.
  check ((original_amount is null) = (original_currency is null)),
  check (original_currency is null or (
    kind in ('expense', 'income')
    and original_currency <> currency
    and sign(original_amount) = sign(amount)
  )),
  check (kind <> 'transfer' or transfer_id is not null),
  check (kind in ('transfer', 'expense') or transfer_id is null)
);

create index transactions_user_date_idx on public.transactions (user_id, occurred_on desc);
create index transactions_user_account_date_idx
  on public.transactions (user_id, account_id, occurred_on);
create index transactions_user_merchant_idx
  on public.transactions (user_id, merchant_id) where merchant_id is not null;
create index transactions_user_transfer_idx
  on public.transactions (user_id, transfer_id) where transfer_id is not null;

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

alter table public.transactions enable row level security;
revoke all on public.transactions from anon, authenticated;
grant select, delete on public.transactions to authenticated;
grant insert (account_id, kind, occurred_on, occurred_at_time, amount, currency, original_amount,
              original_currency, status, merchant_id, note, transfer_id),
      update (account_id, kind, occurred_on, occurred_at_time, amount, currency, original_amount,
              original_currency, status, merchant_id, note, transfer_id)
  on public.transactions to authenticated;

create policy "transactions: read own"
  on public.transactions for select to authenticated
  using (user_id = (select auth.uid()));

create policy "transactions: insert own"
  on public.transactions for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "transactions: update own"
  on public.transactions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "transactions: delete own"
  on public.transactions for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "transactions: mfa required"
  on public.transactions as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- TRX-06. input_value is what was typed (an amount, a share or a percentage, always
-- positive); amount is computed and signed like its transaction. A category with splits
-- cannot be deleted.
create table public.transaction_splits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users on delete cascade,
  transaction_id uuid not null,
  category_id    uuid not null,
  input_mode     text not null check (input_mode in ('amount', 'share', 'percent')),
  input_value    numeric(19,4) not null check (input_value > 0),
  amount         numeric(19,4) not null check (amount <> 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, id),
  unique (transaction_id, category_id),
  foreign key (user_id, transaction_id) references public.transactions (user_id, id)
    on delete cascade,
  foreign key (user_id, category_id) references public.categories (user_id, id)
);

create index transaction_splits_user_transaction_idx
  on public.transaction_splits (user_id, transaction_id);
create index transaction_splits_user_category_idx
  on public.transaction_splits (user_id, category_id);

create trigger transaction_splits_set_updated_at
  before update on public.transaction_splits
  for each row execute function public.set_updated_at();

alter table public.transaction_splits enable row level security;
revoke all on public.transaction_splits from anon, authenticated;
grant select, delete on public.transaction_splits to authenticated;
grant insert (transaction_id, category_id, input_mode, input_value, amount),
      update (transaction_id, category_id, input_mode, input_value, amount)
  on public.transaction_splits to authenticated;

create policy "transaction_splits: read own"
  on public.transaction_splits for select to authenticated
  using (user_id = (select auth.uid()));

create policy "transaction_splits: insert own"
  on public.transaction_splits for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "transaction_splits: update own"
  on public.transaction_splits for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "transaction_splits: delete own"
  on public.transaction_splits for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "transaction_splits: mfa required"
  on public.transaction_splits as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- An expense or income has at least one split, one input mode, each split signed like the
-- transaction, and the splits sum to the amount. Transfers and adjustments have none.
create function public.check_transaction_splits(transaction uuid)
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
  total numeric;
  same_sign boolean;
begin
  select t.kind, t.amount into t_kind, t_amount from public.transactions t where t.id = transaction;
  if not found then
    return;
  end if;

  select count(*), count(distinct s.input_mode), sum(s.amount), bool_and(sign(s.amount) = sign(t_amount))
  into lines, modes, total, same_sign
  from public.transaction_splits s
  where s.transaction_id = transaction;

  if t_kind in ('transfer', 'adjustment') then
    if lines > 0 then
      raise exception 'transaction_kind_has_no_splits' using errcode = '23514';
    end if;
    return;
  end if;

  if lines = 0 then
    raise exception 'transaction_needs_category' using errcode = '23514';
  end if;
  if modes > 1 then
    raise exception 'splits_mixed_modes' using errcode = '23514';
  end if;
  if not same_sign or total <> t_amount then
    raise exception 'splits_sum_mismatch' using errcode = '23514';
  end if;
end;
$$;

revoke execute on function public.check_transaction_splits(uuid) from public, anon;
grant execute on function public.check_transaction_splits(uuid) to authenticated;

-- A transfer is one leg out and one leg in, on two accounts, plus at most one fee on the
-- account the money left. Same currency: the legs mirror. Different currencies: each leg
-- holds what really moved (TRX-11).
create function public.check_transfer(transfer uuid)
returns void
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  parts integer;
  outs integer;
  ins integer;
  fees integer;
  out_leg record;
  in_leg record;
begin
  if transfer is null then
    return;
  end if;

  select
    count(*),
    count(*) filter (where t.kind = 'transfer' and t.amount < 0),
    count(*) filter (where t.kind = 'transfer' and t.amount > 0),
    count(*) filter (where t.kind = 'expense')
  into parts, outs, ins, fees
  from public.transactions t
  where t.transfer_id = transfer;

  if parts = 0 then
    return;
  end if;
  if outs <> 1 or ins <> 1 or fees > 1 or parts <> outs + ins + fees then
    raise exception 'transfer_incomplete' using errcode = '23514';
  end if;

  select t.account_id, t.currency, t.amount into out_leg
  from public.transactions t
  where t.transfer_id = transfer and t.kind = 'transfer' and t.amount < 0;
  select t.account_id, t.currency, t.amount into in_leg
  from public.transactions t
  where t.transfer_id = transfer and t.kind = 'transfer' and t.amount > 0;

  if out_leg.account_id = in_leg.account_id then
    raise exception 'transfer_same_account' using errcode = '23514';
  end if;
  if out_leg.currency = in_leg.currency and in_leg.amount <> -out_leg.amount then
    raise exception 'transfer_amounts_differ' using errcode = '23514';
  end if;
  if fees = 1 and not exists (
    select 1 from public.transactions t
    where t.transfer_id = transfer and t.kind = 'expense' and t.account_id = out_leg.account_id
  ) then
    raise exception 'transfer_fee_account' using errcode = '23514';
  end if;
end;
$$;

revoke execute on function public.check_transfer(uuid) from public, anon;
grant execute on function public.check_transfer(uuid) to authenticated;

-- Deferred to commit, so a transaction and its splits, or the parts of a transfer, are
-- written by several statements and checked once (ADR-012).
create function public.on_transaction_changed()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op <> 'DELETE' then
    perform public.check_transaction_splits(new.id);
    perform public.check_transfer(new.transfer_id);
  end if;
  if tg_op <> 'INSERT' and (tg_op = 'DELETE' or old.transfer_id is distinct from new.transfer_id) then
    perform public.check_transfer(old.transfer_id);
  end if;
  return null;
end;
$$;

revoke execute on function public.on_transaction_changed() from public, anon, authenticated;

create constraint trigger transactions_check_parts
  after insert or update or delete on public.transactions
  deferrable initially deferred
  for each row execute function public.on_transaction_changed();

create function public.on_transaction_split_changed()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op <> 'DELETE' then
    perform public.check_transaction_splits(new.transaction_id);
  end if;
  if tg_op <> 'INSERT' and (tg_op = 'DELETE' or old.transaction_id <> new.transaction_id) then
    perform public.check_transaction_splits(old.transaction_id);
  end if;
  return null;
end;
$$;

revoke execute on function public.on_transaction_split_changed() from public, anon, authenticated;

create constraint trigger transaction_splits_check_sum
  after insert or update or delete on public.transaction_splits
  deferrable initially deferred
  for each row execute function public.on_transaction_split_changed();

-- Saves an expense or income with its splits (spec 15). Amounts come in positive and the
-- kind gives the sign. splits is [{category_id, input_mode, input_value}] with one mode;
-- for shares and percentages the last line takes the rounding, so the lines always sum to
-- the amount. Editing replaces the splits. Returns the transaction's id.
create function public.save_transaction(
  transaction_id uuid,
  account_id uuid,
  kind text,
  occurred_on date,
  amount numeric,
  splits jsonb,
  occurred_at_time time default null,
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
    insert into public.transactions (account_id, kind, occurred_on, occurred_at_time, amount, currency,
                                     original_amount, original_currency, status, merchant_id, note)
    values (save_transaction.account_id, save_transaction.kind, save_transaction.occurred_on,
            save_transaction.occurred_at_time, total, account_currency,
            direction * save_transaction.original_amount, save_transaction.original_currency,
            save_transaction.status, save_transaction.merchant_id,
            nullif(trim(save_transaction.note), ''))
    returning id into saved;
  else
    update public.transactions t set
      account_id = save_transaction.account_id,
      kind = save_transaction.kind,
      occurred_on = save_transaction.occurred_on,
      occurred_at_time = save_transaction.occurred_at_time,
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

revoke execute on function public.save_transaction(uuid, uuid, text, date, numeric, jsonb, time, numeric, text, text, uuid, text) from public, anon;
grant execute on function public.save_transaction(uuid, uuid, text, date, numeric, jsonb, time, numeric, text, text, uuid, text) to authenticated;

-- TRX-04: the fee category used last time is remembered on the profile (spec 16).
alter table public.profiles
  add column transfer_fee_category_id uuid,
  add foreign key (user_id, transfer_fee_category_id) references public.categories (user_id, id)
    on delete set null (transfer_fee_category_id);

grant update (transfer_fee_category_id) on public.profiles to authenticated;

-- Saves a transfer's legs and fee under one transfer_id (TRX-04, 11, spec 16). amount
-- left from_account; received arrived in to_account, required when the currencies differ.
-- A fee above zero is an expense on from_account in fee_category, following the
-- departure's status. Editing updates the rows in place. Returns the transfer_id.
create function public.save_transfer(
  transfer_id uuid,
  from_account uuid,
  to_account uuid,
  amount numeric,
  occurred_on date,
  received numeric default null,
  fee numeric default null,
  fee_category uuid default null,
  occurred_at_time time default null,
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
    insert into public.transactions (account_id, kind, occurred_on, occurred_at_time, amount, currency,
                                     status, note, transfer_id)
    values
      (save_transfer.from_account, 'transfer', save_transfer.occurred_on, save_transfer.occurred_at_time,
       -save_transfer.amount, from_currency, from_status, clean_note, saved),
      (save_transfer.to_account, 'transfer', save_transfer.occurred_on, save_transfer.occurred_at_time,
       arrived, to_currency, to_status, clean_note, saved);
  else
    update public.transactions t set
      account_id = save_transfer.from_account,
      occurred_on = save_transfer.occurred_on,
      occurred_at_time = save_transfer.occurred_at_time,
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
      occurred_at_time = save_transfer.occurred_at_time,
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
    insert into public.transactions (account_id, kind, occurred_on, occurred_at_time, amount, currency,
                                     status, transfer_id)
    values (save_transfer.from_account, 'expense', save_transfer.occurred_on, save_transfer.occurred_at_time,
            -save_transfer.fee, from_currency, from_status, saved)
    returning id into fee_id;
  else
    update public.transactions t set
      account_id = save_transfer.from_account,
      occurred_on = save_transfer.occurred_on,
      occurred_at_time = save_transfer.occurred_at_time,
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

revoke execute on function public.save_transfer(uuid, uuid, uuid, numeric, date, numeric, numeric, uuid, time, text, boolean, boolean) from public, anon;
grant execute on function public.save_transfer(uuid, uuid, uuid, numeric, date, numeric, numeric, uuid, time, text, boolean, boolean) to authenticated;

create function public.delete_transfer(transfer_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.transactions t where t.transfer_id = delete_transfer.transfer_id;
  if not found then
    raise exception 'transfer_not_found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.delete_transfer(uuid) from public, anon;
grant execute on function public.delete_transfer(uuid) to authenticated;

-- An account's balance at the end of a day, pending included (spec 16).
create function public.account_balance_on(account_id uuid, on_date date)
returns numeric
language sql
stable
security invoker
set search_path = ''
as $$
  select a.opening_balance + coalesce((
    select sum(t.amount) from public.transactions t
    where t.user_id = a.user_id and t.account_id = a.id and t.occurred_on <= on_date
  ), 0)
  from public.accounts a
  where a.id = account_balance_on.account_id;
$$;

revoke execute on function public.account_balance_on(uuid, date) from public, anon;
grant execute on function public.account_balance_on(uuid, date) to authenticated;

-- TRX-03: the form sends the real balance and the server stores the difference, so a
-- transaction added meanwhile cannot make it wrong. Editing a saved adjustment changes its
-- amount directly. Returns the new transaction's id.
create function public.save_adjustment(
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
  saved uuid;
begin
  select a.currency into account_currency from public.accounts a where a.id = save_adjustment.account_id;
  if not found then
    raise exception 'account_not_found' using errcode = 'P0002';
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
    - public.account_balance_on(save_adjustment.account_id, save_adjustment.occurred_on);
  if gap = 0 then
    raise exception 'balance_already_matches' using errcode = '23514';
  end if;

  insert into public.transactions (account_id, kind, occurred_on, amount, currency, note)
  values (save_adjustment.account_id, 'adjustment', save_adjustment.occurred_on, gap, account_currency,
          nullif(trim(save_adjustment.note), ''))
  returning id into saved;

  return saved;
end;
$$;

revoke execute on function public.save_adjustment(uuid, numeric, date, text) from public, anon;
grant execute on function public.save_adjustment(uuid, numeric, date, text) to authenticated;

-- MER-05: the source's transactions move to the target before the source is deleted.
create or replace function public.merge_merchants(source uuid, target uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if source = target then
    raise exception 'merchant_merge_into_itself' using errcode = '23514';
  end if;
  if not exists (select 1 from public.merchants m where m.id = target) then
    raise exception 'merchant_not_found' using errcode = 'P0002';
  end if;

  update public.transactions t set merchant_id = target where t.merchant_id = source;

  delete from public.merchants m where m.id = source;
  if not found then
    raise exception 'merchant_not_found' using errcode = 'P0002';
  end if;
end;
$$;

-- Balances (ACC-06): the opening balance plus every transaction, pending included, with
-- the pending part on its own. Same columns as before, so institution_totals keeps working.
create or replace view public.account_balances
with (security_invoker = true)
as
select
  a.id as account_id,
  a.currency,
  (a.opening_balance + coalesce(t.total, 0))::numeric(19,4) as balance,
  coalesce(t.pending, 0)::numeric(19,4) as pending,
  p.display_currency,
  round((a.opening_balance + coalesce(t.total, 0))
        * public.exchange_rate(a.currency, p.display_currency, current_date), 4)
    as display_balance
from public.accounts a
join public.profiles p on p.user_id = a.user_id
left join (
  select
    x.user_id,
    x.account_id,
    sum(x.amount) as total,
    sum(x.amount) filter (where x.status = 'pending') as pending
  from public.transactions x
  group by x.user_id, x.account_id
) t on t.user_id = a.user_id and t.account_id = a.id;
