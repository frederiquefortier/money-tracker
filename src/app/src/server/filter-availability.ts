import { createServerFn } from '@tanstack/react-start'
import { loaded } from '#/lib/server/db.server'
import { getSupabase } from '#/lib/server/supabase.server'
import type { FilterTab } from '#/lib/transactions/transaction-filters'

/**
 * The transaction filters with nothing to choose from, one row looked for in
 * each table, so the bar can disable them without loading their lists.
 */
export const getEmptyFilters = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<FilterTab>> => {
    const supabase = getSupabase()
    const [accounts, categories, merchants, people, groups, events, holdings] =
      loaded(
        'Filters',
        ...(await Promise.all([
          supabase.from('accounts').select('id').limit(1),
          supabase.from('categories').select('id').limit(1),
          supabase.from('merchants').select('id').limit(1),
          supabase.from('people').select('id').limit(1),
          supabase.from('person_groups').select('id').limit(1),
          supabase.from('events').select('id').limit(1),
          supabase.from('holdings').select('id').limit(1),
        ])),
      )
    const none: Array<FilterTab> = []
    if (!accounts.length) none.push('accounts')
    if (!categories.length) none.push('categories')
    if (!merchants.length) none.push('merchants')
    if (!people.length && !groups.length) none.push('people')
    if (!events.length) none.push('events')
    if (!holdings.length) none.push('holdings')
    return none
  },
)
