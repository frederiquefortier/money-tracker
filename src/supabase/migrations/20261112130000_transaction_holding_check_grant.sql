-- The deferred triggers on transactions and their splits run as the user and call
-- check_transaction_holding, whose execute right had been revoked from `authenticated`, so
-- saving any transaction died with "permission denied". The function is security invoker:
-- it reads through the user's RLS and only raises on a holding rule, so the right is safe.
grant execute on function public.check_transaction_holding(uuid) to authenticated;
