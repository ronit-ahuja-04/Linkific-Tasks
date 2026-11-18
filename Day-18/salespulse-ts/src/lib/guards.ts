import { CATEGORIES, REGIONS } from '../data/generate';
import type { Category, Region, WithAll } from '../types';
import { ALL } from './metrics';

/**
 * Type guards for values that arrive as plain strings (a <select>'s `event.target.value`, a URL, storage).
 * TypeScript can not know a string is a valid Region, so each guard checks, and only then the type narrows.
 */
export const isRegion = (value: string): value is Region => REGIONS.some((region) => region === value);
export const isCategory = (value: string): value is Category => CATEGORIES.some((category) => category === value);
export const isRegionFilter = (value: string): value is WithAll<Region> => value === ALL || isRegion(value);
export const isCategoryFilter = (value: string): value is WithAll<Category> => value === ALL || isCategory(value);

/** Is this value an object that has the field `key`? After a true answer you can read `value[key]` (as `unknown`). */
export const hasField = <K extends string>(value: unknown, key: K): value is Record<K, unknown> =>
  typeof value === 'object' && value !== null && key in value;

/** Read a numeric field out of a value of unknown shape (Recharts hands tooltips a loosely typed `payload`) */
export const numberField = (value: unknown, key: string): number | undefined => {
  if (!hasField(value, key)) return undefined;
  const field = value[key];
  return typeof field === 'number' ? field : undefined;
};

/** Read a string field out of a value of unknown shape */
export const stringField = (value: unknown, key: string): string | undefined => {
  if (!hasField(value, key)) return undefined;
  const field = value[key];
  return typeof field === 'string' ? field : undefined;
};
