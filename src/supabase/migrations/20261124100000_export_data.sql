-- IMP-04, SEC-04: the user's data as the rows of the import's files (import.md), so that
-- importing them into an empty account gives the data back. One jsonb value, because
-- PostgREST returns at most 1,000 rows of a table. Every value is text or null; amounts
-- carry no trailing zeros (ADR-004).
--
-- A transaction's ref is its import ref, or its id when it was typed in the app. A holding's
-- key is its name or type and its institution, numbered when two share it.
create function public.export_data()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive paths as (
    select c.id, c.name::text as path from public.categories c where c.parent_id is null
    union all
    select c.id, p.path || ' > ' || c.name from public.categories c join paths p on c.parent_id = p.id
  ),
  tx as (
    select t.*, coalesce(t.import_ref, t.id::text) as ref from public.transactions t
  ),
  hk as (
    select h.id,
           base || case when row_number() over (partition by lower(base) order by h.opened_on, h.created_at) > 1
                        then ' (' || row_number() over (partition by lower(base) order by h.opened_on, h.created_at) || ')'
                        else '' end as key
    from public.holdings h
    left join public.institutions i on i.id = h.institution_id
    cross join lateral (select concat_ws(' ', coalesce(h.name, h.type, h.type_label), i.name) as base) b
  )
  select jsonb_build_object(
    'accounts', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'name', a.name, 'type', a.type, 'currency', a.currency,
               'institution', i.name, 'institution_url', i.website_url,
               'opening_balance', trim_scale(a.opening_balance)::text,
               'opened_on', a.opened_on::text, 'closed_on', a.closed_on::text)
             order by i.name nulls first, a.name), '[]')
      from public.accounts a left join public.institutions i on i.id = a.institution_id),
    'transactions', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'ref', t.ref, 'date', t.occurred_on::text, 'account', a.name, 'institution', i.name,
               'kind', t.kind, 'amount', trim_scale(t.amount)::text, 'currency', t.currency,
               -- The import wants the receipt price with the amount's sign.
               'original_amount', trim_scale(abs(t.original_amount) * sign(t.amount))::text,
               'original_currency', t.original_currency,
               -- A seller who is a person is written as the merchant; the import reads it back as them.
               'merchant', coalesce(m.name, s.name), 'event', e.name, 'status', t.status,
               'transfer_group', t.transfer_id::text, 'note', t.note)
             order by t.occurred_on, t.ref), '[]')
      from tx t
      join public.accounts a on a.id = t.account_id
      left join public.institutions i on i.id = a.institution_id
      left join public.merchants m on m.id = t.merchant_id
      left join public.people s on s.id = t.seller_person_id
      left join public.events e on e.id = t.event_id),
    -- A transfer fee takes the profile's fee category on import, so it has no split here.
    'splits', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'ref', t.ref, 'category', p.path, 'amount', trim_scale(s.amount)::text)
             order by t.occurred_on, t.ref, s.created_at, s.id), '[]')
      from public.transaction_splits s
      join tx t on t.id = s.transaction_id
      join paths p on p.id = s.category_id
      where t.transfer_id is null),
    -- Moi is implied. Parts are left to the app on import, so no amount is written; an
    -- income names the first expense it repays, the only one the format holds.
    'people', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'ref', t.ref, 'role', l.role, 'person', q.name,
               'head_count', case when l.head_count > 1 then l.head_count::text end,
               'reimburses', (
                 select x.ref from public.reimbursements r
                 join public.transaction_people o on o.id = r.owed_line_id
                 join tx x on x.id = o.transaction_id
                 where r.income_id = t.id and l.role = 'from'
                 order by x.occurred_on, x.created_at, x.id limit 1))
             order by t.occurred_on, t.ref, l.position), '[]')
      from public.transaction_people l
      join tx t on t.id = l.transaction_id
      left join public.people q on q.id = l.person_id
      where l.role <> 'me'),
    'aliases', (
      select coalesce(jsonb_agg(jsonb_build_object('kind', x.kind, 'name', x.name, 'alias', x.alias)
             order by x.kind, x.name, x.alias), '[]')
      from (
        select 'merchant' as kind, m.name, a.alias from public.merchant_aliases a
        join public.merchants m on m.id = a.merchant_id
        union all
        select 'person', p.name, a.alias from public.person_aliases a
        join public.people p on p.id = a.person_id) x),
    'holdings', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'holding', k.key, 'type', coalesce(h.type, h.type_label), 'institution', i.name,
               'name', h.name, 'country', h.country, 'currency', h.currency,
               'opened_on', h.opened_on::text, 'closed_on', h.closed_on::text)
             order by h.opened_on, k.key), '[]')
      from public.holdings h
      join hk k on k.id = h.id
      left join public.institutions i on i.id = h.institution_id),
    'snapshots', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'holding', k.key, 'date', v.on_date::text, 'amount', trim_scale(v.amount)::text)
             order by k.key, v.on_date), '[]')
      from public.holding_snapshots v join hk k on k.id = v.holding_id),
    'contributions', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'holding', k.key, 'date', c.on_date::text, 'amount', trim_scale(c.amount)::text,
               'label', c.label)
             order by k.key, c.on_date, c.created_at), '[]')
      from public.holding_contributions c join hk k on k.id = c.holding_id),
    'holding_transfers', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'from_holding', f.key, 'to_holding', o.key, 'date', x.on_date::text,
               'amount', trim_scale(x.amount)::text)
             order by x.on_date, x.created_at), '[]')
      from public.holding_transfers x
      join hk f on f.id = x.from_holding_id
      join hk o on o.id = x.to_holding_id));
$$;

revoke execute on function public.export_data() from public, anon;
grant execute on function public.export_data() to authenticated;
