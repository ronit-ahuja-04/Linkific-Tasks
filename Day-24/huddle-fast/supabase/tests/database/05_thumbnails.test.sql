-- Day 24: files.thumb_path, the small preview of an image (migration 20261125000001).
begin;
select plan(5);

insert into auth.users (id, email, raw_user_meta_data, aud, role)
values ('95000000-0000-4000-8000-000000000001', 'thumbs@example.com', '{}', 'authenticated', 'authenticated');

select has_column('public', 'files', 'thumb_path', 'files has a thumb_path column');
select col_is_null('public', 'files', 'thumb_path', 'thumb_path is optional (not images, and older files, have none)');

-- the owner writes their own file rows, as the app does
select set_config('request.jwt.claims', '{"sub":"95000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select lives_ok($$
  insert into public.files (owner_id, path, name, mime, size, thumb_path)
  values ('95000000-0000-4000-8000-000000000001', '95000000-0000-4000-8000-000000000001/a-photo.jpg', 'photo.jpg', 'image/jpeg', 1000,
          '95000000-0000-4000-8000-000000000001/a-photo.jpg.thumb.webp')
$$, 'a thumbnail in the owner''s folder is accepted');

select throws_ok($$
  insert into public.files (owner_id, path, name, mime, size, thumb_path)
  values ('95000000-0000-4000-8000-000000000001', '95000000-0000-4000-8000-000000000001/b-photo.jpg', 'b.jpg', 'image/jpeg', 1000,
          '00000000-0000-4000-8000-000000000000/someone-elses.webp')
$$, '23514', null, 'a thumbnail path in another user''s folder is refused (it would point at someone else''s object)');

select lives_ok($$
  insert into public.files (owner_id, path, name, mime, size)
  values ('95000000-0000-4000-8000-000000000001', '95000000-0000-4000-8000-000000000001/c-notes.txt', 'notes.txt', 'text/plain', 10)
$$, 'a file without a thumbnail is fine');

select * from finish();
rollback;
