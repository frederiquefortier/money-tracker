-- DSH, spec 22: my_lines summed per month and category, over the whole history, so the
-- dashboard switches between a year and everything without a round trip. Same rules as
-- my_lines (ADR-063); NULL when any line of the month and category misses a rate.
create function public.my_monthly()
returns table (month date, category_id uuid, display_amount text)
language sql
stable
security invoker
set search_path = ''
as $$
  select date_trunc('month', l.occurred_on)::date, l.category_id,
    case when bool_or(l.display_amount is null) then null
      else round(sum(l.display_amount::numeric), 4)::text end
  from public.my_lines() l
  group by 1, 2
  order by 1, 2;
$$;

revoke execute on function public.my_monthly() from public, anon;
grant execute on function public.my_monthly() to authenticated;
