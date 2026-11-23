-- Demo data for LOCAL development only (`supabase db reset` runs this; a cloud project never does unless you ask).
-- Two demo accounts, both with the password  demo-password-123

do $$
declare
  ada   uuid := '11111111-1111-4111-8111-111111111111';
  grace uuid := '22222222-2222-4222-8222-222222222222';
  general uuid; random_room uuid; leads uuid;
  n1 uuid; n2 uuid; t1 uuid;
begin
  -- Users go through auth.users, exactly like a real sign-up. The handle_new_user trigger makes their profiles.
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values
    ('00000000-0000-0000-0000-000000000000', ada,   'authenticated', 'authenticated', 'ada@example.com',
     crypt('demo-password-123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ada Lovelace"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', grace, 'authenticated', 'authenticated', 'grace@example.com',
     crypt('demo-password-123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Grace Hopper"}', now(), now(), '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values
    (gen_random_uuid(), ada,   ada::text,   jsonb_build_object('sub', ada::text,   'email', 'ada@example.com'),   'email', now(), now(), now()),
    (gen_random_uuid(), grace, grace::text, jsonb_build_object('sub', grace::text, 'email', 'grace@example.com'), 'email', now(), now(), now());

  -- Rooms are created "as" a user: auth.uid() reads this setting, and the policies see an authenticated session
  perform set_config('request.jwt.claims', jsonb_build_object('sub', ada, 'role', 'authenticated')::text, true);
  insert into public.rooms (name, topic, is_private, created_by) values ('General', 'Everything and nothing', false, ada)  returning id into general;
  insert into public.rooms (name, topic, is_private, created_by) values ('Random',  'Cats, links, lunch',     false, ada)  returning id into random_room;
  insert into public.rooms (name, topic, is_private, created_by) values ('Leads',   'Only the leads',         true,  ada)  returning id into leads;
  insert into public.room_members (room_id, user_id, role) values (general, grace, 'member');

  insert into public.messages (room_id, user_id, body) values
    (general, ada,   'Welcome to Huddle! Say hi, share notes, drop files.'),
    (general, grace, 'Hi Ada. I wrote up the release checklist in my notes, shared with the team.'),
    (general, ada,   '@grace thanks, I will read it before the standup.'),
    (random_room, grace, 'Anyone tried full-text search in Postgres yet? It is quietly excellent.'),
    (leads, ada, 'Private room: only members can read this. That is row level security at work.');

  insert into public.notes (owner_id, title, body, visibility, pinned, priority)
  values (ada, 'Standup agenda', 'Review the release checklist. Decide who owns the Postgres migration. Plan the realtime demo.', 'team', true, 3)
  returning id into n1;
  insert into public.notes (owner_id, title, body, visibility, priority)
  values (ada, 'Private ideas', 'Try indexes on the messages table. Compare Firebase security rules with row level security policies.', 'private', 1)
  returning id into n2;
  insert into public.tags (owner_id, name) values (ada, 'meeting') returning id into t1;
  insert into public.note_tags (note_id, tag_id) values (n1, t1);

  perform set_config('request.jwt.claims', jsonb_build_object('sub', grace, 'role', 'authenticated')::text, true);
  insert into public.notes (owner_id, title, body, visibility, priority)
  values (grace, 'Release checklist', 'Run the database tests. Check the storage policies. Verify the realtime subscriptions. Ship on Friday.', 'team', 4);
end $$;
