import { test, expect, newUser, clientFor, anonClient, URL, KEY } from './fixtures';

/**
 * ROW LEVEL SECURITY, attacked for real. No browser here: each test is a different person talking to the live
 * API with supabase-js, exactly as a hostile user with the public key and their own login could. (The pgTAP
 * tests in supabase/tests/database prove the same rules inside Postgres; this proves the whole stack enforces
 * them: API gateway, PostgREST, Storage and Realtime.)
 */

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const person = async (label) => clientFor(newUser(label), { signUp: true });

/** Wait for a Realtime channel to be joined */
function joined(channel) {
  return new Promise((resolve, reject) => {
    channel.subscribe((status, error) => {
      if (status === 'SUBSCRIBED') resolve();
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(error ?? new Error(`channel ${status}`));
    });
  });
}
async function eventually(check, { timeout = 8000, every = 100 } = {}) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await check()) return true;
    await wait(every);
  }
  return false;
}

test.describe('a visitor with only the public key', () => {
  test('reads nothing and writes nothing', async () => {
    const anon = anonClient();
    for (const table of ['profiles', 'notes', 'rooms', 'messages', 'files', 'notifications']) {
      const { data, error } = await anon.from(table).select('*').limit(5);
      expect(error, `${table} select`).toBeNull(); // no error: RLS simply shows no rows
      expect(data, `${table} rows`).toEqual([]);
    }
    const insert = await anon.from('notes').insert({ title: 'anonymous graffiti' });
    expect(insert.error?.code).toBe('42501');
    const search = await anon.rpc('search_notes', { q: 'standup' });
    expect(search.data).toEqual([]);
    const stats = await anon.rpc('workspace_stats');
    expect(stats.data).toMatchObject({ my_notes: 0, team_notes: 0, rooms: 0 });
  });

  test('cannot list private storage, and a private object has no public URL', async () => {
    const owner = await person('vault');
    const path = `${owner.id}/secret-${Date.now()}.txt`;
    const upload = await owner.client.storage.from('attachments').upload(path, new Blob(['top secret']), { contentType: 'text/plain' });
    expect(upload.error).toBeNull();
    const anon = anonClient();
    const download = await anon.storage.from('attachments').download(path);
    expect(download.error).not.toBeNull();
    const publicUrl = `${URL}/storage/v1/object/public/attachments/${path}`;
    expect((await fetch(publicUrl)).ok, 'the public URL of a private bucket').toBe(false);
  });
});

