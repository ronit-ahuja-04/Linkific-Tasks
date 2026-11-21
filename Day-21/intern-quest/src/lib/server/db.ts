import 'server-only';
import type { PostgrestError } from '@supabase/supabase-js';
import { db } from './client';
import type { Json, Tables } from './database.types';
import type { CharacterClass, Difficulty, Skill } from '@/lib/game';
import type { AvatarChoice, CharacterBody, QuestBody } from '@/lib/validation';

/**
 * The ONLY door to the database. `server-only` makes importing this file from a Client Component a build error,
 * so the service key (which bypasses Row Level Security) can never reach the browser bundle.
 * Every function maps snake_case rows to camelCase objects, so the rest of the app never sees column names.
 */
/** A database error the API can explain: a duplicate, a broken rule, or something unexpected */
export class DbError extends Error {
  constructor(readonly kind: 'conflict' | 'invalid' | 'unexpected', message: string) {
    super(message);
    this.name = 'DbError';
  }
}
export function fail(error: PostgrestError, action: string): never {
  // Postgres error codes: 23505 unique_violation, 23514 check_violation, 23503 foreign_key_violation
  if (error.code === '23505') throw new DbError('conflict', `${action}: that already exists`);
  if (error.code === '23514' || error.code === '22P02') throw new DbError('invalid', `${action}: a value breaks a database rule`);
  throw new DbError('unexpected', `${action}: ${error.message}`);
}

// ---------------------------------------------------------------- characters

export interface Character {
  userId: string;
  handle: string;
  displayName: string;
  bio: string;
  class: CharacterClass;
  avatar: AvatarChoice;
  isPublic: boolean;
}
/** the columns CHARACTER_COLUMNS selects (typed selects return exactly those) */
type CharacterRow = Pick<Tables<'characters'>, 'user_id' | 'handle' | 'display_name' | 'bio' | 'class' | 'avatar' | 'is_public'>;
const CHARACTER_COLUMNS = 'user_id, handle, display_name, bio, class, avatar, is_public';
/** The avatar column is JSON (typed `Json`, i.e. anything): read each part only if it really is a whole number */
function avatarFrom(json: Json): AvatarChoice {
  const part = (key: keyof AvatarChoice): number => {
    if (typeof json !== 'object' || json === null || Array.isArray(json)) return 0;
    const value = json[key];
    return typeof value === 'number' && Number.isInteger(value) ? value : 0;
  };
  return { skin: part('skin'), hair: part('hair'), colour: part('colour'), accessory: part('accessory') };
}
const toCharacter = (r: CharacterRow): Character => ({
  userId: r.user_id, handle: r.handle, displayName: r.display_name, bio: r.bio, class: r.class, isPublic: r.is_public, avatar: avatarFrom(r.avatar),
});

export async function listCharacters(): Promise<Character[]> {
  const { data, error } = await db().from('characters').select(CHARACTER_COLUMNS).eq('is_public', true).order('handle');
  if (error) fail(error, 'Loading characters');
  return data.map(toCharacter);
}

export async function getCharacterByUser(userId: string): Promise<Character | null> {
  const { data, error } = await db().from('characters').select(CHARACTER_COLUMNS).eq('user_id', userId).maybeSingle();
  if (error) fail(error, 'Loading the character');
  return data ? toCharacter(data) : null;
}

export async function getCharacterByHandle(handle: string): Promise<Character | null> {
  const { data, error } = await db().from('characters').select(CHARACTER_COLUMNS).eq('handle', handle).maybeSingle();
  if (error) fail(error, 'Loading the character');
  return data ? toCharacter(data) : null;
}

/** Create or update the user's character (one per user) */
export async function saveCharacter(userId: string, body: CharacterBody): Promise<Character> {
  const row = { user_id: userId, handle: body.handle, display_name: body.displayName, bio: body.bio, class: body.class, avatar: { ...body.avatar }, is_public: body.isPublic };
  const { data, error } = await db().from('characters').upsert(row, { onConflict: 'user_id' }).select(CHARACTER_COLUMNS).single();
  if (error) fail(error, 'Saving the character');
  return toCharacter(data);
}

// ---------------------------------------------------------------- quests

