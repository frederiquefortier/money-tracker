-- CUR-03 changed: a user keeps a handful of currencies and the picker can be searched, so
-- a hand-kept favourite is no longer needed, as for categories. Its column grant goes
-- with the column.
alter table public.user_currencies drop column is_favourite;