test.describe('two people, one database', () => {
  test('private notes stay private, team notes are readable but not writable', async () => {
    const [alice, bob] = [await person('alice'), await person('bob')];
    const secret = (await alice.client.from('notes').insert({ title: 'alice private', body: 'pineapple', visibility: 'private' }).select().single()).data;
    const shared = (await alice.client.from('notes').insert({ title: 'alice team', body: 'pineapple', visibility: 'team' }).select().single()).data;

    // bob looks
    expect((await bob.client.from('notes').select('*').eq('id', secret.id)).data).toEqual([]);
    expect((await bob.client.from('notes').select('title').eq('id', shared.id)).data).toEqual([{ title: 'alice team' }]);
    const found = (await bob.client.rpc('search_notes', { q: 'pineapple' })).data.map((n) => n.title);
    expect(found).toContain('alice team');
    expect(found).not.toContain('alice private');

    // bob tries to change and delete
    const update = await bob.client.from('notes').update({ title: 'hacked' }).eq('id', shared.id).select();
    expect(update.data).toEqual([]); // zero rows: not an error, the row is just not his to touch
    const del = await bob.client.from('notes').delete().eq('id', shared.id).select();
    expect(del.data).toEqual([]);
    const still = (await alice.client.from('notes').select('title').eq('id', shared.id).single()).data;
    expect(still.title).toBe('alice team');
  });

  test('forging ownership is refused', async () => {
    const [alice, bob] = [await person('forgea'), await person('forgeb')];
    const forged = await bob.client.from('notes').insert({ title: 'written in alice name', owner_id: alice.id });
    expect(forged.error?.code).toBe('42501');
    const mine = (await bob.client.from('notes').insert({ title: 'mine' }).select().single()).data;
    expect(mine.owner_id, 'owner_id defaults to the caller, from the JWT').toBe(bob.id);
    const handOver = await bob.client.from('notes').update({ owner_id: alice.id }).eq('id', mine.id);
    expect(handOver.error?.code).toBe('42501');
    const fakeProfile = await bob.client.from('profiles').insert({ id: crypto.randomUUID(), username: 'ghost_user' });
    expect(fakeProfile.error?.code).toBe('42501');
    const takeOver = await bob.client.from('profiles').update({ username: 'stolen_name' }).eq('id', alice.id).select();
    expect(takeOver.data).toEqual([]);
  });

  test('a filter cannot be used for SQL injection', async () => {
    const alice = await person('inject');
    await alice.client.from('notes').insert({ title: 'plain title' });
    const { data, error } = await alice.client.from('notes').select('*').eq('title', `x' OR '1'='1`);
    expect(error).toBeNull();
    expect(data).toEqual([]); // the value is a bound parameter, never part of the SQL text
  });

  test('private rooms: outsiders cannot read, post or join; the creator can let someone in', async () => {
    const [host, guest] = [await person('host'), await person('guest')];
    const room = (await host.client.from('rooms').insert({ name: `Closed ${Date.now()}`, is_private: true }).select().single()).data;
    await host.client.from('messages').insert({ room_id: room.id, body: 'members only' });

    expect((await guest.client.from('rooms').select('*').eq('id', room.id)).data).toEqual([]);
    expect((await guest.client.from('messages').select('*').eq('room_id', room.id)).data).toEqual([]);
    expect((await guest.client.from('messages').insert({ room_id: room.id, body: 'knock knock' })).error?.code).toBe('42501');
    expect((await guest.client.rpc('mark_room_read', { p_room: room.id })).error?.code).toBe('42501');
    expect((await guest.client.from('room_members').insert({ room_id: room.id, user_id: guest.id })).error?.code).toBe('42501');

    expect((await host.client.from('room_members').insert({ room_id: room.id, user_id: guest.id })).error).toBeNull();
    expect((await guest.client.from('messages').select('body').eq('room_id', room.id)).data).toEqual([{ body: 'members only' }]);
  });

  test('notifications cannot be forged, and only read_at can be changed', async () => {
    const [sender, target] = [await person('sender'), await person('target')];
    const room = (await sender.client.from('rooms').insert({ name: `Open ${Date.now()}`, is_private: false }).select().single()).data;
    const targetName = (await target.client.from('profiles').select('username').eq('id', target.id).single()).data.username;
    const message = (await sender.client.from('messages').insert({ room_id: room.id, body: `hello @${targetName}` }).select().single()).data;

    const forged = await sender.client.from('notifications').insert({ user_id: target.id, type: 'mention', room_id: room.id, message_id: message.id, message: 'forged' });
    expect(forged.error?.code).toBe('42501');

    // the trigger made one for the target: they see it, the sender does not
    const mine = (await target.client.from('notifications').select('*')).data;
    expect(mine).toHaveLength(1);
    expect((await sender.client.from('notifications').select('*')).data).toEqual([]);

    const rewrite = await target.client.from('notifications').update({ message: 'rewritten' }).eq('id', mine[0].id);
    expect(rewrite.error?.code, 'column-level privilege: only read_at is writable').toBe('42501');
    const read = await target.client.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', mine[0].id).select();
    expect(read.data[0].read_at).not.toBeNull();
  });
});

test.describe('JWT: what the database knows about you', () => {
  test('the access token carries the user id and role that RLS reads', async () => {
    const user = await person('claims');
    const [, payload] = user.accessToken.split('.');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    expect(claims.sub).toBe(user.id);
    expect(claims.role).toBe('authenticated');
    expect(claims.aud).toBe('authenticated');
    expect(claims.iss).toContain('/auth/v1');
    expect(claims.exp - claims.iat).toBe(3600);
    // a tampered token (role changed) is rejected by the API gateway
    const forged = `${user.accessToken.split('.')[0]}.${Buffer.from(JSON.stringify({ ...claims, role: 'service_role' })).toString('base64url')}.${user.accessToken.split('.')[2]}`;
    const response = await fetch(`${URL}/rest/v1/notes?select=id`, { headers: { apikey: KEY, Authorization: `Bearer ${forged}` } });
    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
  });
});

