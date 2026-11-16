-- EVT-07: the automatic link by date skips some categories (Sauf), as a salary or a phone
-- bill inside a trip's dates. One default list for every event, and an event's own list,
-- which replaces the default when it has any category. A skipped category takes its
-- sub-categories. A transaction is skipped only when every split is in a skipped category.

create table public.event_default_skips (
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  category_id uuid not null,
  primary key (user_id, category_id),
  foreign key (user_id, category_id) references public.categories (user_id, id) on delete cascade
);

create table public.event_skips (
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  event_id    uuid not null,
  category_id uuid not null,
  primary key (event_id, category_id),
  foreign key (user_id, event_id) references public.events (user_id, id) on delete cascade,
  foreign key (user_id, category_id) references public.categories (user_id, id) on delete cascade
);

create index event_skips_user_category_idx on public.event_skips (user_id, category_id);

alter table public.event_default_skips enable row level security;
alter table public.event_skips enable row level security;

revoke all on public.event_default_skips, public.event_skips from anon, authenticated;
grant select, delete on public.event_default_skips, public.event_skips to authenticated;
grant insert (category_id) on public.event_default_skips to authenticated;
grant insert (event_id, category_id) on public.event_skips to authenticated;

create policy "event_default_skips: read own"
  on public.event_default_skips for select to authenticated using (user_id = (select auth.uid()));
create policy "event_default_skips: insert own"
  on public.event_default_skips for insert to authenticated with check (user_id = (select auth.uid()));
create policy "event_default_skips: delete own"
  on public.event_default_skips for delete to authenticated using (user_id = (select auth.uid()));
create policy "event_default_skips: mfa required"
  on public.event_default_skips as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

create policy "event_skips: read own"
  on public.event_skips for select to authenticated using (user_id = (select auth.uid()));
create policy "event_skips: insert own"
  on public.event_skips for insert to authenticated with check (user_id = (select auth.uid()));
create policy "event_skips: delete own"
  on public.event_skips for delete to authenticated using (user_id = (select auth.uid()));
create policy "event_skips: mfa required"
  on public.event_skips as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- Whether the event's link skips these categories: the event's own list, or the default
-- when it has none, each with its sub-categories. No category skips nothing.
create function public.event_skips_categories(event uuid, category_ids uuid[])
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive own as (
    select s.category_id as id from public.event_skips s
    where s.event_id = event_skips_categories.event
  ),
  chosen as (
    select id from own
    union all
    select d.category_id from public.event_default_skips d where not exists (select 1 from own)
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

drop function public.matching_event(date, text, uuid, boolean);

-- category_ids are the form's splits before a save; without them the saved splits count.
create function public.matching_event(
  on_date date,
  tx_kind text,
  for_transaction uuid default null,
  ignore_exclusions boolean default false,
  category_ids uuid[] default null
)
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select e.id
  from public.events e
  where matching_event.tx_kind in ('expense', 'income')
    and e.auto_link
    and (e.starts_on is not null or e.ends_on is not null)
    and matching_event.on_date
      between public.event_first_day(e.starts_on, e.ends_on) and public.event_last_day(e.starts_on, e.ends_on)
    and (matching_event.ignore_exclusions or not exists (
      select 1 from public.event_exclusions x
      where x.event_id = e.id and x.transaction_id = matching_event.for_transaction
    ))
    and not public.event_skips_categories(e.id, coalesce(
      matching_event.category_ids,
      array(select s.category_id from public.transaction_splits s
            where s.transaction_id = matching_event.for_transaction)))
  order by case when e.starts_on is null then 1000000
                else coalesce(e.ends_on, e.starts_on) - e.starts_on end,
           e.created_at, e.id
  limit 1;
$$;

drop function public.save_event(uuid, text, uuid, date, date, uuid[], boolean);

create function public.save_event(
  event_id uuid,
  name text,
  type_id uuid,
  starts_on date,
  ends_on date,
  person_ids uuid[],
  auto_link boolean default true,
  skip_category_ids uuid[] default '{}'
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
begin
  if saved is null then
    insert into public.events (name, type_id, starts_on, ends_on, auto_link)
    values (trim(save_event.name), save_event.type_id, save_event.starts_on, save_event.ends_on,
            save_event.auto_link)
    returning id into saved;
  else
    select public.event_first_day(e.starts_on, e.ends_on), public.event_last_day(e.starts_on, e.ends_on)
    into old_start, old_end
    from public.events e where e.id = saved;
    update public.events e
    set name = trim(save_event.name), type_id = save_event.type_id,
        starts_on = save_event.starts_on, ends_on = save_event.ends_on,
        auto_link = save_event.auto_link
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
  select distinct saved, c from unnest(save_event.skip_category_ids) c;

  perform public.relink_events(
    least(public.event_first_day(save_event.starts_on, save_event.ends_on),
          coalesce(old_start, public.event_first_day(save_event.starts_on, save_event.ends_on))),
    greatest(public.event_last_day(save_event.starts_on, save_event.ends_on),
             coalesce(old_end, public.event_last_day(save_event.starts_on, save_event.ends_on))));
  return saved;
end;
$$;

-- The default list, then every automatic link computed again.
create function public.save_event_default_skips(category_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.event_default_skips d where d.user_id = (select auth.uid());
  insert into public.event_default_skips (category_id)
  select distinct c from unnest(save_event_default_skips.category_ids) c;
  perform public.relink_events('-infinity', 'infinity');
end;
$$;

revoke execute on function public.event_skips_categories(uuid, uuid[]) from public, anon;
grant execute on function public.event_skips_categories(uuid, uuid[]) to authenticated;
revoke execute on function public.matching_event(date, text, uuid, boolean, uuid[]) from public, anon;
grant execute on function public.matching_event(date, text, uuid, boolean, uuid[]) to authenticated;
revoke execute on function public.save_event(uuid, text, uuid, date, date, uuid[], boolean, uuid[]) from public, anon;
grant execute on function public.save_event(uuid, text, uuid, date, date, uuid[], boolean, uuid[]) to authenticated;
revoke execute on function public.save_event_default_skips(uuid[]) from public, anon;
grant execute on function public.save_event_default_skips(uuid[]) to authenticated;
