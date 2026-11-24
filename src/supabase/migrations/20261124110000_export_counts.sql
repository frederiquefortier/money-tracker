-- IMP-04: how many rows each export file holds, for the Exporter tab. Counted from
-- export_data() itself so the numbers always match the files (about 0.35 s for eight
-- years of history), and only the counts leave the database.
create function public.export_counts()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_object_agg(e.k, jsonb_array_length(e.v))
  from jsonb_each(public.export_data()) as e (k, v);
$$;

revoke execute on function public.export_counts() from public, anon;
grant execute on function public.export_counts() to authenticated;
