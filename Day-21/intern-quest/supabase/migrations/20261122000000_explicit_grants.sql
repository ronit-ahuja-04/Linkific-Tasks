-- Explicit privileges for the server's role.
--
-- The first migration relied on Supabase's default grants: locally every new table in `public` is granted to the API
-- roles automatically, but newer Supabase cloud projects no longer do that ("permission denied for table characters"
-- on the first production deploy). Granting on purpose is clearer anyway: the server role gets what it needs, the
-- public roles get nothing.

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- and for anything a later migration creates
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;

-- the public roles stay locked out (Row Level Security is on with no policies as well)
revoke all on all tables in schema public from anon, authenticated;
