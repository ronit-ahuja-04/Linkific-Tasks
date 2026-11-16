import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
  addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, increment, query, setDoc, updateDoc, where,
} from 'firebase/firestore';

/**
 * Security rules tests (run with `npm run test:rules`, needs Java and the Firestore emulator).
 * Each test acts as a signed-in or signed-out user and checks that Firestore allows or denies the
 * exact operations FlowLane performs.
 */
const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8189').split(':');
let env;

const ann = 'u1'; // owner of p1
const bob = 'u2'; // member of p1
const cy = 'u3'; // not in p1, invited by email
const eve = 'u4'; // outsider

const asUser = (uid, email = `${uid}@x.com`) => env.authenticatedContext(uid, { email }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-flowlane',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host, port: Number(port) },
  });
});
afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const uid of [ann, bob, cy, eve]) {
      await setDoc(doc(db, 'users', uid), { uid, email: `${uid}@x.com`, displayName: uid, unreadMessages: 0 });
    }
    await setDoc(doc(db, 'projects', 'p1'), {
      name: 'P1', owner: ann, members: [ann, bob],
      tasks: {}, columns: { todo: { id: 'todo', taskIds: [] } }, columnOrder: ['todo'],
    });
    await setDoc(doc(db, 'projects', 'p1', 'messages', 'm1'), { uid: ann, text: 'hi' });
    await setDoc(doc(db, 'users', ann, 'notifications', 'n1'), { message: 'hello', read: false });
    await setDoc(doc(db, 'invitations', 'inv1'), { projectId: 'p1', inviteeEmail: `${cy}@x.com`, projectName: 'P1' });
    await setDoc(doc(db, 'direct_messages', `${ann}_${bob}`, 'messages', 'd1'), { uid: ann, text: 'psst' });
  });
});

describe('signed-out visitors', () => {
  it('can read and write nothing', async () => {
    const db = anon();
    await assertFails(getDoc(doc(db, 'users', ann)));
    await assertFails(getDocs(collection(db, 'users')));
    await assertFails(getDoc(doc(db, 'projects', 'p1')));
    await assertFails(setDoc(doc(db, 'projects', 'px'), { name: 'x', owner: 'a', members: ['a'] }));
    await assertFails(getDocs(collection(db, 'invitations')));
  });
});

describe('users', () => {
  it('any signed-in user can read profiles and query them by email or uid', async () => {
    const db = asUser(eve);
    await assertSucceeds(getDoc(doc(db, 'users', ann)));
    await assertSucceeds(getDocs(collection(db, 'users')));
    await assertSucceeds(getDocs(query(collection(db, 'users'), where('email', '==', `${ann}@x.com`))));
    await assertSucceeds(getDocs(query(collection(db, 'users'), where('uid', '==', eve))));
  });

  it('you can write your own profile (sign-in merge, theme, unread reset) but not anyone else\'s', async () => {
    const db = asUser(ann);
    await assertSucceeds(setDoc(doc(db, 'users', ann), { uid: ann, email: `${ann}@x.com`, displayName: 'Ann', lastSeen: 'now' }, { merge: true }));
    await assertSucceeds(updateDoc(doc(db, 'users', ann), { theme: 'dark' }));
    await assertSucceeds(updateDoc(doc(db, 'users', ann), { unreadMessages: 0 }));
    await assertFails(setDoc(doc(db, 'users', bob), { displayName: 'Hacked' }, { merge: true }));
    await assertFails(updateDoc(doc(db, 'users', bob), { theme: 'dark' }));
    await assertFails(deleteDoc(doc(db, 'users', bob)));
  });

  it('others may only bump your unread counter (a direct message), nothing else', async () => {
    const db = asUser(bob);
    await assertSucceeds(updateDoc(doc(db, 'users', ann), { unreadMessages: increment(1) }));
    await assertFails(updateDoc(doc(db, 'users', ann), { unreadMessages: 'lots' }));
    await assertFails(updateDoc(doc(db, 'users', ann), { unreadMessages: increment(1), displayName: 'Hacked' }));
    await assertFails(updateDoc(doc(db, 'users', ann), { email: 'evil@x.com' }));
  });
});

