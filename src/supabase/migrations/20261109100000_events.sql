-- Events (EVT-01..03, 07, spec 22): an occasion with a date range, an optional type,
-- people and categories. A transaction carries one event, linked by hand or by the rule
-- below. Only expenses and incomes link, never transfers or adjustments.

create table public.event_types (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null check (length(trim(name)) between 1 and 100),
  icon       text not null default 'calendar' check (length(icon) between 1 and 60),
  color      text not null check (color ~ '^#[0-9a-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create table public.events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  type_id    uuid,
  name       text not null check (length(trim(name)) between 1 and 100),
  starts_on  date not null,
  -- Null for a one-day event.
  ends_on    date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  check (ends_on is null or ends_on >= starts_on),
  -- A deleted type leaves its events without one.
  foreign key (user_id, type_id) references public.event_types (user_id, id)
    on delete set null (type_id)
);

create table public.event_people (
  user_id   uuid not null default auth.uid() references auth.users on delete cascade,
  event_id  uuid not null,
  person_id uuid not null,
  primary key (event_id, person_id),
  foreign key (user_id, event_id) references public.events (user_id, id) on delete cascade,
  foreign key (user_id, person_id) references public.people (user_id, id) on delete cascade
);

-- No included row means every category; an excluded row is the Sauf field.
create table public.event_categories (
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  event_id    uuid not null,
  category_id uuid not null,
  excluded    boolean not null default false,
  primary key (event_id, category_id),
  foreign key (user_id, event_id) references public.events (user_id, id) on delete cascade,
  foreign key (user_id, category_id) references public.categories (user_id, id) on delete cascade
);

-- An automatic link removed by hand, so no recompute puts it back.
create table public.event_exclusions (
  user_id        uuid not null default auth.uid() references auth.users on delete cascade,
  event_id       uuid not null,
  transaction_id uuid not null,
  primary key (event_id, transaction_id),
  foreign key (user_id, event_id) references public.events (user_id, id) on delete cascade,
  foreign key (user_id, transaction_id) references public.transactions (user_id, id) on delete cascade
);

-- event_source is read only while event_id is set.
alter table public.transactions
  add column event_id uuid,
  add column event_source text check (event_source in ('manual', 'auto')),
  add constraint transactions_event_kind_check check (event_id is null or kind in ('expense', 'income')),
  add constraint transactions_event_fk foreign key (user_id, event_id)
    references public.events (user_id, id) on delete set null (event_id);

create unique index event_types_user_name_key on public.event_types (user_id, public.fold_name(name));
create index events_user_dates_idx on public.events (user_id, starts_on);
create index events_user_type_idx on public.events (user_id, type_id) where type_id is not null;
create index event_people_user_person_idx on public.event_people (user_id, person_id);
create index event_categories_user_category_idx on public.event_categories (user_id, category_id);
create index event_exclusions_user_transaction_idx on public.event_exclusions (user_id, transaction_id);
create index transactions_user_event_idx
  on public.transactions (user_id, event_id) where event_id is not null;

create trigger event_types_set_updated_at
  before update on public.event_types
  for each row execute function public.set_updated_at();
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.event_types enable row level security;
alter table public.events enable row level security;
alter table public.event_people enable row level security;
alter table public.event_categories enable row level security;
alter table public.event_exclusions enable row level security;

revoke all on public.event_types, public.events, public.event_people,
  public.event_categories, public.event_exclusions from anon, authenticated;
grant select, delete on public.event_types, public.events to authenticated;
grant insert (name, icon, color), update (name, icon, color) on public.event_types to authenticated;
grant insert (type_id, name, starts_on, ends_on), update (type_id, name, starts_on, ends_on)
  on public.events to authenticated;
grant select, delete on public.event_people, public.event_categories, public.event_exclusions
  to authenticated;
grant insert (event_id, person_id) on public.event_people to authenticated;
grant insert (event_id, category_id, excluded) on public.event_categories to authenticated;
grant insert (event_id, transaction_id) on public.event_exclusions to authenticated;
grant update (event_id, event_source) on public.transactions to authenticated;

create policy "event_types: read own"
  on public.event_types for select to authenticated using (user_id = (select auth.uid()));
create policy "event_types: insert own"
  on public.event_types for insert to authenticated with check (user_id = (select auth.uid()));
create policy "event_types: update own"
  on public.event_types for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "event_types: delete own"
  on public.event_types for delete to authenticated using (user_id = (select auth.uid()));
create policy "event_types: mfa required"
  on public.event_types as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

create policy "events: read own"
  on public.events for select to authenticated using (user_id = (select auth.uid()));
create policy "events: insert own"
  on public.events for insert to authenticated with check (user_id = (select auth.uid()));
create policy "events: update own"
  on public.events for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "events: delete own"
  on public.events for delete to authenticated using (user_id = (select auth.uid()));
create policy "events: mfa required"
  on public.events as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

create policy "event_people: read own"
  on public.event_people for select to authenticated using (user_id = (select auth.uid()));
create policy "event_people: insert own"
  on public.event_people for insert to authenticated with check (user_id = (select auth.uid()));
create policy "event_people: delete own"
  on public.event_people for delete to authenticated using (user_id = (select auth.uid()));
create policy "event_people: mfa required"
  on public.event_people as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

create policy "event_categories: read own"
  on public.event_categories for select to authenticated using (user_id = (select auth.uid()));
create policy "event_categories: insert own"
  on public.event_categories for insert to authenticated with check (user_id = (select auth.uid()));
create policy "event_categories: delete own"
  on public.event_categories for delete to authenticated using (user_id = (select auth.uid()));
create policy "event_categories: mfa required"
  on public.event_categories as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

create policy "event_exclusions: read own"
  on public.event_exclusions for select to authenticated using (user_id = (select auth.uid()));
create policy "event_exclusions: insert own"
  on public.event_exclusions for insert to authenticated with check (user_id = (select auth.uid()));
create policy "event_exclusions: delete own"
  on public.event_exclusions for delete to authenticated using (user_id = (select auth.uid()));
create policy "event_exclusions: mfa required"
  on public.event_exclusions as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- Whether an event takes a category: the nearest rule up the category's own branch wins
-- (a sub-category ticked under an excluded parent is in, the reverse is out). With no rule
-- on the branch the category is in only when the event ticks nothing at all.
create function public.event_takes_category(event uuid, category uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive branch as (
    select c.id, c.parent_id, 0 as depth from public.categories c where c.id = event_takes_category.category
    union all
    select p.id, p.parent_id, b.depth + 1 from public.categories p join branch b on p.id = b.parent_id
  )
  select coalesce(
    (select not ec.excluded
     from public.event_categories ec join branch b on b.id = ec.category_id
     where ec.event_id = event_takes_category.event
     order by b.depth limit 1),
    not exists (
      select 1 from public.event_categories ec
      where ec.event_id = event_takes_category.event and not ec.excluded
    )
  );
$$;

-- The event a transaction links to by the rule (EVT-07): in the date range, a split in a
-- taken category, not removed by hand. The narrower range wins, then the earlier created.
create function public.matching_event(
  on_date date,
  tx_kind text,
  category_ids uuid[],
  for_transaction uuid default null,
  ignore_exclusions boolean default false
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
    and matching_event.on_date between e.starts_on and coalesce(e.ends_on, e.starts_on)
    and (matching_event.ignore_exclusions or not exists (
      select 1 from public.event_exclusions x
      where x.event_id = e.id and x.transaction_id = matching_event.for_transaction
    ))
    and exists (
      select 1 from unnest(matching_event.category_ids) c
      where public.event_takes_category(e.id, c)
    )
  order by coalesce(e.ends_on, e.starts_on) - e.starts_on, e.created_at, e.id
  limit 1;
$$;

-- Puts the rule back on the automatic and unlinked transactions of a date window; a
-- manual link is never touched.
create function public.relink_events(from_date date, to_date date)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.transactions t
  set event_id = m.event,
      event_source = case when m.event is null then null else 'auto' end
  from (
    select x.id,
      public.matching_event(
        x.occurred_on, x.kind,
        (select array_agg(s.category_id) from public.transaction_splits s where s.transaction_id = x.id),
        x.id) as event
    from public.transactions x
    where x.kind in ('expense', 'income')
      and x.occurred_on between relink_events.from_date and relink_events.to_date
      and (x.event_source is distinct from 'manual' or x.event_id is null)
  ) m
  where t.id = m.id and t.event_id is distinct from m.event;
$$;

create function public.save_event_type(type_id uuid, name text, icon text, color text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved uuid := save_event_type.type_id;
begin
  if saved is null then
    insert into public.event_types (name, icon, color)
    values (trim(save_event_type.name), save_event_type.icon, save_event_type.color)
    returning id into saved;
  else
    update public.event_types t
    set name = trim(save_event_type.name), icon = save_event_type.icon, color = save_event_type.color
    where t.id = saved;
    if not found then
      raise exception 'event_type_not_found' using errcode = 'P0002';
    end if;
  end if;
  return saved;
end;
$$;

-- An event with its people and categories in one call (ADR-012), then the rule put back
-- on the dates it covered before and covers now.
create function public.save_event(
  event_id uuid,
  name text,
  type_id uuid,
  starts_on date,
  ends_on date,
  person_ids uuid[],
  included_ids uuid[],
  excluded_ids uuid[]
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
    insert into public.events (name, type_id, starts_on, ends_on)
    values (trim(save_event.name), save_event.type_id, save_event.starts_on, save_event.ends_on)
    returning id into saved;
  else
    select e.starts_on, coalesce(e.ends_on, e.starts_on) into old_start, old_end
    from public.events e where e.id = saved;
    update public.events e
    set name = trim(save_event.name), type_id = save_event.type_id,
        starts_on = save_event.starts_on, ends_on = save_event.ends_on
    where e.id = saved;
    if not found then
      raise exception 'event_not_found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.event_people p where p.event_id = saved;
  insert into public.event_people (event_id, person_id)
  select distinct saved, p from unnest(save_event.person_ids) p;

  delete from public.event_categories c where c.event_id = saved;
  insert into public.event_categories (event_id, category_id, excluded)
  select saved, c, false from unnest(save_event.included_ids) c
  union
  select saved, c, true from unnest(save_event.excluded_ids) c
  where c <> all (save_event.included_ids);

  perform public.relink_events(
    least(save_event.starts_on, coalesce(old_start, save_event.starts_on)),
    greatest(coalesce(save_event.ends_on, save_event.starts_on), coalesce(old_end, save_event.starts_on)));
  return saved;
end;
$$;

-- Deleting detaches its transactions; the rule then offers them to any other event.
create function public.delete_event(event_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  first_day date;
  last_day date;
begin
  select e.starts_on, coalesce(e.ends_on, e.starts_on) into first_day, last_day
  from public.events e where e.id = delete_event.event_id;
  if not found then
    raise exception 'event_not_found' using errcode = 'P0002';
  end if;
  update public.transactions t set event_id = null, event_source = null
  where t.event_id = delete_event.event_id;
  delete from public.events e where e.id = delete_event.event_id;
  perform public.relink_events(first_day, last_day);
end;
$$;

-- How many transactions carry each event (spec 22).
create view public.event_usage with (security_invoker = true) as
select t.event_id, count(*)::integer as transaction_count
from public.transactions t
where t.event_id is not null
group by t.event_id;
grant select on public.event_usage to authenticated;

revoke execute on function public.event_takes_category(uuid, uuid) from public, anon;
grant execute on function public.event_takes_category(uuid, uuid) to authenticated;
revoke execute on function public.matching_event(date, text, uuid[], uuid, boolean) from public, anon;
grant execute on function public.matching_event(date, text, uuid[], uuid, boolean) to authenticated;
revoke execute on function public.relink_events(date, date) from public, anon;
grant execute on function public.relink_events(date, date) to authenticated;
revoke execute on function public.save_event_type(uuid, text, text, text) from public, anon;
grant execute on function public.save_event_type(uuid, text, text, text) to authenticated;
revoke execute on function public.save_event(uuid, text, uuid, date, date, uuid[], uuid[], uuid[]) from public, anon;
grant execute on function public.save_event(uuid, text, uuid, date, date, uuid[], uuid[], uuid[]) to authenticated;
revoke execute on function public.delete_event(uuid) from public, anon;
grant execute on function public.delete_event(uuid) to authenticated;

drop function public.save_transaction(uuid, uuid, text, date, numeric, jsonb, numeric, text, text, uuid, text, jsonb, uuid[]);
drop function public.list_transactions(date, date, uuid[], uuid[], uuid[], text, date, boolean, integer, uuid[], boolean);

create function public.save_transaction(
  transaction_id uuid,
  account_id uuid,
  kind text,
  occurred_on date,
  amount numeric,
  splits jsonb,
  original_amount numeric default null,
  original_currency text default null,
  status text default 'cleared',
  merchant_id uuid default null,
  note text default null,
  people jsonb default '[]',
  reimburses uuid[] default null,
  event_id uuid default null,
  event_choice text default 'auto'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved uuid := save_transaction.transaction_id;
  account_currency char(3);
  minor integer;
  direction integer := case save_transaction.kind when 'expense' then -1 else 1 end;
  total numeric;
  lines integer;
  modes integer;
  mode text;
  weight numeric;
  positive boolean;
  line record;
  share numeric;
  done numeric := 0;
  people_lines integer;
  people_modes integer;
  people_mode text;
  people_weight numeric;
  kept jsonb;
  affected uuid[];
  owed record;
  left_over numeric;
  take numeric;
  expense uuid;
  split_categories uuid[];
  matched uuid;
begin
  if save_transaction.kind is null or save_transaction.kind not in ('expense', 'income') then
    raise exception 'transaction_kind_invalid' using errcode = '23514';
  end if;

  select a.currency, c.minor_units into account_currency, minor
  from public.accounts a
  join public.currencies c on c.code = a.currency
  where a.id = save_transaction.account_id;
  if not found then
    raise exception 'account_not_found' using errcode = 'P0002';
  end if;

  perform public.check_money_amount(save_transaction.amount, account_currency);
  total := direction * save_transaction.amount;
  if save_transaction.original_currency is not null then
    perform public.check_money_amount(save_transaction.original_amount, save_transaction.original_currency);
  end if;

  if jsonb_typeof(save_transaction.splits) is distinct from 'array'
     or jsonb_array_length(save_transaction.splits) = 0 then
    raise exception 'transaction_needs_category' using errcode = '23514';
  end if;

  select count(*), count(distinct s ->> 'input_mode'), min(s ->> 'input_mode'),
         sum((s ->> 'input_value')::numeric), bool_and((s ->> 'input_value')::numeric > 0)
  into lines, modes, mode, weight, positive
  from jsonb_array_elements(save_transaction.splits) s;

  if modes <> 1 or mode not in ('amount', 'share', 'percent') then
    raise exception 'splits_mixed_modes' using errcode = '23514';
  end if;
  if not positive then
    raise exception 'amount_not_positive' using errcode = '23514';
  end if;
  if mode = 'amount' and weight <> save_transaction.amount
     or mode = 'percent' and weight <> 100 then
    raise exception 'splits_sum_mismatch' using errcode = '23514';
  end if;

  if saved is null then
    insert into public.transactions (account_id, kind, occurred_on, amount, currency,
                                     original_amount, original_currency, status, merchant_id, note)
    values (save_transaction.account_id, save_transaction.kind, save_transaction.occurred_on, total, account_currency,
            direction * save_transaction.original_amount, save_transaction.original_currency,
            save_transaction.status, save_transaction.merchant_id,
            nullif(trim(save_transaction.note), ''))
    returning id into saved;
  else
    update public.transactions t set
      account_id = save_transaction.account_id,
      kind = save_transaction.kind,
      occurred_on = save_transaction.occurred_on,
      amount = total,
      currency = account_currency,
      original_amount = direction * save_transaction.original_amount,
      original_currency = save_transaction.original_currency,
      status = save_transaction.status,
      merchant_id = save_transaction.merchant_id,
      note = nullif(trim(save_transaction.note), '')
    where t.id = saved and t.kind in ('expense', 'income') and t.transfer_id is null;
    if not found then
      raise exception 'transaction_not_found' using errcode = 'P0002';
    end if;
    delete from public.transaction_splits s where s.transaction_id = saved;
    -- The reimbursements of its owed lines outlive the lines (spec 21): kept by person,
    -- or by position for a line without a name, and put back below.
    select jsonb_agg(jsonb_build_object('person_id', p.person_id, 'position', p.position,
                                        'income_id', r.income_id, 'amount', r.amount))
    into kept
    from public.reimbursements r
    join public.transaction_people p on p.id = r.owed_line_id
    where p.transaction_id = saved;
    delete from public.transaction_people p where p.transaction_id = saved;
  end if;

  for line in
    select (e.s ->> 'category_id')::uuid as category_id, (e.s ->> 'input_value')::numeric as input_value, e.n
    from jsonb_array_elements(save_transaction.splits) with ordinality as e (s, n)
    order by e.n
  loop
    if mode = 'amount' then
      perform public.check_money_amount(line.input_value, account_currency);
    end if;
    share := case
      when line.n = lines then total - done
      when mode = 'amount' then direction * line.input_value
      else round(total * line.input_value / weight, minor)
    end;
    insert into public.transaction_splits (transaction_id, category_id, input_mode, input_value, amount)
    values (saved, line.category_id, mode, line.input_value, share);
    done := done + share;
  end loop;

  -- The people's parts (PPL-03, 04, spec 20), computed like the splits: Moi first on an
  -- expense, the last line taking the rounding. The constraint trigger checks the roles
  -- and the sum at commit.
  people_lines := coalesce(jsonb_array_length(save_transaction.people), 0);
  if people_lines > 0 then
    select count(distinct p ->> 'input_mode'), min(p ->> 'input_mode'), sum((p ->> 'input_value')::numeric)
    into people_modes, people_mode, people_weight
    from jsonb_array_elements(save_transaction.people) p;

    if people_modes <> 1 or people_mode not in ('amount', 'share', 'percent') then
      raise exception 'people_mixed_modes' using errcode = '23514';
    end if;
    if people_weight is null or people_weight <= 0
       or people_mode = 'amount' and people_weight <> save_transaction.amount
       or people_mode = 'percent' and people_weight <> 100 then
      raise exception 'people_sum_mismatch' using errcode = '23514';
    end if;

    done := 0;
    for line in
      select e.p ->> 'role' as role, (e.p ->> 'person_id')::uuid as person_id,
             coalesce((e.p ->> 'head_count')::integer, 1) as head_count,
             coalesce((e.p ->> 'amount_unknown')::boolean, false) as unknown,
             coalesce((e.p ->> 'fills_rest')::boolean, false) as fills_rest,
             (e.p ->> 'input_value')::numeric as input_value, e.n
      from jsonb_array_elements(save_transaction.people) with ordinality as e (p, n)
      order by e.n
    loop
      -- A part not known yet waits for its reimbursement (spec 21); recomputed below.
      if line.unknown then
        insert into public.transaction_people
          (transaction_id, position, role, person_id, head_count, input_mode, input_value, amount, amount_unknown)
        values (saved, line.n, line.role, line.person_id, line.head_count, people_mode, 0, null, true);
        continue;
      end if;
      -- Moi can be zero, when I paid entirely for others.
      if people_mode = 'amount' and line.input_value <> 0 then
        perform public.check_money_amount(line.input_value, account_currency);
      end if;
      share := case
        when line.n = people_lines then total - done
        when people_mode = 'amount' then direction * line.input_value
        else round(total * line.input_value / people_weight, minor)
      end;
      insert into public.transaction_people
        (transaction_id, position, role, person_id, head_count, input_mode, input_value, amount, fills_rest)
      values (saved, line.n, line.role, line.person_id, line.head_count, people_mode, line.input_value, share,
              line.fills_rest);
      done := done + share;
    end loop;
  end if;

  -- Back on the lines they paid back, never more than a known part.
  insert into public.reimbursements (owed_line_id, income_id, amount)
  select p.id, (k ->> 'income_id')::uuid,
         least((k ->> 'amount')::numeric, coalesce(abs(p.amount), (k ->> 'amount')::numeric))
  from jsonb_array_elements(coalesce(kept, '[]')) k
  join public.transaction_people p
    on p.transaction_id = saved and p.role = 'owes'
   and case when k ->> 'person_id' is not null
            then p.person_id = (k ->> 'person_id')::uuid
            else p.person_id is null and p.position = (k ->> 'position')::integer end
  where coalesce(abs(p.amount), 1) > 0;
  perform public.recompute_people(saved);

  -- An income pays back the owed lines given, in order (spec 21): each takes what it is
  -- still owed, a line not known yet takes all that is left, and what is over is a gift.
  if save_transaction.kind = 'expense' then
    delete from public.reimbursements r where r.income_id = saved;
  elsif save_transaction.reimburses is not null then
    select array_agg(distinct p.transaction_id) into affected
    from public.reimbursements r
    join public.transaction_people p on p.id = r.owed_line_id
    where r.income_id = saved;
    delete from public.reimbursements r where r.income_id = saved;
    left_over := total;
    foreach expense in array save_transaction.reimburses loop
      select p.id, p.transaction_id, p.amount, p.amount_unknown,
             coalesce((select sum(x.amount) from public.reimbursements x where x.owed_line_id = p.id), 0) as back
      into owed
      from public.transaction_people p
      where p.id = expense and p.role = 'owes';
      if not found then
        raise exception 'owed_line_not_found' using errcode = 'P0002';
      end if;
      -- A part not known yet takes what is left of the income, but never more than the
      -- lines that absorb it can give up (empty_part_room).
      take := case when owed.amount_unknown
                   then least(left_over, public.empty_part_room(owed.transaction_id) - owed.back)
                   else least(left_over, abs(owed.amount) - owed.back) end;
      if take > 0 then
        insert into public.reimbursements (owed_line_id, income_id, amount)
        values (owed.id, saved, take);
        left_over := left_over - take;
      end if;
      affected := array_append(affected, owed.transaction_id);
    end loop;
    foreach expense in array coalesce(affected, '{}') loop
      perform public.recompute_people(expense);
    end loop;
  end if;

  -- The event (EVT-03, 07, spec 22). manual: the one chosen; none: cleared by hand, which
  -- remembers the event the rule would give; auto: whatever the rule gives.
  select array_agg(s.category_id) into split_categories
  from public.transaction_splits s where s.transaction_id = saved;
  if save_transaction.event_choice = 'manual' and save_transaction.event_id is not null then
    update public.transactions t set event_id = save_transaction.event_id, event_source = 'manual'
    where t.id = saved;
    delete from public.event_exclusions x
    where x.event_id = save_transaction.event_id and x.transaction_id = saved;
  elsif save_transaction.event_choice = 'none' then
    matched := public.matching_event(save_transaction.occurred_on, save_transaction.kind,
                                     split_categories, saved, true);
    if matched is not null then
      insert into public.event_exclusions (event_id, transaction_id) values (matched, saved)
      on conflict do nothing;
    end if;
    update public.transactions t set event_id = null, event_source = null where t.id = saved;
  else
    matched := public.matching_event(save_transaction.occurred_on, save_transaction.kind,
                                     split_categories, saved);
    update public.transactions t
    set event_id = matched, event_source = case when matched is null then null else 'auto' end
    where t.id = saved;
  end if;

  return saved;
end;
$$;

create function public.list_transactions(
  from_date date default null,
  to_date date default null,
  account_ids uuid[] default null,
  category_ids uuid[] default null,
  merchant_ids uuid[] default null,
  search text default null,
  before date default null,
  pending_only boolean default false,
  max_rows integer default 150,
  person_ids uuid[] default null,
  owed_only boolean default false,
  event_ids uuid[] default null,
  without_event boolean default false
)
returns table (
  id                uuid,
  transfer_id       uuid,
  kind              text,
  occurred_on       date,
  pending           boolean,
  merchant          text,
  note              text,
  account_name      text,
  institution       text,
  from_account      text,
  from_institution  text,
  to_account        text,
  to_institution    text,
  categories        jsonb,
  people            jsonb,
  reimburses        jsonb,
  event             jsonb,
  amount            text,
  currency          text,
  display_amount    text,
  rate              text,
  day_net           text,
  fee_amount        text,
  fee_category      text,
  received_amount   text,
  received_currency text,
  received_value    text,
  conversion_cost   text,
  more              boolean,
  total             bigint,
  pending_count     bigint,
  owed_count        bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive branch as (
    select c.id from public.categories c where c.id = any(list_transactions.category_ids)
    union
    select c.id from public.categories c join branch b on c.parent_id = b.id
  ),
  display as (
    select p.display_currency as code, c.minor_units
    from public.profiles p
    join public.currencies c on c.code = p.display_currency
    where p.user_id = (select auth.uid())
  ),
  -- Everything the filters and the search match, at any date.
  matched as (
    select
      t.*,
      t.status = 'pending' or (coalesce(cardinality(list_transactions.account_ids), 0) = 0
        and t.kind = 'transfer' and exists (
        select 1 from public.transactions o
        where o.transfer_id = t.transfer_id and o.status = 'pending'
      )) as is_pending,
      exists (
        select 1 from public.owed_lines o
        where o.transaction_id = t.id and o.open
      ) as is_owed
    from public.transactions t
    left join public.merchants sm on sm.id = t.merchant_id
    join public.accounts sa on sa.id = t.account_id
    left join public.institutions si on si.id = sa.institution_id
    cross join lateral (
      select public.fold_name(trim(coalesce(list_transactions.search, ''))) as text
    ) q
    where (coalesce(cardinality(list_transactions.merchant_ids), 0) = 0
        or t.merchant_id = any(list_transactions.merchant_ids))
      and (coalesce(cardinality(list_transactions.person_ids), 0) = 0 or exists (
        select 1 from public.transaction_people x
        where x.transaction_id = t.id and x.person_id = any(list_transactions.person_ids)
      ))
      and ((coalesce(cardinality(list_transactions.event_ids), 0) = 0 and not list_transactions.without_event)
        or t.event_id = any(list_transactions.event_ids)
        or (list_transactions.without_event and t.event_id is null))
      and (coalesce(cardinality(list_transactions.category_ids), 0) = 0 or exists (
        select 1 from public.transaction_splits x
        where x.transaction_id = t.id and x.category_id in (select b.id from branch b)
      ))
      -- A fee shows on its transfer, unless categories are filtered.
      and (coalesce(cardinality(list_transactions.category_ids), 0) > 0
        or not (t.kind = 'expense' and t.transfer_id is not null))
      and (q.text = ''
        or exists (
          select 1 from unnest(array[sm.name, t.note, sa.name, si.name]) as v (value)
          where strpos(public.fold_name(coalesce(v.value, '')), q.text) > 0
        )
        or exists (
          select 1 from public.transaction_splits x
          join public.categories k on k.id = x.category_id
          where x.transaction_id = t.id and strpos(public.fold_name(k.name), q.text) > 0
        )
        or exists (
          select 1 from public.transaction_people x
          join public.people k on k.id = x.person_id
          where x.transaction_id = t.id and strpos(public.fold_name(k.name), q.text) > 0
        )
        or (t.transfer_id is not null and exists (
          select 1 from public.transactions o
          join public.accounts oa on oa.id = o.account_id
          left join public.institutions oi on oi.id = oa.institution_id
          where o.transfer_id = t.transfer_id
            and (strpos(public.fold_name(oa.name), q.text) > 0
              or strpos(public.fold_name(coalesce(oi.name, '')), q.text) > 0)
        )))
      and case
        when coalesce(cardinality(list_transactions.account_ids), 0) = 0
          then not (t.kind = 'transfer' and t.amount > 0)
        else t.account_id = any(list_transactions.account_ids)
      end
  ),
  scope as (
    select m.* from matched m
    where (list_transactions.from_date is null or m.occurred_on >= list_transactions.from_date)
      and (list_transactions.to_date is null or m.occurred_on <= list_transactions.to_date)
      and (list_transactions.before is null or m.occurred_on < list_transactions.before)
      and (not list_transactions.pending_only or m.is_pending)
      and (not list_transactions.owed_only or m.is_owed)
  ),
  cutoff as (
    select s.occurred_on from scope s
    order by s.occurred_on desc
    offset greatest(list_transactions.max_rows, 1) - 1 limit 1
  ),
  page as (
    select s.* from scope s
    where s.occurred_on >= coalesce((select c.occurred_on from cutoff c), '-infinity'::date)
  ),
  listed as (
    select
      t.id,
      t.transfer_id,
      t.kind,
      t.occurred_on,
      min(t.created_at) over (partition by coalesce(t.transfer_id, t.id)) as entered_at,
      t.is_pending as pending,
      m.name as merchant,
      t.note,
      a.name as account_name,
      i.name as institution,
      legs.from_account,
      legs.from_institution,
      legs.to_account,
      legs.to_institution,
      coalesce(s.categories, '[]'::jsonb) as categories,
      coalesce(pp.people, '[]'::jsonb) as people,
      coalesce(rb.reimburses, '[]'::jsonb) as reimburses,
      ev.event,
      case when coalesce(cardinality(list_transactions.account_ids), 0) = 0 and t.kind = 'transfer'
        then -t.amount else t.amount end
        as amount,
      t.currency,
      public.exchange_rate(t.currency, d.code, t.occurred_on) as rate,
      d.minor_units,
      fee.amount as fee_amount,
      fee.category as fee_category,
      arrival.amount as received_amount,
      arrival.currency as received_currency,
      arrival.value as received_value,
      arrival.market,
      fx.market as fx_market
    from page t
    cross join display d
    join public.accounts a on a.id = t.account_id
    left join public.institutions i on i.id = a.institution_id
    left join public.merchants m on m.id = t.merchant_id
    -- The largest share first, as the row stacks the icons.
    left join lateral (
      select jsonb_agg(
        jsonb_build_object('name', k.name, 'icon', k.icon, 'color', k.color)
        order by abs(x.amount) desc, k.name
      ) as categories
      from public.transaction_splits x
      join public.categories k on k.id = x.category_id
      where x.transaction_id = t.id
    ) s on true
    -- Everyone but Moi, in the order of their lines: the row's avatars (a line without a
    -- name with its count) and its colour when someone owes me.
    left join lateral (
      select jsonb_agg(
        jsonb_build_object('name', k.name, 'count', x.head_count, 'role', x.role,
                           'open', coalesce(o.open, false))
        order by x.position
      ) as people
      from public.transaction_people x
      left join public.people k on k.id = x.person_id
      left join public.owed_lines o on o.id = x.id
      where x.transaction_id = t.id and x.role <> 'me'
    ) pp on true
    -- What an income pays back: each expense's merchant, or its largest category, and date.
    left join lateral (
      select jsonb_agg(distinct jsonb_build_object(
        'label', coalesce(o.merchant, o.category), 'date', o.occurred_on)) as reimburses
      from public.reimbursements r
      join public.owed_lines o on o.id = r.owed_line_id
      where r.income_id = t.id
    ) rb on t.kind = 'income'
    -- The event as a tag: its name, and its type's icon and colour when it has one.
    left join lateral (
      select jsonb_build_object('id', e.id, 'name', e.name, 'icon', ty.icon, 'color', ty.color,
                                'source', t.event_source) as event
      from public.events e
      left join public.event_types ty on ty.id = e.type_id
      where e.id = t.event_id
    ) ev on true
    left join lateral (
      select
        max(oa.name) filter (where o.amount < 0) as from_account,
        max(oi.name) filter (where o.amount < 0) as from_institution,
        max(oa.name) filter (where o.amount > 0) as to_account,
        max(oi.name) filter (where o.amount > 0) as to_institution
      from public.transactions o
      join public.accounts oa on oa.id = o.account_id
      left join public.institutions oi on oi.id = oa.institution_id
      where o.transfer_id = t.transfer_id and o.kind = 'transfer'
    ) legs on t.transfer_id is not null
    -- Only the departure row carries the fee and the arrival.
    left join lateral (
      select -f.amount as amount, k.name as category
      from public.transactions f
      left join public.transaction_splits x on x.transaction_id = f.id
      left join public.categories k on k.id = x.category_id
      where f.transfer_id = t.transfer_id and f.kind = 'expense'
      limit 1
    ) fee on t.kind = 'transfer' and t.amount < 0
      and coalesce(cardinality(list_transactions.category_ids), 0) = 0
    left join lateral (
      select
        o.amount,
        o.currency,
        round(o.amount / r.rate, c.minor_units) as value,
        round(-t.amount * r.rate, oc.minor_units) as market
      from public.transactions o
      join public.currencies c on c.code = t.currency
      join public.currencies oc on oc.code = o.currency
      cross join lateral (select public.exchange_rate(t.currency, o.currency, t.occurred_on) as rate) r
      where o.transfer_id = t.transfer_id and o.kind = 'transfer' and o.amount > 0
        and o.currency <> t.currency
    ) arrival on t.kind = 'transfer' and t.amount < 0
    -- Paid in another currency: the market value of the original amount, in the account's.
    left join lateral (
      select round(abs(t.original_amount)
        * public.exchange_rate(t.original_currency, t.currency, t.occurred_on), c.minor_units) as market
      from public.currencies c
      where c.code = t.currency
    ) fx on t.original_currency is not null
  ),
  converted as (
    select
      l.*,
      round(l.amount * l.rate, l.minor_units) as display_value,
      round(-l.fee_amount * l.rate, l.minor_units) as fee_display,
      l.kind in ('expense', 'income') as in_day_net
    from listed l
  )
  select
    v.id,
    v.transfer_id,
    v.kind,
    v.occurred_on,
    v.pending,
    v.merchant,
    v.note,
    v.account_name,
    v.institution,
    v.from_account,
    v.from_institution,
    v.to_account,
    v.to_institution,
    v.categories,
    v.people,
    v.reimburses,
    v.event,
    v.amount::text,
    v.currency::text,
    v.display_value::text,
    v.rate::text,
    case
      when bool_or((v.in_day_net or v.fee_amount is not null) and v.rate is null) over day then null
      else (coalesce(sum(v.display_value) filter (where v.in_day_net) over day, 0)
        + coalesce(sum(v.fee_display) over day, 0))::text
    end,
    v.fee_amount::text,
    v.fee_category,
    v.received_amount::text,
    v.received_currency::text,
    v.received_value::text,
    -- At the market value exactly, rounding the way back would show a cent of cost.
    case
      when v.received_amount = v.market then '0'
      when v.received_amount is not null then (abs(v.amount) - v.received_value)::text
      when v.kind = 'income' then (v.fx_market - abs(v.amount))::text
      else (abs(v.amount) - v.fx_market)::text
    end,
    exists (
      select 1 from scope s
      where s.occurred_on < (select c.occurred_on from cutoff c)
    ),
    (select count(*) from scope),
    (select count(*) from matched m where m.is_pending),
    (select count(*) from matched m where m.is_owed)
  from converted v
  window day as (partition by v.occurred_on)
  order by v.occurred_on desc, v.entered_at desc, coalesce(v.transfer_id, v.id), v.kind = 'expense', v.id;
$$;


revoke execute on function public.list_transactions(date, date, uuid[], uuid[], uuid[], text, date, boolean, integer, uuid[], boolean, uuid[], boolean) from public, anon;
grant execute on function public.list_transactions(date, date, uuid[], uuid[], uuid[], text, date, boolean, integer, uuid[], boolean, uuid[], boolean) to authenticated;
revoke execute on function public.save_transaction(uuid, uuid, text, date, numeric, jsonb, numeric, text, text, uuid, text, jsonb, uuid[], uuid, text) from public, anon;
grant execute on function public.save_transaction(uuid, uuid, text, date, numeric, jsonb, numeric, text, text, uuid, text, jsonb, uuid[], uuid, text) to authenticated;
