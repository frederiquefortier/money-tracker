-- MER-04, ADR-064: a merchant's bills at my share, as every other dashboard figure
-- (author, 2026-11-20, replacing the full bill of 20261120100000). Each expense's
-- my_lines are summed back into one bill, so a shared dinner counts what I paid.
--
-- Expenses with a merchant only. NULL figures when any bill of the month misses a rate,
-- so the browser never shows a partial sum (ADR-004). Amounts as text, positive (ADR-023).
create or replace function public.merchant_monthly()
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
  with bills as (
    select date_trunc('month', l.occurred_on)::date as month, t.merchant_id,
      case when bool_or(l.display_amount is null) then null
        else -sum(l.display_amount::numeric) end as bill
    from public.my_lines() l
    join public.transactions t on t.id = l.transaction_id
    where l.kind = 'expense' and t.merchant_id is not null
    group by l.transaction_id, 1, 2
  )
  select b.month, b.merchant_id, count(*)::int,
    case when bool_or(b.bill is null) then null else round(sum(b.bill), 4)::text end,
    case when bool_or(b.bill is null) then null else round(min(b.bill), 4)::text end,
    case when bool_or(b.bill is null) then null else round(max(b.bill), 4)::text end
  from bills b
  group by 1, 2
  order by 1, 2;
$$;
