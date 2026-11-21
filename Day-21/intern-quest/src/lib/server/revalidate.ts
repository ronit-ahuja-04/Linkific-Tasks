import 'server-only';
import { revalidateTag } from 'next/cache';

/**
 * Cache tags. The public pages (milestone 5) cache a character sheet under `character:<handle>` and the Guild hall
 * under `guild`. After any write the API marks those stale; with the 'max' profile the next visitor gets the old
 * page instantly while the new one is built in the background.
 */
export const tags = {
  character: (handle: string) => `character:${handle}`,
  guild: 'guild',
} as const;

export function refreshCharacter(handle: string): void {
  revalidateTag(tags.character(handle), 'max');
  revalidateTag(tags.guild, 'max');
}
