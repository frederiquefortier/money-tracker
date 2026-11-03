-- Categories, their archive history and the periods they are active in (CAT-01..07,
-- spec 12). exclude_from_emergency_fund comes with CAT-08 (phase 2).

create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  parent_id     uuid,
  name          text not null check (length(trim(name)) between 1 and 100),
  kind          text not null default 'expense' check (kind in ('expense', 'income', 'investment')),
  icon          text not null default 'tag' check (icon ~ '^[a-z0-9-]{1,60}$'),
  icon_is_auto  boolean not null default true,
  color         text not null check (color ~ '^#[0-9a-f]{6}$'),
  color_is_auto boolean not null default false,
  is_favourite  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, id),
  foreign key (user_id, parent_id) references public.categories (user_id, id)
);

-- Unique among siblings, ignoring case: two "Autres" under different parents is fine,
-- and so is one at the top of each kind.
create unique index categories_user_sibling_name_key
  on public.categories (user_id, kind, parent_id, lower(name)) nulls not distinct;
create index categories_user_parent_idx on public.categories (user_id, parent_id);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
revoke all on public.categories from anon, authenticated;
grant select, delete on public.categories to authenticated;
grant insert (parent_id, name, kind, icon, icon_is_auto, color, color_is_auto, is_favourite),
      update (parent_id, name, kind, icon, icon_is_auto, color, color_is_auto, is_favourite)
  on public.categories to authenticated;

create policy "categories: read own"
  on public.categories for select to authenticated
  using (user_id = (select auth.uid()));

create policy "categories: insert own"
  on public.categories for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "categories: update own"
  on public.categories for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "categories: delete own"
  on public.categories for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "categories: mfa required"
  on public.categories as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- No loops at any depth, and a sub-category has its parent's kind (CAT-01, 02).
create function public.check_category_parent()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  parent_kind text;
begin
  if new.parent_id is null then
    return new;
  end if;

  -- A parent this user cannot see is left to the foreign key.
  select c.kind into parent_kind from public.categories c where c.id = new.parent_id;
  if found and parent_kind <> new.kind then
    raise exception 'category_kind_differs_from_parent' using errcode = '23514';
  end if;

  if exists (
    with recursive ancestors (id, parent_id) as (
      select c.id, c.parent_id from public.categories c where c.id = new.parent_id
      union
      select c.id, c.parent_id from public.categories c join ancestors a on c.id = a.parent_id
    )
    select 1 from ancestors where id = new.id
  ) then
    raise exception 'category_cycle' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function public.check_category_parent() from public, anon, authenticated;

create trigger categories_check_parent
  before insert or update of parent_id, kind on public.categories
  for each row execute function public.check_category_parent();

-- Changing a top-level category's kind carries its branch along; each child's own update
-- fires this again for its children.
create function public.cascade_category_kind()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.categories c set kind = new.kind
  where c.user_id = new.user_id and c.parent_id = new.id and c.kind <> new.kind;
  return null;
end;
$$;

revoke execute on function public.cascade_category_kind() from public, anon, authenticated;

create trigger categories_cascade_kind
  after update of kind on public.categories
  for each row when (old.kind is distinct from new.kind)
  execute function public.cascade_category_kind();

-- Archive history (CAT-03). Append-only: no update or delete grant. A category with no
-- events is active; events alternate, starting with an archive.
create table public.category_status_events (
  id           bigint generated always as identity primary key,
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  category_id  uuid not null,
  status       text not null check (status in ('archived', 'active')),
  effective_on date not null,
  created_at   timestamptz not null default now(),
  foreign key (user_id, category_id) references public.categories (user_id, id) on delete cascade
);

create index category_status_events_category_idx
  on public.category_status_events (user_id, category_id, effective_on, id);

alter table public.category_status_events enable row level security;
revoke all on public.category_status_events from anon, authenticated;
grant select on public.category_status_events to authenticated;
grant insert (category_id, status, effective_on) on public.category_status_events to authenticated;

create policy "category_status_events: read own"
  on public.category_status_events for select to authenticated
  using (user_id = (select auth.uid()));

create policy "category_status_events: insert own"
  on public.category_status_events for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "category_status_events: mfa required"
  on public.category_status_events as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- The status a category ends up in after all its events.
create function public.category_status(category uuid)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((
    select e.status from public.category_status_events e
    where e.category_id = category
    order by e.effective_on desc, e.id desc
    limit 1
  ), 'active');
$$;

revoke execute on function public.category_status(uuid) from public, anon;
grant execute on function public.category_status(uuid) to authenticated;

-- Events alternate and never go back in time, and a sub-category cannot be reactivated
-- while its parent is archived (spec 12).
create function public.check_category_status_event()
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

revoke execute on function public.check_category_status_event() from public, anon, authenticated;

create trigger category_status_events_check
  before insert on public.category_status_events
  for each row execute function public.check_category_status_event();

-- Archiving a parent archives its whole branch from the same date (spec 12). Returns how
-- many sub-categories went with it. Already archived ones keep their own date.
create function public.archive_category(category uuid, archive_from date)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  archived integer;
begin
  insert into public.category_status_events (category_id, status, effective_on)
  values (category, 'archived', archive_from);

  with recursive branch (id) as (
    select c.id from public.categories c where c.parent_id = category
    union
    select c.id from public.categories c join branch b on c.parent_id = b.id
  )
  insert into public.category_status_events (category_id, status, effective_on)
  select b.id, 'archived', archive_from from branch b
  where public.category_status(b.id) = 'active';

  get diagnostics archived = row_count;
  return archived;
end;
$$;

revoke execute on function public.archive_category(uuid, date) from public, anon;
grant execute on function public.archive_category(uuid, date) to authenticated;

-- Periods [active_from, active_to) a category can be picked in (CAT-04) and is charted in
-- (DSH-03). Null bounds are open. A category with no events has one open period.
create view public.category_active_periods
with (security_invoker = true)
as
with ordered as (
  select
    e.category_id,
    e.status,
    e.effective_on,
    row_number() over w as n,
    lead(e.effective_on) over w as next_on
  from public.category_status_events e
  window w as (partition by e.category_id order by e.effective_on, e.id)
)
select c.id as category_id, null::date as active_from, o.effective_on as active_to
from public.categories c
left join ordered o on o.category_id = c.id and o.n = 1
union all
select o.category_id, o.effective_on, o.next_on
from ordered o
where o.status = 'active';

revoke all on public.category_active_periods from anon, authenticated;
grant select on public.category_active_periods to authenticated;
