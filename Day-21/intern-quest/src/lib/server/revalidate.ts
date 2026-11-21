import 'server-only';
import { revalidateTag } from 'next/cache';

/**
 * Cache tags. The public pages cache a character sheet under `character:<handle>` and the Guild hall board under
 * `guild` (see public.ts). After any write the API expires those entries.
 *
 * `{ expire: 0 }` rather than the 'max' profile: with 'max' the next visitor is served the OLD page while a new one is
 * built, so you would click "See my sheet" right after publishing and not find your quest. Route handlers can not use
 * `updateTag` (Server Actions only), so an immediate expiry is the documented choice here.
 */
export const tags = {
  character: (handle: string) => `character:${handle}`,
  guild: 'guild',
} as const;

export function refreshCharacter(handle: string): void {
  revalidateTag(tags.character(handle), { expire: 0 });
  revalidateTag(tags.guild, { expire: 0 });
}
