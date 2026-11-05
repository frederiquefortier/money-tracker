-- CAT-03: archives recorded before via_category_id. A sub-category archived on the same
-- day as its parent, after it, was taken along by archive_category or add_category_pause.
update public.category_status_events e
set via_category_id = p.category_id
from public.categories c, public.category_status_events p
where e.via_category_id is null
  and e.status = 'archived'
  and c.id = e.category_id
  and p.category_id = c.parent_id
  and p.user_id = e.user_id
  and p.status = 'archived'
  and p.effective_on = e.effective_on
  and p.id < e.id;
