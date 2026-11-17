-- NW-04, ADR-057: the net worth chart's points, one row per item per date, summed in the
-- browser so leaving items out (NW-05) needs no round trip.
--
-- Dates are every month end from the first data to last month, then today. A row is an
-- account's balance (pending included, as account_balances) or a holding's latest value on
-- or before the date (a debt negative), converted at that date's rate: NULL when a rate is
-- missing, so the browser never shows a partial sum (ADR-004). A closed item still has the
-- month end of its closing, so its line ends where it went: an account at its balance (0
-- after its last transfer out), a holding at 0. A holding with no value yet has no row, as on the hub. Amounts as text
-- (ADR-023).
create function public.net_worth_series()
returns table (on_date date, kind text, item_id uuid, display_value text)
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (
    select p.display_currency from public.profiles p where p.user_id = (select auth.uid())
  ),
  first_day as (
    select least(
      (select min(a.opened_on) from public.accounts a),
      (select min(h.opened_on) from public.holdings h),
      (select min(t.occurred_on) from public.transactions t),
      (select min(s.on_date) from public.holding_snapshots s)
    ) as on_date
  ),
  dates as (
    select (m + interval '1 month - 1 day')::date as on_date
    from first_day f,
      generate_series(
        date_trunc('month', f.on_date),
        date_trunc('month', current_date) - interval '1 month',
        interval '1 month'
      ) m
    union all
    select current_date from first_day f where f.on_date is not null
  ),
  -- Transactions summed by the point they first count in: today for this month up to
  -- today, otherwise their month end. Future ones land after today and never count.
  buckets as (
    select
      t.account_id,
      case
        when t.occurred_on <= current_date
          and t.occurred_on >= date_trunc('month', current_date)::date
        then current_date
        else (date_trunc('month', t.occurred_on) + interval '1 month - 1 day')::date
      end as on_date,
      sum(t.amount) as total,
      min(t.occurred_on) as first_on
    from public.transactions t
    group by 1, 2
  ),
  -- An account imported with history before its opening date starts at its first transaction.
  account_starts as (
    select a.id, a.user_id, a.currency, a.opening_balance, a.closed_on,
      least(a.opened_on, (select min(b.first_on) from buckets b where b.account_id = a.id))
        as starts_on
    from public.accounts a
  ),
  account_points as (
    select d.on_date, a.id, a.currency,
      a.opening_balance + coalesce(sum(b.total), 0) as value
    from dates d
    join account_starts a
      on a.starts_on <= d.on_date
      and (a.closed_on is null
        or d.on_date <= (date_trunc('month', a.closed_on) + interval '1 month - 1 day')::date)
    left join buckets b on b.account_id = a.id and b.on_date <= d.on_date
    group by d.on_date, a.id, a.currency, a.opening_balance
  ),
  holding_points as (
    select d.on_date, h.id, h.kind, h.currency,
      case
        when d.on_date >= h.closed_on then 0
        when h.kind = 'debt' then -s.amount
        else s.amount
      end as value
    from dates d
    join public.holdings h
      on h.closed_on is null
      or d.on_date <= (date_trunc('month', h.closed_on) + interval '1 month - 1 day')::date
    join lateral (
      select s.amount from public.holding_snapshots s
      where s.user_id = h.user_id and s.holding_id = h.id and s.on_date <= d.on_date
      order by s.on_date desc
      limit 1
    ) s on true
  )
  select x.on_date, x.kind, x.id,
    round(x.value * public.exchange_rate(x.currency, me.display_currency, x.on_date), 4)::text
  from (
    select on_date, 'account' as kind, id, currency, value from account_points
    union all
    select on_date, kind, id, currency, value from holding_points
  ) x
  cross join me
  order by x.on_date, x.kind, x.id;
$$;

revoke execute on function public.net_worth_series() from public, anon;
grant execute on function public.net_worth_series() to authenticated;
