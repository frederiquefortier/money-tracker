-- The API role refuses an UPDATE without a WHERE (pg_safeupdate, 21000), so the two updates of
-- import_holdings on its own temporary table say `where true`.
create or replace function public.import_holdings(payload jsonb, batch uuid default null)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_will jsonb;
  v_counts jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  perform internal.plpgsql_check_pragma(
    'table: h_err (file text, line integer, code text, detail text)',
    'table: h_row (line integer, hkey text, label text, type text, institution text, ikey text, name text, nkey text, country text, currency text, opened_on date, closed_on date, ids uuid[], id uuid, ecur text, eclosed date, ekind text, minor integer, is_new boolean)',
    'table: h_snap (line integer, hkey text, d date, amount numeric, skip boolean)',
    'table: h_con (line integer, hkey text, d date, amount numeric, label text, skip boolean)',
    'table: h_tr (line integer, from_key text, to_key text, d date, amount numeric, skip boolean)');

  drop table if exists pg_temp.h_err, pg_temp.h_row, pg_temp.h_snap, pg_temp.h_con, pg_temp.h_tr;
  create temp table h_err (file text, line integer, code text, detail text) on commit drop;

  create temp table h_row on commit drop as
  select coalesce((e.a ->> 'line')::integer, e.n::integer + 1) as line,
         public.fold_name(e.a ->> 'holding') as hkey,
         trim(e.a ->> 'holding') as label,
         nullif(trim(e.a ->> 'type'), '') as type,
         nullif(trim(e.a ->> 'institution'), '') as institution,
         public.fold_name(e.a ->> 'institution') as ikey,
         nullif(trim(e.a ->> 'name'), '') as name,
         public.fold_name(e.a ->> 'name') as nkey,
         upper(nullif(trim(e.a ->> 'country'), '')) as country,
         upper(nullif(trim(e.a ->> 'currency'), '')) as currency,
         nullif(trim(e.a ->> 'opened_on'), '')::date as opened_on,
         nullif(trim(e.a ->> 'closed_on'), '')::date as closed_on,
         null::uuid[] as ids, null::uuid as id, null::text as ecur, null::date as eclosed,
         null::text as ekind, null::integer as minor, true as is_new
  from jsonb_array_elements(coalesce(payload -> 'holdings', '[]')) with ordinality as e (a, n);

  create temp table h_snap on commit drop as
  select coalesce((e.a ->> 'line')::integer, e.n::integer + 1) as line,
         public.fold_name(e.a ->> 'holding') as hkey,
         nullif(trim(e.a ->> 'date'), '')::date as d,
         nullif(trim(e.a ->> 'amount'), '')::numeric as amount,
         false as skip
  from jsonb_array_elements(coalesce(payload -> 'snapshots', '[]')) with ordinality as e (a, n);

  create temp table h_con on commit drop as
  select coalesce((e.a ->> 'line')::integer, e.n::integer + 1) as line,
         public.fold_name(e.a ->> 'holding') as hkey,
         nullif(trim(e.a ->> 'date'), '')::date as d,
         nullif(trim(e.a ->> 'amount'), '')::numeric as amount,
         nullif(trim(e.a ->> 'label'), '') as label,
         false as skip
  from jsonb_array_elements(coalesce(payload -> 'contributions', '[]')) with ordinality as e (a, n);

  create temp table h_tr on commit drop as
  select coalesce((e.a ->> 'line')::integer, e.n::integer + 1) as line,
         public.fold_name(e.a ->> 'from_holding') as from_key,
         public.fold_name(e.a ->> 'to_holding') as to_key,
         nullif(trim(e.a ->> 'date'), '')::date as d,
         nullif(trim(e.a ->> 'amount'), '')::numeric as amount,
         false as skip
  from jsonb_array_elements(coalesce(payload -> 'holding_transfers', '[]')) with ordinality as e (a, n);

  -- The app's holding each row stands for: same type, institution and name (a missing one
  -- matches a missing one).
  update h_row h set ids = array(
    select x.id from public.holdings x
    left join public.institutions i on i.id = x.institution_id
    where x.type = h.type
      and coalesce(public.fold_name(i.name), '') = coalesce(h.ikey, '')
      and coalesce(public.fold_name(x.name), '') = coalesce(h.nkey, ''))
  where true;
  update h_row h set id = h.ids[1], is_new = false where cardinality(h.ids) = 1;
  update h_row h set
    ecur = coalesce((select x.currency from public.holdings x where x.id = h.id), h.currency),
    eclosed = case when h.is_new then h.closed_on
                   else (select x.closed_on from public.holdings x where x.id = h.id) end,
    ekind = coalesce((select t.kind from public.holding_types t where t.code = h.type),
                     (select x.kind from public.holdings x where x.id = h.id))
  where true;
  update h_row h set minor = c.minor_units from public.currencies c where c.code = h.ecur;

  insert into h_err select 'holdings.csv', h.line, 'holding_key_required', '' from h_row h where h.hkey = '';
  insert into h_err select 'holdings.csv', h.line, 'holding_duplicate', h.label from h_row h
    where h.hkey <> '' and (select count(*) from h_row b where b.hkey = h.hkey) > 1;
  insert into h_err select 'holdings.csv', h.line, 'holding_type_unknown', coalesce(h.type, '') from h_row h
    where not exists (select 1 from public.holding_types t where t.code = h.type);
  insert into h_err select 'holdings.csv', h.line, 'holding_currency_unknown', coalesce(h.currency, '') from h_row h
    where not exists (select 1 from public.currencies c where c.code = h.currency);
  insert into h_err select 'holdings.csv', h.line, 'holding_country_required', 'country' from h_row h
    where h.is_new and h.country is null
      and not exists (select 1 from public.holding_types t where t.code = h.type and t.country is not null);
  insert into h_err select 'holdings.csv', h.line, 'date_required', 'opened_on' from h_row h
    where h.is_new and h.opened_on is null;
  insert into h_err select 'holdings.csv', h.line, 'holding_dates', h.label from h_row h
    where h.is_new and h.closed_on < h.opened_on;
  insert into h_err select 'holdings.csv', h.line, 'holding_ambiguous', h.label from h_row h
    where cardinality(h.ids) > 1;
  insert into h_err select 'holdings.csv', h.line, 'holding_currency_differs', h.label from h_row h
    where not h.is_new and h.currency is distinct from h.ecur;

  -- Snapshots.
  insert into h_err select 'snapshots.csv', s.line, 'holding_unknown', s.hkey from h_snap s
    where not exists (select 1 from h_row h where h.hkey = s.hkey);
  insert into h_err select 'snapshots.csv', s.line, 'date_required', 'date' from h_snap s where s.d is null;
  insert into h_err select 'snapshots.csv', s.line, 'amount_negative', s.amount::text from h_snap s where s.amount < 0;
  insert into h_err select 'snapshots.csv', s.line, 'snapshot_duplicate', s.hkey from h_snap s
    where (select count(*) from h_snap b where b.hkey = s.hkey and b.d = s.d) > 1;
  insert into h_err select 'snapshots.csv', s.line, 'amount_precision', s.amount::text
    from h_snap s join h_row h on h.hkey = s.hkey
    where h.minor is not null and s.amount <> round(s.amount, h.minor);
  insert into h_err select 'snapshots.csv', s.line, 'after_holding_closed', s.hkey
    from h_snap s join h_row h on h.hkey = s.hkey where s.d > h.eclosed;

  -- Contributions.
  insert into h_err select 'contributions.csv', c.line, 'holding_unknown', c.hkey from h_con c
    where not exists (select 1 from h_row h where h.hkey = c.hkey);
  insert into h_err select 'contributions.csv', c.line, 'date_required', 'date' from h_con c where c.d is null;
  insert into h_err select 'contributions.csv', c.line, 'amount_not_positive', c.amount::text from h_con c where c.amount <= 0;
  insert into h_err select 'contributions.csv', c.line, 'label_too_long', c.label from h_con c where length(c.label) > 100;
  insert into h_err select 'contributions.csv', c.line, 'amount_precision', c.amount::text
    from h_con c join h_row h on h.hkey = c.hkey
    where h.minor is not null and c.amount <> round(c.amount, h.minor);
  insert into h_err select 'contributions.csv', c.line, 'after_holding_closed', c.hkey
    from h_con c join h_row h on h.hkey = c.hkey where c.d > h.eclosed;

  -- Transfers.
  insert into h_err select 'holding_transfers.csv', t.line, 'holding_unknown', t.from_key from h_tr t
    where not exists (select 1 from h_row h where h.hkey = t.from_key);
  insert into h_err select 'holding_transfers.csv', t.line, 'holding_unknown', t.to_key from h_tr t
    where not exists (select 1 from h_row h where h.hkey = t.to_key);
  insert into h_err select 'holding_transfers.csv', t.line, 'date_required', 'date' from h_tr t where t.d is null;
  insert into h_err select 'holding_transfers.csv', t.line, 'amount_not_positive', t.amount::text from h_tr t where t.amount <= 0;
  insert into h_err select 'holding_transfers.csv', t.line, 'transfer_same_holding', t.from_key from h_tr t
    where t.from_key = t.to_key;
  insert into h_err select 'holding_transfers.csv', t.line, 'holding_transfer_kind', t.from_key
    from h_tr t join h_row a on a.hkey = t.from_key join h_row b on b.hkey = t.to_key
    where a.ekind <> 'investment' or b.ekind <> 'investment';
  insert into h_err select 'holding_transfers.csv', t.line, 'holding_transfer_currency', t.from_key
    from h_tr t join h_row a on a.hkey = t.from_key join h_row b on b.hkey = t.to_key
    where a.ecur <> b.ecur;
  insert into h_err select 'holding_transfers.csv', t.line, 'amount_precision', t.amount::text
    from h_tr t join h_row a on a.hkey = t.from_key
    where a.minor is not null and t.amount <> round(t.amount, a.minor);
  insert into h_err select 'holding_transfers.csv', t.line, 'after_holding_closed', t.from_key
    from h_tr t join h_row a on a.hkey = t.from_key join h_row b on b.hkey = t.to_key
    where t.d > a.eclosed or t.d > b.eclosed;

  -- What is already in the app is skipped, which makes a second run harmless.
  update h_snap s set skip = true from h_row h
    where h.hkey = s.hkey and h.id is not null
      and exists (select 1 from public.holding_snapshots x where x.holding_id = h.id and x.on_date = s.d);
  update h_con c set skip = true from h_row h
    where h.hkey = c.hkey and h.id is not null
      and exists (select 1 from public.holding_contributions x
                  where x.holding_id = h.id and x.on_date = c.d and x.amount = c.amount
                    and x.label is not distinct from c.label);
  update h_tr t set skip = true from h_row a, h_row b
    where a.hkey = t.from_key and b.hkey = t.to_key and a.id is not null and b.id is not null
      and exists (select 1 from public.holding_transfers x
                  where x.from_holding_id = a.id and x.to_holding_id = b.id
                    and x.on_date = t.d and x.amount = t.amount);

  if batch is null then
    v_counts := jsonb_build_object(
      'holdings', (select count(*) from h_row h where h.is_new),
      'holdings_matched', (select count(*) from h_row h where not h.is_new),
      'snapshots', (select count(*) from h_snap s where not s.skip),
      'contributions', (select count(*) from h_con c where not c.skip),
      'holding_transfers', (select count(*) from h_tr t where not t.skip),
      'holding_rows_skipped', (select count(*) from h_snap s where s.skip) + (select count(*) from h_con c where c.skip)
                              + (select count(*) from h_tr t where t.skip));
    v_will := jsonb_build_object(
      'holdings', (select coalesce(jsonb_agg(jsonb_build_object('type', h.type, 'institution', h.institution, 'name', h.name)
                    order by h.type, h.institution, h.name), '[]') from h_row h where h.is_new),
      'institutions', (select coalesce(jsonb_agg(n order by n), '[]') from (
          select distinct on (h.ikey) h.institution as n from h_row h
          where h.institution is not null
            and not exists (select 1 from public.institutions i where public.fold_name(i.name) = h.ikey)) x));
    return jsonb_build_object(
      'errors', (select coalesce(jsonb_agg(jsonb_build_object('file', e.file, 'line', e.line, 'code', e.code, 'detail', e.detail)), '[]')
                 from h_err e),
      'counts', v_counts, 'will_create', v_will);
  end if;

  -- Writing, inside import_batch's transaction.
  insert into public.user_currencies (code)
  select distinct h.currency from h_row h
  where h.is_new and not exists (select 1 from public.user_currencies u where u.code = h.currency);
  update public.user_currencies u set removed_at = null
  where u.removed_at is not null and u.code in (select h.currency from h_row h where h.is_new);

  insert into public.institutions (name, import_batch_id)
  select distinct on (h.ikey) h.institution, batch from h_row h
  where h.institution is not null
    and not exists (select 1 from public.institutions i where public.fold_name(i.name) = h.ikey);

  insert into public.holdings (type, kind, institution_id, name, country, currency, opened_on, closed_on, import_batch_id)
  select h.type, h.ekind,
         (select i.id from public.institutions i where public.fold_name(i.name) = h.ikey),
         h.name,
         coalesce(h.country, (select t.country from public.holding_types t where t.code = h.type)),
         h.currency, h.opened_on, h.closed_on, batch
  from h_row h where h.is_new;

  update h_row h set id = x.id
  from public.holdings x
  left join public.institutions i on i.id = x.institution_id
  where h.is_new and x.import_batch_id = batch and x.type = h.type
    and coalesce(public.fold_name(i.name), '') = coalesce(h.ikey, '')
    and coalesce(public.fold_name(x.name), '') = coalesce(h.nkey, '');

  insert into public.holding_snapshots (holding_id, on_date, amount, import_batch_id)
  select h.id, s.d, s.amount, batch from h_snap s join h_row h on h.hkey = s.hkey where not s.skip;
  insert into public.holding_contributions (holding_id, on_date, amount, label, import_batch_id)
  select h.id, c.d, c.amount, c.label, batch from h_con c join h_row h on h.hkey = c.hkey where not c.skip;
  insert into public.holding_transfers (from_holding_id, to_holding_id, on_date, amount, import_batch_id)
  select a.id, b.id, t.d, t.amount, batch
  from h_tr t join h_row a on a.hkey = t.from_key join h_row b on b.hkey = t.to_key where not t.skip;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.import_holdings(jsonb, uuid) from public, anon;
grant execute on function public.import_holdings(jsonb, uuid) to authenticated;
