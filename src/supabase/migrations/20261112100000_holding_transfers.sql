-- NW-03: money moved from one holding to another on a date, as when an account closes at
-- one institution and its money goes to another. History stays where it is: the transfer is
-- a withdrawal from the source and a contribution into the target. Both are investments in
-- the same currency, so one amount serves both sides. A holding with a transfer can only be
-- archived (the foreign keys refuse a delete).
create table public.holding_transfers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users on delete cascade,
  from_holding_id uuid not null,
  to_holding_id   uuid not null,
  on_date         date not null,
  amount          numeric(19,4) not null check (amount > 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, id),
  check (from_holding_id <> to_holding_id),
  foreign key (user_id, from_holding_id) references public.holdings (user_id, id),
  foreign key (user_id, to_holding_id) references public.holdings (user_id, id)
);

create index holding_transfers_user_from_idx on public.holding_transfers (user_id, from_holding_id);
create index holding_transfers_user_to_idx on public.holding_transfers (user_id, to_holding_id);

create trigger holding_transfers_set_updated_at
  before update on public.holding_transfers
  for each row execute function public.set_updated_at();

alter table public.holding_transfers enable row level security;

revoke all on public.holding_transfers from anon, authenticated;
grant select, delete on public.holding_transfers to authenticated;
grant insert (from_holding_id, to_holding_id, on_date, amount),
      update (from_holding_id, to_holding_id, on_date, amount)
  on public.holding_transfers to authenticated;

create policy "holding_transfers: read own"
  on public.holding_transfers for select to authenticated using (user_id = (select auth.uid()));
create policy "holding_transfers: insert own"
  on public.holding_transfers for insert to authenticated with check (user_id = (select auth.uid()));
create policy "holding_transfers: update own"
  on public.holding_transfers for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "holding_transfers: delete own"
  on public.holding_transfers for delete to authenticated using (user_id = (select auth.uid()));
create policy "holding_transfers: mfa required"
  on public.holding_transfers as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- Both sides are investments in one currency, the amount is no finer than its cents, and
-- neither holding is closed before the date.
create function public.check_holding_transfer()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  a record;
  b record;
begin
  select x.kind, x.currency, x.closed_on into a
  from public.holdings x where x.user_id = new.user_id and x.id = new.from_holding_id;
  select x.kind, x.currency, x.closed_on into b
  from public.holdings x where x.user_id = new.user_id and x.id = new.to_holding_id;

  if a.kind <> 'investment' or b.kind <> 'investment' then
    raise exception 'holding_transfer_kind' using errcode = '23514';
  end if;
  if a.currency <> b.currency then
    raise exception 'holding_transfer_currency' using errcode = '23514';
  end if;
  if exists (
    select 1 from public.currencies c
    where c.code = a.currency and new.amount <> round(new.amount, c.minor_units)
  ) then
    raise exception 'amount_precision' using errcode = '23514';
  end if;
  if (a.closed_on is not null and new.on_date > a.closed_on)
     or (b.closed_on is not null and new.on_date > b.closed_on) then
    raise exception 'holding_closed' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.check_holding_transfer() from public, anon, authenticated;

create trigger holding_transfers_check
  before insert or update of from_holding_id, to_holding_id, on_date, amount on public.holding_transfers
  for each row execute function public.check_holding_transfer();

