-- EVT-05: each event's total per category over its whole history, from the same lines as
-- event_totals, so the comparison's stacked columns add up to the event's total. Leaf
-- categories: the browser folds them into their top-level group. NULL with a missing rate.
create function public.event_category_totals()
returns table (event_id uuid, category_id uuid, display_total text)
language sql
stable
security invoker
set search_path = ''
as $$
  select l.event_id, l.category_id,
    case when bool_or(l.display_amount is null) then null
      else round(sum(l.display_amount::numeric), 4)::text end
  from public.my_lines() l
  where l.event_id is not null
  group by l.event_id, l.category_id;
$$;

revoke execute on function public.event_category_totals() from public, anon;
grant execute on function public.event_category_totals() to authenticated;
