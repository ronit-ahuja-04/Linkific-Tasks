import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  applyPatch, countRoles, createUser, freeze, makeUser, summarise, updateSettings,
  type AdminOrGuest, type DeepPartial, type DeepReadonly, type Defined, type FrozenUser, type FullUser, type Loaded, type MadeUser,
  type MakeUserArgs, type MyOmit, type MyPartial, type MyPick, type MyRequired, type MyExclude, type Mutable, type NewUser,
  type NonAdminRole, type Role, type RoleCounts, type Settings, type User, type UserPatch, type UserSummary,
} from '../src/01-utility-types';

const ann = makeUser('Ann');

describe('01 utility types', () => {
  it('Partial: a patch may hold any subset', () => {
    const patch: UserPatch = { name: 'Anna' };
    expect(applyPatch(ann, patch).name).toBe('Anna');
    expect(applyPatch(ann, {})).toEqual(ann);
    expectTypeOf<UserPatch['id']>().toEqualTypeOf<number | undefined>();
    // @ts-expect-error  Partial still checks the types of the keys it has: age is not a User property
    const bad: UserPatch = { age: 3 };
    expect(bad).toBeDefined();
  });

  it('Required: optional keys become mandatory', () => {
    expectTypeOf<FullUser['email']>().toEqualTypeOf<string>();
    // @ts-expect-error  email is required in FullUser
    const full: FullUser = { id: 1, name: 'A', createdAt: 'x', role: 'guest' };
    expect(full).toBeDefined();
  });

  it('Readonly: shallow, compile-time only', () => {
    const frozen: FrozenUser = freeze(ann);
    expect(() => {
      // @ts-expect-error  cannot assign to a readonly property
      frozen.name = 'Bob';
    }).toThrow(); // and Object.freeze makes it fail at run time as well
    expect(Object.isFrozen(frozen)).toBe(true);
  });

  it('Pick and Omit', () => {
    expect(summarise(ann)).toEqual({ id: 1, name: 'Ann' });
    expectTypeOf<UserSummary>().toEqualTypeOf<{ id: number; name: string }>();
    const input: NewUser = { name: 'Bo', role: 'guest' };
    expect(createUser(input, 7).id).toBe(7);
    // @ts-expect-error  a NewUser has no id: the server decides it
    const withId: NewUser = { id: 1, name: 'Bo', role: 'guest' };
    expect(withId).toBeDefined();
  });

  it('Record: all keys required', () => {
    expect(countRoles([ann, makeUser('B', 'admin')])).toEqual({ admin: 1, member: 1, guest: 0 });
    // @ts-expect-error  'guest' is missing
    const counts: RoleCounts = { admin: 0, member: 0 };
    expect(counts).toBeDefined();
  });

  it('Exclude and Extract work on unions', () => {
    expectTypeOf<NonAdminRole>().toEqualTypeOf<'member' | 'guest'>();
    expectTypeOf<AdminOrGuest>().toEqualTypeOf<'admin' | 'guest'>();
    // @ts-expect-error  'admin' was excluded
    const r: NonAdminRole = 'admin';
    expect(r).toBe('admin');
  });

  it('NonNullable, ReturnType, Parameters, Awaited', async () => {
    expectTypeOf<Defined>().toEqualTypeOf<string>();
    expectTypeOf<MadeUser>().toEqualTypeOf<User>();
    expectTypeOf<MakeUserArgs>().toEqualTypeOf<[name: string, role?: Role]>();
    expectTypeOf<Loaded>().toEqualTypeOf<User>();
  });

  it('hand-written versions behave like the built-ins', () => {
    expectTypeOf<MyPartial<User>>().toEqualTypeOf<Partial<User>>();
    expectTypeOf<MyRequired<User>>().toEqualTypeOf<Required<User>>();
    expectTypeOf<MyPick<User, 'id'>>().toEqualTypeOf<Pick<User, 'id'>>();
    expectTypeOf<MyOmit<User, 'id'>>().toEqualTypeOf<Omit<User, 'id'>>();
    expectTypeOf<MyExclude<Role, 'guest'>>().toEqualTypeOf<Exclude<Role, 'guest'>>();
    expectTypeOf<Mutable<FrozenUser>>().toEqualTypeOf<{ id: number; name: string; email?: string; createdAt: string; role: Role }>();
  });

  it('DeepPartial reaches nested keys, Partial does not', () => {
    const base: Settings = { theme: { mode: 'light', accent: 'blue' }, notifications: { email: true, push: false }, tags: ['a'] };
    const next = updateSettings(base, { theme: { mode: 'dark' } });
    expect(next.theme).toEqual({ mode: 'dark', accent: 'blue' });
    expect(next.notifications).toEqual(base.notifications);
    // @ts-expect-error  Partial<Settings> would demand the WHOLE theme object
    const shallow: Partial<Settings> = { theme: { mode: 'dark' } };
    expect(shallow).toBeDefined();
    expectTypeOf<DeepPartial<Settings>['theme']>().toEqualTypeOf<{ mode?: 'light' | 'dark'; accent?: string } | undefined>();
  });

  it('DeepReadonly blocks nested writes', () => {
    const s: DeepReadonly<Settings> = { theme: { mode: 'light', accent: 'x' }, notifications: { email: true, push: true }, tags: ['a'] };
    // @ts-expect-error  nested property is readonly too (Readonly<Settings> would allow this)
    s.theme.accent = 'red';
    // @ts-expect-error  readonly arrays have no push
    s.tags.push('b');
    expect(s.tags.length).toBe(2);
  });
});
