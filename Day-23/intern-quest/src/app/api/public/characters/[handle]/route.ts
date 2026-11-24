import { notFound, withErrors } from '@/lib/server/http';
import { getPublicSheet } from '@/lib/server/public';
import { SITE } from '@/lib/site';
import { todayIso } from '@/lib/today';
import { HANDLE_PATTERN } from '@/lib/validation';
import { buildCharacterView } from '@/lib/view';

/**
 * GET /api/public/characters/:handle   a public character as a small "quest card", for OTHER sites to show
 * (e.g. an intern's portfolio). The only cross-origin endpoint: src/proxy.ts adds the CORS headers for origins on the
 * CORS_ALLOWED_ORIGINS list (see docs/CORS.md). It returns only what /c/:handle already shows to anyone: no private
 * quests, no account data. Unknown and private characters are the same 404, so the API never confirms a private one.
 */
const NOT_FOUND = 'There is no public character with that handle.';

export const GET = withErrors(async (_request: Request, ctx: RouteContext<'/api/public/characters/[handle]'>) => {
  const handle = (await ctx.params).handle.toLowerCase();
  if (!HANDLE_PATTERN.test(handle)) return notFound(NOT_FOUND);
  const sheet = await getPublicSheet(handle); // cached ('use cache', expired by every write), like the sheet itself
  if (!sheet) return notFound(NOT_FOUND);
  const view = buildCharacterView(sheet.character, sheet.quests, sheet.badges, todayIso(), { publicOnly: true });
  const card = {
    handle: view.handle,
    name: view.name,
    class: view.classLabel,
    level: view.level,
    title: view.title,
    totalXp: view.totalXp,
    questCount: view.questCount,
    bestStreak: view.streak,
    topSkills: view.skills.slice(0, 3).map(({ label, level }) => ({ label, level })),
    badgeCount: view.badges.length,
    pip: { stage: view.pip.stage, mood: view.pip.mood },
    sheetUrl: `${SITE.url}/c/${view.handle}`,
  };
  // a minute in the browser's cache; `Vary: Origin` (set by the proxy) keeps one origin's answer from serving another
  return Response.json({ card }, { headers: { 'Cache-Control': 'public, max-age=60' } });
});
