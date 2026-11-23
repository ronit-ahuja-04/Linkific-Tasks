-- =====================================================================================================
-- Huddle, migration 6: Realtime
--
-- Supabase Realtime streams row changes from Postgres' write-ahead log to the browser over a websocket.
-- A table has to be added to the "supabase_realtime" publication first. Realtime then applies the table's
-- RLS policies to every change before sending it: a user only ever receives rows they could SELECT.
-- (Typing indicators and "who is online" do not touch the database at all: they use Broadcast and Presence.)
-- =====================================================================================================

alter publication supabase_realtime add table public.messages, public.notifications, public.notes, public.room_members;

-- REPLICA IDENTITY FULL: an UPDATE or DELETE event then carries the whole old row, not just its id
alter table public.messages      replica identity full;
alter table public.notes         replica identity full;
alter table public.notifications replica identity full;
