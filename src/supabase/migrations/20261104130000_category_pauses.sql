-- CAT-03: a past period a category was archived, added after the fact (the spreadsheet
-- years). The insert trigger only accepts events after the last one, so this function
-- validates the period itself and tells the trigger to let its two events through.

create or replace function public.check_category_status_event()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  last_status text;
  last_on date;
  parent uuid;
begin
  -- Set for this transaction only by add_category_pause, which checks the period itself.
  if current_setting('money.category_pause', true) = 'on' then
    return new;
  end if;

  select e.status, e.effective_on into last_status, last_on
  from public.category_status_events e
  where e.category_id = new.category_id
  order by e.effective_on desc, e.id desc
  limit 1;

  if coalesce(last_status, 'active') = new.status then
    raise exception 'category_already_%', new.status using errcode = '23514';
  end if;
  if new.effective_on < last_on then
    raise exception 'category_event_before_previous' using errcode = '23514';
  end if;

  if new.status = 'active' then
    select c.parent_id into parent from public.categories c where c.id = new.category_id;
    if parent is not null and public.category_status(parent) = 'archived' then
      raise exception 'category_parent_archived' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

-- True when the category is active from the day before `starts` through `ends`, so a
-- pause fits strictly inside one active period and the events keep alternating.
create function public.category_active_through(category uuid, starts date, ends date)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.category_active_periods p
    where p.category_id = category
      and (p.active_from is null or p.active_from < starts)
      and (p.active_to is null or p.active_to > ends)
  );
$$;

revoke execute on function public.category_active_through(uuid, date, date) from public, anon;
grant execute on function public.category_active_through(uuid, date, date) to authenticated;

-- Archived from `archive_from`, active again from `active_from`, both in the past. The
-- branch goes with it, as with archive_category: each sub-category active throughout the
-- period gets the same pause. Returns how many did.
create function public.add_category_pause(category uuid, archive_from date, active_from date)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  parent uuid;
  paused integer;
begin
  if archive_from >= active_from then
    raise exception 'category_pause_order' using errcode = '23514';
  end if;
  if active_from > current_date then
    raise exception 'category_pause_future' using errcode = '23514';
  end if;
  select c.parent_id into parent from public.categories c where c.id = category;
  if not found then
    raise exception 'category_not_found' using errcode = 'P0002';
  end if;
  if not public.category_active_through(category, archive_from, active_from) then
    raise exception 'category_pause_overlaps' using errcode = '23514';
  end if;
  if parent is not null
     and not public.category_active_through(parent, active_from, active_from) then
    raise exception 'category_parent_archived' using errcode = '23514';
  end if;

  perform set_config('money.category_pause', 'on', true);

  insert into public.category_status_events (category_id, status, effective_on)
  values (category, 'archived', archive_from), (category, 'active', active_from);

  with recursive branch (id) as (
    select c.id from public.categories c where c.parent_id = category
    union
    select c.id from public.categories c join branch b on c.parent_id = b.id
  ),
  fits as (
    select b.id from branch b
    where public.category_active_through(b.id, archive_from, active_from)
  ),
  added as (
    insert into public.category_status_events (category_id, status, effective_on)
    select f.id, s.status, s.effective_on
    from fits f
    cross join (values ('archived', archive_from), ('active', active_from)) s (status, effective_on)
    returning category_id
  )
  select count(distinct a.category_id) into paused from added a;

  perform set_config('money.category_pause', '', true);
  return paused;
end;
$$;

revoke execute on function public.add_category_pause(uuid, date, date) from public, anon;
grant execute on function public.add_category_pause(uuid, date, date) to authenticated;
