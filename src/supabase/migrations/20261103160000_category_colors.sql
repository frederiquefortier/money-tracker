-- Automatic colours follow the parent (spec 12). The server computes the branch's colours
-- and writes them in one statement (ADR-012); a colour picked by hand is never touched.
create function public.recolor_categories(colors jsonb)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.categories c
  set color = x.color
  from jsonb_to_recordset(colors) as x (id uuid, color text)
  where c.id = x.id and c.color_is_auto and c.color <> x.color;
$$;

revoke execute on function public.recolor_categories(jsonb) from public, anon;
grant execute on function public.recolor_categories(jsonb) to authenticated;
