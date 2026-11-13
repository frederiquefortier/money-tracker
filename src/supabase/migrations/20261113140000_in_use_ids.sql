-- Which categories, accounts and holdings something points at, one query each. The app
-- asked PostgREST once per row (~100 requests for the categories alone), so every page
-- that offers a delete waited on all of them. Security invoker: RLS keeps them to the
-- caller's rows. An array, so PostgREST's 1,000-row cap never cuts it.

create function public.used_category_ids()
returns uuid[]
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(array_agg(distinct s.category_id), '{}')
  from public.transaction_splits s;
$$;

create function public.used_account_ids()
returns uuid[]
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(array_agg(distinct t.account_id), '{}')
  from public.transactions t;
$$;

-- A holding with a history can only be archived: a transaction, a value, a contribution
-- or a transfer on either side.
create function public.holdings_with_history()
returns uuid[]
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(array_agg(distinct h.id), '{}')
  from (
    select t.holding_id as id from public.transactions t where t.holding_id is not null
    union select s.holding_id from public.holding_snapshots s
    union select c.holding_id from public.holding_contributions c
    union select x.from_holding_id from public.holding_transfers x
    union select x.to_holding_id from public.holding_transfers x
  ) h;
$$;

revoke execute on function public.used_category_ids() from public, anon;
revoke execute on function public.used_account_ids() from public, anon;
revoke execute on function public.holdings_with_history() from public, anon;
grant execute on function public.used_category_ids() to authenticated;
grant execute on function public.used_account_ids() to authenticated;
grant execute on function public.holdings_with_history() to authenticated;