-- The currency is fixed and a closing date cannot come before the last thing recorded,
-- transfers included.
create or replace function public.check_holding()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  last_entry date;
begin
  if tg_op = 'UPDATE' then
    if new.currency <> old.currency and (
      exists (select 1 from public.holding_snapshots s where s.holding_id = new.id)
      or exists (select 1 from public.holding_contributions c where c.holding_id = new.id)
      or exists (select 1 from public.transactions t where t.holding_id = new.id)
      or exists (select 1 from public.holding_transfers f
                 where f.from_holding_id = new.id or f.to_holding_id = new.id)
    ) then
      raise exception 'holding_currency_locked' using errcode = '23514';
    end if;
  end if;

  if new.closed_on is not null then
    select max(d) into last_entry from (
      select max(s.on_date) as d from public.holding_snapshots s where s.holding_id = new.id
      union all
      select max(c.on_date) from public.holding_contributions c where c.holding_id = new.id
      union all
      select max(t.occurred_on) from public.transactions t where t.holding_id = new.id
      union all
      select max(f.on_date) from public.holding_transfers f
      where f.from_holding_id = new.id or f.to_holding_id = new.id
    ) x;
    if last_entry > new.closed_on then
      raise exception 'holding_closed_before_entry' using errcode = '23514';
    end if;
  else
    if exists (
      select 1 from public.user_currencies uc
      where uc.user_id = new.user_id and uc.code = new.currency and uc.removed_at is not null
    ) then
      raise exception 'currency_removed' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

-- Placed is the money that went in: the linked expenses, each converted to the holding's
-- currency at its own date, the external contributions and the transfers in. It never goes
-- down. Withdrawn is the money that came out: the linked incomes and the transfers out.
-- Profit is the latest value plus withdrawn minus placed, and the percent is over placed.
-- Any figure is null, never zero or partial, when a rate is missing or there is no value yet
-- (ADR-004, ADR-049). `withdrawn` comes last: a replaced view keeps its columns in order.
create or replace view public.holding_totals
with (security_invoker = true)
as
with moves as (
  select h.user_id, h.id as holding_id,
         case when t.kind = 'expense'
              then -t.amount * public.exchange_rate(t.currency, h.currency, t.occurred_on)
              else 0 end as put_in,
         case when t.kind = 'income'
              then t.amount * public.exchange_rate(t.currency, h.currency, t.occurred_on)
              else 0 end as taken_out
  from public.holdings h
  join public.transactions t on t.user_id = h.user_id and t.holding_id = h.id
  union all
  select c.user_id, c.holding_id, c.amount, 0
  from public.holding_contributions c
  union all
  select f.user_id, f.to_holding_id, f.amount, 0
  from public.holding_transfers f
  union all
  select f.user_id, f.from_holding_id, 0, f.amount
  from public.holding_transfers f
),
sums as (
  select m.user_id, m.holding_id,
         case when bool_or(m.put_in is null) then null else round(sum(m.put_in), 4) end as put_in,
         case when bool_or(m.taken_out is null) then null else round(sum(m.taken_out), 4) end as taken_out
  from moves m
  group by m.user_id, m.holding_id
),
latest as (
  select distinct on (s.user_id, s.holding_id) s.user_id, s.holding_id, s.on_date, s.amount
  from public.holding_snapshots s
  order by s.user_id, s.holding_id, s.on_date desc
)
select
  h.id as holding_id,
  h.currency,
  case when m.holding_id is null then 0::numeric(19,4) else m.put_in::numeric(19,4) end as placed,
  l.on_date as latest_on,
  l.amount as latest_value,
  case when l.amount is null
         or (m.holding_id is not null and (m.put_in is null or m.taken_out is null)) then null
       else (l.amount + coalesce(m.taken_out, 0) - coalesce(m.put_in, 0))::numeric(19,4) end as profit,
  case when l.amount is null or m.put_in is null or m.taken_out is null or m.put_in <= 0 then null
       else round((l.amount + m.taken_out - m.put_in) / m.put_in * 100, 4) end as profit_percent,
  pr.display_currency,
  round(l.amount * public.exchange_rate(h.currency, pr.display_currency, current_date), 4)
    as display_value,
  case when m.holding_id is null then 0::numeric(19,4) else m.taken_out::numeric(19,4) end as withdrawn
from public.holdings h
join public.profiles pr on pr.user_id = h.user_id
left join sums m on m.user_id = h.user_id and m.holding_id = h.id
left join latest l on l.user_id = h.user_id and l.holding_id = h.id;