test.describe('Storage', () => {
  test('folders are owned: nobody writes into, reads from or signs links for another user\'s folder', async () => {
    const [owner, other] = [await person('fileowner'), await person('fileother')];
    const path = `${owner.id}/plan-${Date.now()}.txt`;
    expect((await owner.client.storage.from('attachments').upload(path, new Blob(['plan']), { contentType: 'text/plain' })).error).toBeNull();

    expect((await other.client.storage.from('attachments').download(path)).error).not.toBeNull();
    expect((await other.client.storage.from('attachments').createSignedUrl(path, 60)).error).not.toBeNull();
    expect((await other.client.storage.from('attachments').upload(`${owner.id}/planted.txt`, new Blob(['x']))).error).not.toBeNull();
    expect((await other.client.storage.from('avatars').upload(`${owner.id}/avatar.png`, new Blob(['x']), { contentType: 'image/png' })).error).not.toBeNull();
    expect((await other.client.storage.from('attachments').remove([path])).data ?? []).toHaveLength(0);
    expect((await owner.client.storage.from('attachments').download(path)).error).toBeNull();
  });

  test('a signed URL works without a login, and stops working when it expires', async () => {
    const owner = await person('signer');
    const path = `${owner.id}/temp-${Date.now()}.txt`;
    await owner.client.storage.from('attachments').upload(path, new Blob(['temporary']), { contentType: 'text/plain' });
    const { data, error } = await owner.client.storage.from('attachments').createSignedUrl(path, 3);
    expect(error).toBeNull();
    const early = await fetch(data.signedUrl);
    expect(early.ok).toBe(true);
    expect(await early.text()).toBe('temporary');
    await wait(4000);
    expect((await fetch(data.signedUrl)).ok, 'after the expiry').toBe(false);
  });

  test('avatars are public; the file size and type limits are enforced by the bucket', async () => {
    const user = await person('avatarist');
    const path = `${user.id}/me.png`;
    const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0));
    expect((await user.client.storage.from('avatars').upload(path, png, { contentType: 'image/png' })).error).toBeNull();
    const url = user.client.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    expect((await fetch(url)).status, 'anyone, no login').toBe(200);
    const wrongType = await user.client.storage.from('avatars').upload(`${user.id}/doc.pdf`, new Blob(['%PDF']), { contentType: 'application/pdf' });
    expect(wrongType.error, 'avatars accept images only').not.toBeNull();
    const tooBig = await user.client.storage.from('avatars').upload(`${user.id}/big.png`, new Blob([new Uint8Array(2 * 1024 * 1024 + 10)]), { contentType: 'image/png' });
    expect(tooBig.error, 'avatars are limited to 2 MiB').not.toBeNull();
  });

  test('a file attached to a message is readable by the room, and only by the room', async () => {
    const [sender, member, stranger] = [await person('sharer'), await person('roommate'), await person('outsider')];
    const room = (await sender.client.from('rooms').insert({ name: `Share ${Date.now()}`, is_private: true }).select().single()).data;
    await sender.client.from('room_members').insert({ room_id: room.id, user_id: member.id });
    const path = `${sender.id}/shared-${Date.now()}.txt`;
    await sender.client.storage.from('attachments').upload(path, new Blob(['for the room']), { contentType: 'text/plain' });
    const file = (await sender.client.from('files').insert({ path, name: 'shared.txt', mime: 'text/plain', size: 12 }).select().single()).data;

    expect((await member.client.storage.from('attachments').download(path)).error, 'before it is attached').not.toBeNull();
    await sender.client.from('messages').insert({ room_id: room.id, body: 'see attachment', attachment_id: file.id });
    const download = await member.client.storage.from('attachments').download(path);
    expect(download.error).toBeNull();
    expect(await download.data.text()).toBe('for the room');
    expect((await member.client.from('files').select('name').eq('id', file.id)).data).toEqual([{ name: 'shared.txt' }]);
    expect((await stranger.client.storage.from('attachments').download(path)).error).not.toBeNull();
    expect((await stranger.client.from('files').select('id').eq('id', file.id)).data).toEqual([]);
  });
});

