import { m, useReducedMotion } from 'motion/react';
import { BookOpen, CheckCircle2, Clock, Flame, Search, Sparkles, Star, Swords } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { DEMO_REALM_CURRICULA } from '../../lib/demoCurricula';
import { SKILL_LABELS, SKILLS } from '../../lib/game/catalog';
import { sfx } from '../../lib/game/sfx';
import type { CourseLevel, SkillTag } from '../../types/lms';
import {
  fetchRealms,
  resetCatalogFilters,
  setCatalogCategory,
  setCatalogLevel,
  setCatalogQuery,
  setCatalogSkillTag,
  setCatalogSort,
  type CatalogSort,
} from './catalogSlice';

export function CatalogPage() {
  const dispatch = useAppDispatch();
  const reduce = useReducedMotion();
  const { realms, status, error, filters } = useAppSelector((state) => state.catalog);
  const { enrolledCourseIds, completedLessonIds, passedQuizCourseIds } = useAppSelector(
    (state) => state.quest,
  );

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchRealms());
    }
  }, [dispatch, status]);

  const categories = useMemo(() => {
    const unique = new Set(realms.map((realm) => realm.category));
    return ['all', ...Array.from(unique)];
  }, [realms]);

  const filteredRealms = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const list = realms.filter((realm) => {
      if (filters.category !== 'all' && realm.category !== filters.category) return false;
      if (filters.level !== 'all' && realm.level !== filters.level) return false;
      if (filters.skillTag !== 'all' && realm.skillTag !== filters.skillTag) return false;
      if (q) {
        const hay =
          `${realm.title} ${realm.subtitle} ${realm.instructorName} ${realm.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (filters.sort === 'xp') return b.xpReward - a.xpReward;
      if (filters.sort === 'rating') return b.avgRating - a.avgRating;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [realms, filters]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-brand">
            <Swords className="h-3.5 w-3.5" aria-hidden="true" />
            Course Realms
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Choose Your Next Quest Realm</h1>
          <p className="mt-1 text-sm text-muted">
            Each Realm opens a playable winding overworld map with micro-challenges and a Boss
            Battle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="catalog-sort" className="text-xs font-bold text-muted">
            Sort by
          </label>
          <select
            id="catalog-sort"
            value={filters.sort}
            onChange={(e) => dispatch(setCatalogSort(e.target.value as CatalogSort))}
            className="rounded-xl border-2 border-line bg-surface px-3 py-2 text-sm font-semibold focus:border-brand focus:outline-none"
          >
            <option value="xp">Highest XP Reward</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest Realms</option>
          </select>
        </div>
      </div>

      <div className="rpg-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <label htmlFor="catalog-search" className="sr-only">
            Search realms
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            id="catalog-search"
            type="search"
            value={filters.query}
            onChange={(e) => dispatch(setCatalogQuery(e.target.value))}
            placeholder="Search realms, topics, instructors..."
            className="w-full rounded-xl border-2 border-line bg-surface py-2 pr-3 pl-9 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="catalog-category" className="sr-only">
            Filter by category
          </label>
          <select
            id="catalog-category"
            value={filters.category}
            onChange={(e) => dispatch(setCatalogCategory(e.target.value))}
            className="w-full rounded-xl border-2 border-line bg-surface px-3 py-2 text-sm font-semibold focus:border-brand focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="catalog-level" className="sr-only">
            Filter by difficulty level
          </label>
          <select
            id="catalog-level"
            value={filters.level}
            onChange={(e) => dispatch(setCatalogLevel(e.target.value as 'all' | CourseLevel))}
            className="w-full rounded-xl border-2 border-line bg-surface px-3 py-2 text-sm font-semibold focus:border-brand focus:outline-none"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label htmlFor="catalog-skill" className="sr-only">
            Filter by skill tag
          </label>
          <select
            id="catalog-skill"
            value={filters.skillTag}
            onChange={(e) => dispatch(setCatalogSkillTag(e.target.value as 'all' | SkillTag))}
            className="w-full rounded-xl border-2 border-line bg-surface px-3 py-2 text-sm font-semibold focus:border-brand focus:outline-none"
          >
            <option value="all">All Skills</option>
            {SKILLS.map((skill) => (
              <option key={skill} value={skill}>
                {SKILL_LABELS[skill]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger"
        >
          {error.message}
        </div>
      )}

      {status === 'loading' ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rpg-card h-72 animate-pulse bg-surface-2/60 p-5" />
          ))}
        </div>
      ) : filteredRealms.length === 0 ? (
        <div className="rpg-card p-8 text-center">
          <h2 className="text-lg font-bold">No Course Realms match those filters</h2>
          <p className="mt-1 text-sm text-muted">
            Try clearing your search or switching difficulty level.
          </p>
          <button
            type="button"
            onClick={() => dispatch(resetCatalogFilters())}
            className="rpg-btn-primary mt-4 rounded-xl px-4 py-2 text-sm font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredRealms.map((realm, idx) => {
            const cur = DEMO_REALM_CURRICULA[realm.id];
            const totalSteps = (cur?.nodes.length ?? 0) + (cur?.boss ? 1 : 0);
            const clearedNodes =
              cur?.nodes.filter((node) => completedLessonIds.includes(node.id)).length ?? 0;
            const bossBeaten = passedQuizCourseIds.includes(realm.id);
            const completedSteps = clearedNodes + (bossBeaten ? 1 : 0);
            const enrolled = enrolledCourseIds.includes(realm.id) || completedSteps > 0;
            const pct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

            return (
              <m.article
                key={realm.id}
                initial={reduce ? false : { opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={reduce ? undefined : { y: -6, scale: 1.015 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 22,
                  delay: Math.min(idx * 0.06, 0.3),
                }}
                className="rpg-card flex flex-col justify-between p-5 transition-colors hover:border-brand"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-bold text-brand">
                      {realm.category} · {SKILL_LABELS[realm.skillTag]}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold/30 px-2.5 py-1 font-mono text-xs font-extrabold text-ink dark:text-gold">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />+{realm.xpReward} XP
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-bold leading-snug">{realm.title}</h2>
                  <p className="mt-1.5 text-sm text-muted">{realm.subtitle}</p>

                  {enrolled && totalSteps > 0 && (
                    <div className="mt-3 rounded-xl border border-line bg-surface-2/70 p-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="inline-flex items-center gap-1 text-brand">
                          {bossBeaten ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-good" aria-hidden="true" />
                          ) : (
                            <Flame className="h-3.5 w-3.5 text-warn" aria-hidden="true" />
                          )}
                          {bossBeaten ? 'Realm Conquered' : 'Quest In Progress'}
                        </span>
                        <span className="font-mono">{pct}%</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface">
                        <div
                          className="xp-bar-fill h-full rounded-full bg-gradient-to-r from-brand to-gold"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 space-y-3 border-t border-line pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-muted">
                    <span className="capitalize">{realm.level}</span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                      {realm.lessonsCount} quests
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {realm.estimatedMinutes}m
                    </span>
                    <span className="inline-flex items-center gap-1 text-ink">
                      <Star className="h-3.5 w-3.5 fill-gold text-gold-deep" aria-hidden="true" />
                      {realm.avgRating > 0 ? `${realm.avgRating} (${realm.reviewCount})` : 'New'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Link
                      to={`/c/${realm.instructorHandle}`}
                      className="text-xs font-semibold text-muted hover:text-brand"
                    >
                      Guide: {realm.instructorName}
                    </Link>
                    <Link
                      to={`/courses/${realm.slug}`}
                      onClick={() => sfx.tap()}
                      className="rpg-btn-primary rounded-xl px-4 py-2 text-xs font-bold"
                    >
                      {bossBeaten ? 'Replay Realm' : enrolled ? 'Continue Quest' : 'Enter Realm'}
                    </Link>
                  </div>
                </div>
              </m.article>
            );
          })}
        </div>
      )}
    </section>
  );
}
