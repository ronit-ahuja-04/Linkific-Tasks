-- =====================================================================================================
-- Huddle, migration 5: Storage buckets and their policies
--
-- A bucket is a folder of files. Two kinds:
--   avatars      PUBLIC   anyone with the URL can see the picture; only the owner can change it
--   attachments  PRIVATE  nobody can read a file without a policy saying so, or a short-lived signed URL
-- Files are stored under  <user id>/<file name>  so a policy can check "is this MY folder?".
-- Storage policies are ordinary RLS policies on the table storage.objects.
-- =====================================================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',     'avatars',     true,  2097152,  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('attachments', 'attachments', false, 10485760, null)
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- ---- avatars -------------------------------------------------------------------------------------------
create policy "avatars are readable by everyone"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "upload an avatar into my own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "replace my own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "delete my own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---- attachments (private) ---------------------------------------------------------------------------
-- Read: my own files, or a file attached to a message in a room I can read. (storage.objects.name is spelled
-- out because the files table has a column called "name" too.)
create policy "read my attachments, and those shared in my rooms"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'attachments'
    and (
      (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
      or exists (
        select 1
        from public.files f
        join public.messages m on m.attachment_id = f.id
        where f.path = storage.objects.name and public.can_access_room(m.room_id)
      )
    )
  );

create policy "upload attachments into my own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "replace my own attachments"
  on storage.objects for update to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "delete my own attachments"
  on storage.objects for delete to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
