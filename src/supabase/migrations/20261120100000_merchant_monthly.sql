-- MER-04, ADR-064: each merchant's bills per month, so the dashboard can show the average
-- bill and how it changed. The full bill, never my share: a dinner paid for four is still
-- that restaurant's price, and DSH-05's share would read it as a price drop.
--
-- Expenses with a merchant only. Converted at the rate of the transaction's date; the
-- figures are NULL when any bill of the month misses a rate, so the browser never shows a
-- partial sum (ADR-004). Amounts as text, positive (ADR-023).
create function public.merchant_monthly()
returns table (
  month date,
  merchant_id uuid,
  visits int,
  display_total text,
  display_min text,
  display_max text
)
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (
    select p.display_currency from public.profiles p where p.user_id = (select auth.uid())
  ),
  bills as (
    select date_trunc('month', t.occurred_on)::date as month, t.merchant_id,
      -t.amount * public.exchange_rate(t.currency, me.display_currency, t.occurred_on) as bill
    from public.transactions t
    cross join me
    where t.kind = 'expense' and t.merchant_id is not null
  )
  select b.month, b.merchant_id, count(*)::int,
    case when bool_or(b.bill is null) then null else round(sum(b.bill), 4)::text end,
    case when bool_or(b.bill is null) then null else round(min(b.bill), 4)::text end,
    case when bool_or(b.bill is null) then null else round(max(b.bill), 4)::text end
  from bills b
  group by 1, 2
  order by 1, 2;
$$;

revoke execute on function public.merchant_monthly() from public, anon;
grant execute on function public.merchant_monthly() to authenticated;
