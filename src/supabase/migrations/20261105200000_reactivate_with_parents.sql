-- CAT-03: reactivating a sub-category under an archived parent reactivates that parent
-- too, from the same date, up to the first active ancestor. Their other sub-categories
-- stay archived. Returns how many parents came back with it.
create function public.reactivate_category(category uuid, active_from date)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  ancestor uuid;
  reactivated integer := 0;
begin
  -- Top-down, so the trigger finds each parent active before its child.
  for ancestor in
    with recursive up (id, depth) as (
      select c.parent_id, 1 from public.categories c
      where c.id = category and c.parent_id is not null
      union all
      select c.parent_id, u.depth + 1 from public.categories c
      join up u on c.id = u.id
      where c.parent_id is not null
    )
    select u.id from up u
    where public.category_status(u.id) = 'archived'
    order by u.depth desc
  loop
    insert into public.category_status_events (category_id, status, effective_on)
    values (ancestor, 'active', active_from);
    reactivated := reactivated + 1;
  end loop;

  insert into public.category_status_events (category_id, status, effective_on)
  values (category, 'active', active_from);
  return reactivated;
end;
$$;

revoke execute on function public.reactivate_category(uuid, date) from public, anon;
grant execute on function public.reactivate_category(uuid, date) to authenticated;
