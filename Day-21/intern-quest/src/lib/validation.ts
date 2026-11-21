import { CLASSES, DIFFICULTIES, RULES, SKILLS, type CharacterClass, type Difficulty, type Skill } from './game';

/**
 * REQUEST VALIDATION. A request body arrives as `unknown` (anyone can send anything), so each field is checked and
 * only then typed. No casts: every value is narrowed by a test. Errors come back per field, so the UI can show
 * each message next to its input. Pure functions, unit tested.
 */
export type Parsed<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

export interface QuestBody {
  day: number;
  date: string;
  title: string;
  body: string;
  blockers: string;
  difficulty: Difficulty;
  skills: Skill[];
  prLinks: string[];
  status: 'draft' | 'published';
  isPublic: boolean;
}

export interface AvatarChoice {
  skin: number;
  hair: number;
  colour: number;
  accessory: number;
}

export interface CharacterBody {
  handle: string;
  displayName: string;
  bio: string;
  class: CharacterClass;
  avatar: AvatarChoice;
  isPublic: boolean;
}

export interface NoteBody {
  body: string;
}

export interface BadgeBody {
  handle: string;
  name: string;
  note: string;
  icon: string;
}

export const HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,22}[a-z0-9])$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: string): boolean => UUID.test(value);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const includes = <T extends string>(list: readonly T[], value: unknown): value is T => typeof value === 'string' && list.some((item) => item === value);

/** A real calendar date in YYYY-MM-DD (rejects 2026-02-30) */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Collects errors while reading fields, so one response can report every problem at once */
class Reader {
  readonly errors: Record<string, string> = {};
  constructor(private readonly source: Record<string, unknown>) {}

  text(field: string, { min = 0, max, fallback }: { min?: number; max: number; fallback?: string }): string {
    const raw = this.source[field] ?? fallback;
    if (typeof raw !== 'string') {
      this.errors[field] = `${field} must be text`;
      return '';
    }
    const value = raw.trim();
    if (value.length < min) this.errors[field] = min === 1 ? `${field} is required` : `${field} must be at least ${min} characters`;
    else if (value.length > max) this.errors[field] = `${field} must be at most ${max} characters`;
    return value;
  }

  integer(field: string, min: number, max: number): number {
    const raw = this.source[field];
    if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < min || raw > max) {
      this.errors[field] = `${field} must be a whole number from ${min} to ${max}`;
      return min;
    }
    return raw;
  }

  boolean(field: string, fallback: boolean): boolean {
    const raw = this.source[field] ?? fallback;
    if (typeof raw !== 'boolean') {
      this.errors[field] = `${field} must be true or false`;
      return fallback;
    }
    return raw;
  }

  /** `list` is a non-empty tuple, so `list[0]` is a real value (returned only alongside an error, never used) */
  oneOf<T extends string>(field: string, list: readonly [T, ...T[]], fallback?: T): T {
    const raw = this.source[field] ?? fallback;
    if (!includes(list, raw)) {
      this.errors[field] = `${field} must be one of: ${list.join(', ')}`;
      return list[0];
    }
    return raw;
  }

  date(field: string): string {
    const raw = this.source[field];
    if (!isIsoDate(raw)) {
      this.errors[field] = `${field} must be a real date like 2026-11-21`;
      return '';
    }
    return raw;
  }

  result<T>(value: T): Parsed<T> {
    return Object.keys(this.errors).length === 0 ? { ok: true, value } : { ok: false, errors: this.errors };
  }
}

const notAnObject = <T>(): Parsed<T> => ({ ok: false, errors: { body: 'The request body must be a JSON object' } });

export function parseQuest(input: unknown): Parsed<QuestBody> {
  if (!isRecord(input)) return notAnObject();
  const read = new Reader(input);
  const day = read.integer('day', 1, 366);
  const date = read.date('date');
  const title = read.text('title', { min: 3, max: 80 });
  const body = read.text('body', { max: 10_000, fallback: '' });
  const blockers = read.text('blockers', { max: 1000, fallback: '' });
  const difficulty = read.oneOf('difficulty', DIFFICULTIES, 'normal');
  const status = read.oneOf('status', ['draft', 'published'] as const, 'published');
  const isPublic = read.boolean('isPublic', true);

  let skills: Skill[] = [];
  if (!Array.isArray(input.skills) || input.skills.length < 1 || input.skills.length > RULES.maxSkills) {
    read.errors.skills = `skills must be a list of 1 to ${RULES.maxSkills} skills`;
  } else if (!input.skills.every((s): s is Skill => includes(SKILLS, s))) {
    read.errors.skills = `unknown skill; choose from: ${SKILLS.join(', ')}`;
  } else if (new Set(input.skills).size !== input.skills.length) {
    read.errors.skills = 'skills must not repeat';
  } else {
    skills = input.skills;
  }

  let prLinks: string[] = [];
  const rawLinks = input.prLinks ?? [];
  if (!Array.isArray(rawLinks) || rawLinks.length > RULES.maxPrLinks) {
    read.errors.prLinks = `prLinks must be a list of at most ${RULES.maxPrLinks} links`;
  } else if (!rawLinks.every((link): link is string => typeof link === 'string' && link.length <= 300 && /^https?:\/\/\S+$/.test(link))) {
    read.errors.prLinks = 'each PR link must be an http(s) URL';
  } else {
    prLinks = rawLinks;
  }

  return read.result({ day, date, title, body, blockers, difficulty, skills, prLinks, status, isPublic });
}

export function parseCharacter(input: unknown): Parsed<CharacterBody> {
  if (!isRecord(input)) return notAnObject();
  const read = new Reader(input);
  const handle = read.text('handle', { min: 1, max: 24 }).toLowerCase();
  if (!read.errors.handle && !HANDLE_PATTERN.test(handle)) read.errors.handle = 'handle must be 3 to 24 lowercase letters, digits or inner hyphens';
  const displayName = read.text('displayName', { min: 1, max: 40 });
  const bio = read.text('bio', { max: 280, fallback: '' });
  const characterClass = read.oneOf('class', CLASSES);
  const isPublic = read.boolean('isPublic', true);

  const avatar: AvatarChoice = { skin: 0, hair: 0, colour: 0, accessory: 0 };
  const rawAvatar = input.avatar ?? {};
  if (!isRecord(rawAvatar)) read.errors.avatar = 'avatar must be an object';
  else {
    for (const part of ['skin', 'hair', 'colour', 'accessory'] as const) {
      const value = rawAvatar[part] ?? 0;
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 7) read.errors.avatar = `avatar.${part} must be a whole number from 0 to 7`;
      else avatar[part] = value;
    }
  }
  return read.result({ handle, displayName, bio, class: characterClass, avatar, isPublic });
}

export function parseNote(input: unknown): Parsed<NoteBody> {
  if (!isRecord(input)) return notAnObject();
  const read = new Reader(input);
  return read.result({ body: read.text('body', { min: 1, max: 1000 }) });
}

export function parseBadge(input: unknown): Parsed<BadgeBody> {
  if (!isRecord(input)) return notAnObject();
  const read = new Reader(input);
  const handle = read.text('handle', { min: 1, max: 24 }).toLowerCase();
  const name = read.text('name', { min: 2, max: 40 });
  const note = read.text('note', { max: 280, fallback: '' });
  const icon = read.text('icon', { min: 1, max: 8, fallback: '🏅' });
  return read.result({ handle, name, note, icon });
}
