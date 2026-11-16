-- ADR-056: an event follows the default list of skipped categories until its own list is
-- set, and an own list may be empty (every default category unticked). Before, an empty
-- list fell back to the default, so the defaults could not all be unticked.

alter table public.events
  add column skips_own boolean not null default false;

update public.events e set skips_own = true
where exists (select 1 from public.event_skips s where s.event_id = e.id);

grant insert (skips_own), update (skips_own) on public.events to authenticated;

create or replace function public.event_skips_categories(event uuid, category_ids uuid[])
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive chosen as (
    select s.category_id as id from public.event_skips s
    join public.events e on e.id = s.event_id
    where s.event_id = event_skips_categories.event and e.skips_own
    union all
    select d.category_id from public.event_default_skips d
    where not exists (
      select 1 from public.events e where e.id = event_skips_categories.event and e.skips_own
    )
  ),
  skipped as (
    select id from chosen
    union
    select c.id from public.categories c join skipped k on c.parent_id = k.id
  )
  select coalesce(cardinality(event_skips_categories.category_ids), 0) > 0
    and not exists (
      select 1 from unnest(event_skips_categories.category_ids) x(id)
      where x.id not in (select id from skipped)
    );
$$;

drop function public.save_event(uuid, text, uuid, date, date, uuid[], boolean, uuid[]);

-- skip_category_ids null follows the default list; an array, even empty, is the event's own.
create function public.save_event(
  event_id uuid,
  name text,
  type_id uuid,
  starts_on date,
  ends_on date,
  person_ids uuid[],
  auto_link boolean default true,
  skip_category_ids uuid[] default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved uuid := save_event.event_id;
  old_start date;
  old_end date;
  own boolean := save_event.skip_category_ids is not null;
begin
  if saved is null then
    insert into public.events (name, type_id, starts_on, ends_on, auto_link, skips_own)
    values (trim(save_event.name), save_event.type_id, save_event.starts_on, save_event.ends_on,
            save_event.auto_link, own)
    returning id into saved;
  else
    select public.event_first_day(e.starts_on, e.ends_on), public.event_last_day(e.starts_on, e.ends_on)
    into old_start, old_end
    from public.events e where e.id = saved;
    update public.events e
    set name = trim(save_event.name), type_id = save_event.type_id,
        starts_on = save_event.starts_on, ends_on = save_event.ends_on,
        auto_link = save_event.auto_link, skips_own = own
    where e.id = saved;
    if not found then
      raise exception 'event_not_found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.event_people p where p.event_id = saved;
  insert into public.event_people (event_id, person_id)
  select distinct saved, p from unnest(save_event.person_ids) p;

  delete from public.event_skips s where s.event_id = saved;
  insert into public.event_skips (event_id, category_id)
  select distinct saved, c from unnest(coalesce(save_event.skip_category_ids, '{}')) c;

  perform public.relink_events(
    least(public.event_first_day(save_event.starts_on, save_event.ends_on),
          coalesce(old_start, public.event_first_day(save_event.starts_on, save_event.ends_on))),
    greatest(public.event_last_day(save_event.starts_on, save_event.ends_on),
             coalesce(old_end, public.event_last_day(save_event.starts_on, save_event.ends_on))));
  return saved;
end;
$$;

revoke execute on function public.save_event(uuid, text, uuid, date, date, uuid[], boolean, uuid[]) from public, anon;
grant execute on function public.save_event(uuid, text, uuid, date, date, uuid[], boolean, uuid[]) to authenticated;
