import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Cloud Storage security rules (run with `npm run test:rules`; needs Java, the Storage and Firestore emulators).
 * The attachment rules look up the project in Firestore, so both emulators run together.
 */
const [fsHost, fsPort] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8189').split(':');
const [stHost, stPort] = (process.env.STORAGE_EMULATOR_HOST ?? '127.0.0.1:9299').replace(/^https?:\/\//, '').split(':');
let env;

const ann = 'u1'; // owner of p1
const bob = 'u2'; // member of p1
const eve = 'u4'; // outsider

const st = (uid) => env.authenticatedContext(uid).storage();
const anon = () => env.unauthenticatedContext().storage();

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const upload = (storage, path, { bytes = png, contentType = 'image/png' } = {}) =>
  uploadBytes(ref(storage, path), bytes, { contentType });

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-flowlane',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: fsHost, port: Number(fsPort) },
    storage: { rules: readFileSync('storage.rules', 'utf8'), host: stHost, port: Number(stPort) },
  });
});
afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'projects', 'p1'), { name: 'P1', owner: ann, members: [ann, bob], tasks: {}, columns: {}, columnOrder: [] });
    await upload(ctx.storage(), 'avatars/u1/seed.png');
    await upload(ctx.storage(), 'projects/p1/tasks/t1/seed.png');
  });
});

describe('avatars', () => {
  it('lets a user upload and replace their own photo', async () => {
    await assertSucceeds(upload(st(ann), 'avatars/u1/new.png'));
    await assertSucceeds(upload(st(ann), 'avatars/u1/seed.png'));
  });
  it('refuses a photo in someone else\'s folder', async () => {
    await assertFails(upload(st(bob), 'avatars/u1/evil.png'));
  });
  it('refuses a signed-out upload', async () => {
    await assertFails(upload(anon(), 'avatars/u1/anon.png'));
  });
  it('refuses anything that is not an image', async () => {
    await assertFails(upload(st(ann), 'avatars/u1/x.html', { contentType: 'text/html' }));
    await assertFails(upload(st(ann), 'avatars/u1/x.svg', { contentType: 'image/svg+xml' }));
  });
  it('refuses a photo of 2 MB or more', async () => {
    await assertFails(upload(st(ann), 'avatars/u1/big.png', { bytes: new Uint8Array(2 * 1024 * 1024 + 1) }));
    await assertSucceeds(upload(st(ann), 'avatars/u1/ok.png', { bytes: new Uint8Array(1024 * 1024) }));
  });
  it('lets any signed-in user see a photo, but not a signed-out visitor', async () => {
    await assertSucceeds(getBytes(ref(st(eve), 'avatars/u1/seed.png')));
    await assertFails(getBytes(ref(anon(), 'avatars/u1/seed.png')));
  });
  it('lets only the owner delete a photo', async () => {
    await assertFails(deleteObject(ref(st(bob), 'avatars/u1/seed.png')));
    await assertSucceeds(deleteObject(ref(st(ann), 'avatars/u1/seed.png')));
  });
});

describe('task attachments', () => {
  const file = 'projects/p1/tasks/t1/new.png';
  it('lets the project owner add an image', async () => {
    await assertSucceeds(upload(st(ann), file));
  });
  it('refuses a member who is not the owner (the board is edited by the owner only)', async () => {
    await assertFails(upload(st(bob), file));
  });
  it('refuses an outsider and a signed-out visitor', async () => {
    await assertFails(upload(st(eve), file));
    await assertFails(upload(anon(), file));
  });
  it('refuses a non-image and a file of 5 MB or more', async () => {
    await assertFails(upload(st(ann), 'projects/p1/tasks/t1/a.pdf', { contentType: 'application/pdf' }));
    await assertFails(upload(st(ann), 'projects/p1/tasks/t1/big.png', { bytes: new Uint8Array(5 * 1024 * 1024 + 1) }));
  });
  it('refuses a project that does not exist', async () => {
    await assertFails(upload(st(ann), 'projects/nope/tasks/t1/a.png'));
  });
  it('lets every member and nobody else see an attachment', async () => {
    await assertSucceeds(getBytes(ref(st(ann), 'projects/p1/tasks/t1/seed.png')));
    await assertSucceeds(getBytes(ref(st(bob), 'projects/p1/tasks/t1/seed.png')));
    await assertFails(getBytes(ref(st(eve), 'projects/p1/tasks/t1/seed.png')));
    await assertFails(getBytes(ref(anon(), 'projects/p1/tasks/t1/seed.png')));
  });
  it('lets only the owner delete an attachment', async () => {
    await assertFails(deleteObject(ref(st(bob), 'projects/p1/tasks/t1/seed.png')));
    await assertFails(deleteObject(ref(st(eve), 'projects/p1/tasks/t1/seed.png')));
    await assertSucceeds(deleteObject(ref(st(ann), 'projects/p1/tasks/t1/seed.png')));
  });
});

describe('everything else is closed', () => {
  it('refuses reads and writes outside avatars/ and projects/', async () => {
    await assertFails(upload(st(ann), 'misc/a.png'));
    await assertFails(getBytes(ref(st(ann), 'misc/a.png')));
  });
});