test.describe('Realtime obeys RLS', () => {
  test('a subscriber is sent only the changes they are allowed to read', async () => {
    const [alice, bob] = [await person('rta'), await person('rtb')];
    const seen = [];
    const channel = bob.client.channel(`notes-${Date.now()}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notes' }, (change) => seen.push(change.new.title));
    await joined(channel);
    await wait(1000); // "SUBSCRIBED" arrives a moment before the server follows the database: changes made in that gap are missed

    await alice.client.from('notes').insert({ title: 'rt private', visibility: 'private' });
    await alice.client.from('notes').insert({ title: 'rt team', visibility: 'team' });
    expect(await eventually(() => seen.includes('rt team'))).toBe(true);
    await wait(1500); // give a wrongly-delivered private row time to show up
    expect(seen).not.toContain('rt private');
    await bob.client.removeChannel(channel);
  });

  test('messages of a private room reach members and nobody else; a mention arrives as a live notification', async () => {
    const [host, member, outsider] = [await person('rth'), await person('rtm'), await person('rto')];
    const room = (await host.client.from('rooms').insert({ name: `Live ${Date.now()}`, is_private: true }).select().single()).data;
    await host.client.from('room_members').insert({ room_id: room.id, user_id: member.id });
    const memberName = (await member.client.from('profiles').select('username').eq('id', member.id).single()).data.username;

    const memberSees = [];
    const outsiderSees = [];
    const notifications = [];
    const listen = (client, into) => client.channel(`room-${room.id}-${Math.random()}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${room.id}` }, (c) => into.push(c.new.body));
    const memberChannel = listen(member.client, memberSees);
    const outsiderChannel = listen(outsider.client, outsiderSees);
    const bell = member.client.channel(`bell-${member.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${member.id}` }, (c) => notifications.push(c.new.message));
    await Promise.all([joined(memberChannel), joined(outsiderChannel), joined(bell)]);

    await host.client.from('messages').insert({ room_id: room.id, body: `secret plan for @${memberName}` });
    expect(await eventually(() => memberSees.length === 1)).toBe(true);
    expect(await eventually(() => notifications.length === 1)).toBe(true);
    expect(notifications[0]).toContain('secret plan');
    await wait(1500);
    expect(outsiderSees, 'an outsider is sent nothing').toEqual([]);
    await Promise.all([member.client.removeChannel(memberChannel), outsider.client.removeChannel(outsiderChannel), member.client.removeChannel(bell)]);
  });

  test('Broadcast and Presence work between two clients without touching the database', async () => {
    const [a, b] = [await person('bca'), await person('bcb')];
    const topic = `ephemeral-${Date.now()}`;
    const heard = [];
    const channelA = a.client.channel(topic, { config: { presence: { key: 'a' } } });
    const channelB = b.client.channel(topic, { config: { presence: { key: 'b' } } });
    channelB.on('broadcast', { event: 'typing' }, ({ payload }) => heard.push(payload.name));
    let online = [];
    channelA.on('presence', { event: 'sync' }, () => { online = Object.keys(channelA.presenceState()).sort(); });
    await Promise.all([joined(channelA), joined(channelB)]);
    await channelA.track({ name: 'A' });
    await channelB.track({ name: 'B' });
    await channelA.send({ type: 'broadcast', event: 'typing', payload: { name: 'A' } });
    expect(await eventually(() => heard.includes('A'))).toBe(true);
    expect(await eventually(() => online.join() === 'a,b')).toBe(true);
    await Promise.all([a.client.removeChannel(channelA), b.client.removeChannel(channelB)]);
  });
});
