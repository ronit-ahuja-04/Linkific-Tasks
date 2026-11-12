import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import has from 'lodash/has';
import inRange from 'lodash/inRange';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isInteger from 'lodash/isInteger';
import isPlainObject from 'lodash/isPlainObject';
import keys from 'lodash/keys';
import merge from 'lodash/merge';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import set from 'lodash/set';
import sortBy from 'lodash/sortBy';
import startCase from 'lodash/startCase';
import trim from 'lodash/trim';
import union from 'lodash/union';
import unset from 'lodash/unset';
import xor from 'lodash/xor';
import flatMap from 'lodash/flatMap';

/**
 * The "complex form with nested data" half of Day 13.
 * A form edits ONE draft object. Field names are PATHS into that object ("address.geo.lat"),
 * and get/set read and write by path, so one generic Field component can edit any depth.
 */

/** The parts of a user the form may edit */
export const EDITABLE = ['firstName', 'lastName', 'email', 'age', 'department', 'role', 'salary', 'bio', 'skills', 'address', 'preferences'];

/** Defaults for anything a user does not have yet. merge() fills the gaps without losing values. */
export const DEFAULTS = {
  bio: '',
  skills: [],
  address: { street: '', city: '', country: '', geo: { lat: 0, lng: 0 } },
  preferences: { theme: 'light', language: 'en', notifications: { email: true, push: false, sms: false }, privacy: { showSalary: false, showEmail: true } },
};

/**
 * pick() copies only the listed properties, cloneDeep() makes the copy independent: editing the
 * draft can never change the original object by accident (a shallow clone() would share the
 * nested address and preferences objects).
 */
export const createDraft = (user) => merge({}, DEFAULTS, cloneDeep(pick(user, EDITABLE)));

/** get(object, 'a.b[0].c', fallback): never throws, even when something on the way is missing */
export const getField = (draft, path, fallback = '') => get(draft, path, fallback);

/** set() writes by path and creates the missing parents. It changes its argument, so copy first. */
export function setField(draft, path, value) {
  const next = cloneDeep(draft);
  set(next, path, value);
  return next;
}

/** unset() removes a property by path */
export function removeField(draft, path) {
  const next = cloneDeep(draft);
  unset(next, path);
  return next;
}

/** xor(a, b) keeps what is in only one of the two lists: adds a missing skill, removes a present one */
export const toggleSkill = (draft, skill) => setField(draft, 'skills', xor(draft.skills, [skill]));

/** Every leaf of a nested object as a path: { a: { b: 1 }, c: [1] } -> ['a.b', 'c'] */
export function leafPaths(value, prefix = '') {
  if (!isPlainObject(value)) return prefix ? [prefix] : [];
  return flatMap(keys(value), (key) => leafPaths(value[key], prefix ? `${prefix}.${key}` : key));
}

/** The paths that differ between two objects. isEqual() compares deeply (arrays too). */
export function changedPaths(original, draft) {
  const paths = union(leafPaths(original), leafPaths(draft));
  return sortBy(paths.filter((path) => !isEqual(get(original, path), get(draft, path))));
}

export const isDirty = (original, draft) => !isEqual(original, draft);

/** Put one field back to its original value */
export const resetField = (draft, original, path) => setField(draft, path, cloneDeep(get(original, path)));

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns { 'address.geo.lat': 'Latitude must be between -90 and 90', ... }; an empty object means valid */
export function validate(draft) {
  const errors = {};
  if (isEmpty(trim(draft.firstName))) errors.firstName = 'First name is required';
  if (isEmpty(trim(draft.lastName))) errors.lastName = 'Last name is required';
  if (!EMAIL.test(draft.email ?? '')) errors.email = 'Enter a valid email address';
  if (!isInteger(Number(draft.age)) || !inRange(Number(draft.age), 18, 101)) errors.age = 'Age must be a whole number from 18 to 100';
  if (!(Number(draft.salary) >= 0)) errors.salary = 'Salary cannot be negative';
  if (isEmpty(draft.skills)) errors.skills = 'Pick at least one skill';
  const lat = Number(get(draft, 'address.geo.lat'));
  const lng = Number(get(draft, 'address.geo.lng'));
  if (!inRange(lat, -90, 90.0001)) errors['address.geo.lat'] = 'Latitude must be between -90 and 90';
  if (!inRange(lng, -180, 180.0001)) errors['address.geo.lng'] = 'Longitude must be between -180 and 180';
  return errors;
}

/** Form inputs give back strings; turn the numeric fields into numbers before saving */
export function coerce(draft) {
  const next = cloneDeep(draft);
  next.age = Number(next.age);
  next.salary = Number(next.salary);
  set(next, 'address.geo.lat', Number(get(next, 'address.geo.lat')));
  set(next, 'address.geo.lng', Number(get(next, 'address.geo.lng')));
  return next;
}

/**
 * What would be sent to a server: omit() removes properties, even nested ones by path, so salary
 * and the privacy settings can be left out of a "public profile" payload.
 */
export const publicPayload = (draft) => omit(coerce(draft), ['salary', 'preferences.privacy', 'address.street']);

export const labelFor = (path) => startCase(path.split('.').pop());
export const hasField = (draft, path) => has(draft, path);