export interface Quest {
  id: string;
  userId: string;
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
  createdAt: string;
  updatedAt: string;
}
type QuestRow = Tables<'quests'>;
const QUEST_COLUMNS = 'id, user_id, day, date, title, body, blockers, difficulty, skills, pr_links, status, is_public, created_at, updated_at';
const toQuest = (r: QuestRow): Quest => ({
  id: r.id, userId: r.user_id, day: r.day, date: r.date, title: r.title, body: r.body, blockers: r.blockers, difficulty: r.difficulty,
  skills: r.skills, prLinks: r.pr_links, status: r.status, isPublic: r.is_public, createdAt: r.created_at, updatedAt: r.updated_at,
});
const toRow = (body: QuestBody) => ({
  day: body.day, date: body.date, title: body.title, body: body.body, blockers: body.blockers, difficulty: body.difficulty,
  skills: body.skills, pr_links: body.prLinks, status: body.status, is_public: body.isPublic,
});

export async function listQuests(userId: string, status?: 'draft' | 'published'): Promise<Quest[]> {
  let query = db().from('quests').select(QUEST_COLUMNS).eq('user_id', userId);
  if (status) query = query.eq('status', status);
  const { data, error } = await query.order('day');
  if (error) fail(error, 'Loading quests');
  return data.map(toQuest);
}

export async function getQuest(id: string): Promise<Quest | null> {
  const { data, error } = await db().from('quests').select(QUEST_COLUMNS).eq('id', id).maybeSingle();
  if (error) fail(error, 'Loading the quest');
  return data ? toQuest(data) : null;
}

export async function createQuest(userId: string, body: QuestBody): Promise<Quest> {
  const { data, error } = await db().from('quests').insert({ user_id: userId, ...toRow(body) }).select(QUEST_COLUMNS).single();
  if (error) fail(error, 'Saving the quest');
  return toQuest(data);
}

export async function updateQuest(id: string, body: QuestBody): Promise<Quest> {
  const { data, error } = await db().from('quests').update(toRow(body)).eq('id', id).select(QUEST_COLUMNS).single();
  if (error) fail(error, 'Updating the quest');
  return toQuest(data);
}

export async function deleteQuest(id: string): Promise<void> {
  const { error } = await db().from('quests').delete().eq('id', id);
  if (error) fail(error, 'Deleting the quest');
}

// ---------------------------------------------------------------- mentor notes and badges

export interface Note {
  id: string;
  questId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}
type NoteRow = Tables<'notes'> & { users: { name: string } | null };
const toNote = (r: NoteRow): Note => ({ id: r.id, questId: r.quest_id, authorId: r.author_id, authorName: r.users?.name ?? 'A mentor', body: r.body, createdAt: r.created_at });

export async function listNotes(questId: string): Promise<Note[]> {
  const { data, error } = await db().from('notes').select('id, quest_id, author_id, body, created_at, users(name)').eq('quest_id', questId).order('created_at').returns<NoteRow[]>();
  if (error) fail(error, 'Loading notes');
  return data.map(toNote);
}

export async function createNote(questId: string, authorId: string, body: string): Promise<Note> {
  const { data, error } = await db().from('notes').insert({ quest_id: questId, author_id: authorId, body }).select('id, quest_id, author_id, body, created_at, users(name)').single<NoteRow>();
  if (error) fail(error, 'Saving the note');
  return toNote(data);
}

export interface MentorBadge {
  id: string;
  userId: string;
  name: string;
  note: string;
  icon: string;
  awardedBy: string | null;
  createdAt: string;
}
type BadgeRow = Tables<'badges'>;
const toBadge = (r: BadgeRow): MentorBadge => ({ id: r.id, userId: r.user_id, name: r.name, note: r.note, icon: r.icon, awardedBy: r.awarded_by, createdAt: r.created_at });

export async function listMentorBadges(userId: string): Promise<MentorBadge[]> {
  const { data, error } = await db().from('badges').select('id, user_id, name, note, icon, awarded_by, created_at').eq('user_id', userId).order('created_at');
  if (error) fail(error, 'Loading badges');
  return data.map(toBadge);
}

export async function getMentorBadge(id: string): Promise<MentorBadge | null> {
  const { data, error } = await db().from('badges').select('id, user_id, name, note, icon, awarded_by, created_at').eq('id', id).maybeSingle();
  if (error) fail(error, 'Loading the badge');
  return data ? toBadge(data) : null;
}

export async function createMentorBadge(userId: string, awardedBy: string, badge: { name: string; note: string; icon: string }): Promise<MentorBadge> {
  const { data, error } = await db().from('badges').insert({ user_id: userId, awarded_by: awardedBy, ...badge }).select('id, user_id, name, note, icon, awarded_by, created_at').single();
  if (error) fail(error, 'Saving the badge');
  return toBadge(data);
}

export async function deleteMentorBadge(id: string): Promise<void> {
  const { error } = await db().from('badges').delete().eq('id', id);
  if (error) fail(error, 'Deleting the badge');
}
