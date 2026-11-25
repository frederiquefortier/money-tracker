-- The dashboard's category table counts transactions per category and month, as the
-- merchant table does (author, 2026-11-25). Distinct transactions: a split in two lines
-- of one category counts once, and a repayment in the category counts, as the category's
-- transactions list shows it. A new column changes the return type, so drop and create.
drop function public.my_monthly();

create function public.my_monthly()
returns table (
  month date,
  category_id uuid,
  display_amount text,
  transaction_count int
)
language sql
stable
security invoker
set search_path = ''
as $$
  select date_trunc('month', l.occurred_on)::date, l.category_id,
    case when bool_or(l.display_amount is null) then null
      else round(sum(l.display_amount::numeric), 4)::text end,
    count(distinct l.transaction_id)::int
  from public.my_lines() l
  group by 1, 2
  order by 1, 2;
$$;

revoke execute on function public.my_monthly() from public, anon;
grant execute on function public.my_monthly() to authenticated;