describe('notifications', () => {
  it('only the owner reads and dismisses them', async () => {
    await assertSucceeds(getDocs(collection(asUser(ann), 'users', ann, 'notifications')));
    await assertSucceeds(deleteDoc(doc(asUser(ann), 'users', ann, 'notifications', 'n1')));
    await assertFails(getDocs(collection(asUser(bob), 'users', ann, 'notifications')));
    await assertFails(deleteDoc(doc(asUser(bob), 'users', ann, 'notifications', 'n1')));
  });

  it('other signed-in users can create one for you, including the fixed assignment id', async () => {
    const db = asUser(bob);
    await assertSucceeds(addDoc(collection(db, 'users', ann, 'notifications'), { message: 'Bob assigned you', read: false }));
    await assertSucceeds(setDoc(doc(db, 'users', ann, 'notifications', 'assign_t1'), { message: 'x', type: 'assignment' }, { merge: true }));
    await assertFails(addDoc(collection(db, 'users', ann, 'notifications'), { text: 'no message field' }));
    await assertFails(addDoc(collection(anon(), 'users', ann, 'notifications'), { message: 'anon' }));
  });
});

describe('projects', () => {
  it('members read their project; outsiders and signed-out users cannot', async () => {
    await assertSucceeds(getDoc(doc(asUser(bob), 'projects', 'p1')));
    await assertFails(getDoc(doc(asUser(eve), 'projects', 'p1')));
    await assertFails(getDoc(doc(anon(), 'projects', 'p1')));
  });

  it('the "my projects" query works for yourself and is denied for someone else\'s uid', async () => {
    await assertSucceeds(getDocs(query(collection(asUser(bob), 'projects'), where('members', 'array-contains', bob))));
    await assertSucceeds(getDocs(query(collection(asUser(eve), 'projects'), where('members', 'array-contains', eve))));
    await assertFails(getDocs(query(collection(asUser(eve), 'projects'), where('members', 'array-contains', ann))));
    await assertFails(getDocs(collection(asUser(eve), 'projects')));
  });

  it('creating a project requires you as a member, a name and an owner', async () => {
    const db = asUser(ann);
    await assertSucceeds(setDoc(doc(db, 'projects', 'new'), { name: 'N', owner: ann, members: [ann] }));
    await assertSucceeds(setDoc(doc(db, 'projects', 'assigned'), { name: 'N', owner: bob, members: [ann, bob] }));
    await assertFails(setDoc(doc(db, 'projects', 'stolen'), { name: 'N', owner: bob, members: [bob] })); // not a member yourself
    await assertFails(setDoc(doc(db, 'projects', 'noname'), { owner: ann, members: [ann] }));
  });

  it('members edit the board (drag, create, delete, edit a task)', async () => {
    const db = asUser(bob);
    await assertSucceeds(updateDoc(doc(db, 'projects', 'p1'), { columns: { todo: { id: 'todo', taskIds: ['t1'] } } }));
    await assertSucceeds(updateDoc(doc(db, 'projects', 'p1'), { 'tasks.t1': { id: 't1', content: 'x' }, 'columns.todo.taskIds': ['t1'] }));
    await assertFails(updateDoc(doc(asUser(eve), 'projects', 'p1'), { columns: {} }));
  });

  it('only the owner changes membership; members cannot add or remove people', async () => {
    await assertSucceeds(updateDoc(doc(asUser(ann), 'projects', 'p1'), { members: [ann, bob, cy] }));
    await assertFails(updateDoc(doc(asUser(bob), 'projects', 'p1'), { members: [ann, bob, eve] }));
    await assertFails(updateDoc(doc(asUser(bob), 'projects', 'p1'), { members: [bob] }));
  });

  it('an invited user can add only themselves, once', async () => {
    await assertSucceeds(updateDoc(doc(asUser(cy), 'projects', 'p1'), { members: arrayUnion(cy) }));
    await assertSucceeds(getDoc(doc(asUser(cy), 'projects', 'p1'))); // now a member
  });

  it('an outsider cannot join someone else, add extra people, or sneak in other changes', async () => {
    const db = asUser(eve);
    await assertFails(updateDoc(doc(db, 'projects', 'p1'), { members: arrayUnion(cy) }));
    await assertFails(updateDoc(doc(db, 'projects', 'p1'), { members: arrayUnion(eve, cy) }));
    await assertFails(updateDoc(doc(db, 'projects', 'p1'), { members: arrayUnion(eve), owner: eve }));
    await assertFails(updateDoc(doc(db, 'projects', 'p1'), { members: arrayUnion(eve), name: 'Pwned' }));
  });

  it('only the owner deletes a project', async () => {
    await assertFails(deleteDoc(doc(asUser(bob), 'projects', 'p1')));
    await assertFails(deleteDoc(doc(asUser(eve), 'projects', 'p1')));
    await assertSucceeds(deleteDoc(doc(asUser(ann), 'projects', 'p1')));
  });
});

