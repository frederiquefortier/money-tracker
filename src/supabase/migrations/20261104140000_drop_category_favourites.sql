-- CAT-06 changed: the picker lists the most used categories first ("Fréquentes", spec 15),
-- worked out from transactions, so a hand-kept favourite is no longer needed. Its column
-- grants go with the column.
alter table public.categories drop column is_favourite;
