-- NW-04, ADR-062: the money that went into and came out of each investment, by date, so the
-- hub can show a return over the range that leaves deposits out.
--
-- The same moves as holding_totals: linked expenses and incomes, external contributions,
-- transfers in and out. In is positive, out negative, summed per holding per day and
-- converted to the display currency at that day's rate, as net_worth_series converts the
-- values. NULL when a rate is missing (ADR-004). Future transactions never count. Amounts
-- as text (ADR-023).
create function public.holding_flows()
returns table (on_date date, holding_id uuid, display_amount text)
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (
    select p.display_currency from public.profiles p where p.user_id = (select auth.uid())
  ),
  moves as (
    -- An expense is negative on its account and goes in; an income comes out.
    select t.occurred_on as on_date, t.holding_id, -t.amount as amount, t.currency
    from public.transactions t
    where t.holding_id is not null
      and t.kind in ('expense', 'income')
      and t.occurred_on <= current_date
    union all
    select c.on_date, c.holding_id, c.amount, h.currency
    from public.holding_contributions c
    join public.holdings h on h.user_id = c.user_id and h.id = c.holding_id
    union all
    select f.on_date, f.to_holding_id, f.amount, h.currency
    from public.holding_transfers f
    join public.holdings h on h.user_id = f.user_id and h.id = f.to_holding_id
    union all
    select f.on_date, f.from_holding_id, -f.amount, h.currency
    from public.holding_transfers f
    join public.holdings h on h.user_id = f.user_id and h.id = f.from_holding_id
  ),
  converted as (
    select m.on_date, m.holding_id,
      m.amount * public.exchange_rate(m.currency, me.display_currency, m.on_date) as amount
    from moves m
    join public.holdings h on h.id = m.holding_id and h.kind = 'investment'
    cross join me
  )
  select c.on_date, c.holding_id,
    case when bool_or(c.amount is null) then null else round(sum(c.amount), 4)::text end
  from converted c
  group by c.on_date, c.holding_id
  order by c.on_date, c.holding_id;
$$;

revoke execute on function public.holding_flows() from public, anon;
grant execute on function public.holding_flows() to authenticated;