describe('project chat', () => {
  it('members read and post as themselves', async () => {
    const db = asUser(bob);
    await assertSucceeds(getDocs(collection(db, 'projects', 'p1', 'messages')));
    await assertSucceeds(addDoc(collection(db, 'projects', 'p1', 'messages'), { uid: bob, text: 'yo' }));
    await assertFails(addDoc(collection(db, 'projects', 'p1', 'messages'), { uid: ann, text: 'spoofed' }));
  });

  it('outsiders cannot read or post, and messages cannot be edited or deleted', async () => {
    await assertFails(getDocs(collection(asUser(eve), 'projects', 'p1', 'messages')));
    await assertFails(addDoc(collection(asUser(eve), 'projects', 'p1', 'messages'), { uid: eve, text: 'x' }));
    await assertFails(updateDoc(doc(asUser(ann), 'projects', 'p1', 'messages', 'm1'), { text: 'edited' }));
    await assertFails(deleteDoc(doc(asUser(ann), 'projects', 'p1', 'messages', 'm1')));
  });

  it('typing status: members write only their own document', async () => {
    await assertSucceeds(setDoc(doc(asUser(bob), 'projects', 'p1', 'typing', bob), { isTyping: true }));
    await assertFails(setDoc(doc(asUser(bob), 'projects', 'p1', 'typing', ann), { isTyping: true }));
    await assertSucceeds(getDocs(collection(asUser(bob), 'projects', 'p1', 'typing')));
    await assertFails(setDoc(doc(asUser(eve), 'projects', 'p1', 'typing', eve), { isTyping: true }));
  });
});

describe('invitations', () => {
  it('the invitee sees (query by their email) and answers their own invitations', async () => {
    const db = asUser(cy);
    await assertSucceeds(getDocs(query(collection(db, 'invitations'), where('inviteeEmail', '==', `${cy}@x.com`))));
    await assertSucceeds(deleteDoc(doc(db, 'invitations', 'inv1')));
  });

  it('nobody else can read or delete them, and you cannot list another person\'s', async () => {
    await assertFails(getDoc(doc(asUser(eve), 'invitations', 'inv1')));
    await assertFails(deleteDoc(doc(asUser(eve), 'invitations', 'inv1')));
    await assertFails(getDocs(query(collection(asUser(eve), 'invitations'), where('inviteeEmail', '==', `${cy}@x.com`))));
    await assertFails(getDocs(collection(asUser(eve), 'invitations')));
  });

  it('only project members can invite', async () => {
    const data = { projectId: 'p1', inviteeEmail: 'new@x.com', inviterName: 'x', projectName: 'P1' };
    await assertSucceeds(addDoc(collection(asUser(bob), 'invitations'), data));
    await assertFails(addDoc(collection(asUser(eve), 'invitations'), data));
    await assertFails(addDoc(collection(asUser(bob), 'invitations'), { projectId: 'p1' }));
  });
});

describe('direct messages', () => {
  const chat = `${ann}_${bob}`;

  it('the two people can read and write as themselves', async () => {
    await assertSucceeds(getDocs(collection(asUser(bob), 'direct_messages', chat, 'messages')));
    await assertSucceeds(addDoc(collection(asUser(bob), 'direct_messages', chat, 'messages'), { uid: bob, text: 'hey' }));
    await assertSucceeds(setDoc(doc(asUser(ann), 'direct_messages', chat, 'typing', ann), { isTyping: true }));
  });

  it('a third person cannot read, write or spoof', async () => {
    await assertFails(getDocs(collection(asUser(eve), 'direct_messages', chat, 'messages')));
    await assertFails(addDoc(collection(asUser(eve), 'direct_messages', chat, 'messages'), { uid: eve, text: 'x' }));
    await assertFails(addDoc(collection(asUser(bob), 'direct_messages', chat, 'messages'), { uid: ann, text: 'spoof' }));
    await assertFails(setDoc(doc(asUser(bob), 'direct_messages', chat, 'typing', ann), { isTyping: true }));
    await assertFails(getDocs(collection(anon(), 'direct_messages', chat, 'messages')));
  });
});

describe('everything else is closed', () => {
  it('denies unknown collections', async () => {
    await assertFails(getDoc(doc(asUser(ann), 'secrets', 'x')));
    await assertFails(setDoc(doc(asUser(ann), 'secrets', 'x'), { a: 1 }));
  });
});
