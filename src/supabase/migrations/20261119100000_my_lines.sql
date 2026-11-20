-- DSH-04..09, EVT-04, EVT-05, ADR-063: what the dashboard counts, one row per split, so the
-- browser can total, rank and compare without a round trip per figure.
--
-- Expenses and incomes only: transfer legs and adjustments move money between my own
-- accounts. A transfer fee is an expense and stays in.
--
-- My share (Q5): Moi holds the amount less what others owe back (ADR-052), so an expense
-- counts its amount minus the known owes parts, spread over its splits in proportion. An
-- owes part not known yet counts as mine until its reimbursement sets it.
--
-- An income that repays owed lines counts only what is left once the reimbursements are
-- taken off. The rest stays in the income's category (domain-rules.md), so a roommate
-- paying two months at once lowers that category's spending, and a repayment is never
-- counted on top of the share it repays.
--
-- Converted at the rate of the transaction's date, NULL when a rate is missing so the
-- browser never shows a partial sum (ADR-004). Amounts as text (ADR-023). Null dates mean
-- the whole history.
create function public.my_lines(from_date date default null, to_date date default null)
returns table (
  transaction_id uuid,
  occurred_on date,
  kind text,
  category_id uuid,
  event_id uuid,
  pending boolean,
  owed_open boolean,
  display_amount text
)
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (
    select p.display_currency from public.profiles p where p.user_id = (select auth.uid())
  ),
  picked as (
    select t.id, t.occurred_on, t.kind, t.event_id, t.status, t.amount, t.currency
    from public.transactions t
    where t.kind in ('expense', 'income')
      and (from_date is null or t.occurred_on >= from_date)
      and (to_date is null or t.occurred_on <= to_date)
  ),
  owed as (
    select p.transaction_id,
      coalesce(sum(p.amount), 0) as known,
      bool_or(o.open) as open
    from public.transaction_people p
    join picked t on t.id = p.transaction_id
    left join public.owed_lines o on o.id = p.id
    where p.role = 'owes'
    group by p.transaction_id
  ),
  repaid as (
    select r.income_id, sum(r.amount) as back
    from public.reimbursements r
    join picked t on t.id = r.income_id
    group by r.income_id
  ),
  mine as (
    select t.*,
      case
        when t.kind = 'expense' then t.amount - coalesce(o.known, 0)
        else t.amount - coalesce(r.back, 0)
      end as mine,
      coalesce(o.open, false) as owed_open
    from picked t
    left join owed o on o.transaction_id = t.id
    left join repaid r on r.income_id = t.id
  )
  select m.id, m.occurred_on, m.kind, s.category_id, m.event_id,
    m.status = 'pending', m.owed_open,
    round(
      case when m.amount = 0 then 0 else s.amount * m.mine / m.amount end
      * public.exchange_rate(m.currency, me.display_currency, m.occurred_on),
      4
    )::text
  from mine m
  join public.transaction_splits s on s.transaction_id = m.id
  cross join me
  order by m.occurred_on, m.id, s.category_id;
$$;

revoke execute on function public.my_lines(date, date) from public, anon;
grant execute on function public.my_lines(date, date) to authenticated;

-- EVT-04, EVT-05: each event's total over its whole history, from the same lines, so an
-- event reads the same on the calendar and in the comparison. NULL with a missing rate.
create function public.event_totals()
returns table (event_id uuid, display_total text, transaction_count int)
language sql
stable
security invoker
set search_path = ''
as $$
  select l.event_id,
    case when bool_or(l.display_amount is null) then null
      else round(sum(l.display_amount::numeric), 4)::text end,
    count(distinct l.transaction_id)::int
  from public.my_lines() l
  where l.event_id is not null
  group by l.event_id;
$$;

revoke execute on function public.event_totals() from public, anon;
grant execute on function public.event_totals() to authenticated;
