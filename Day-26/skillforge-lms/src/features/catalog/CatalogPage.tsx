import { m, useReducedMotion } from 'motion/react';
import { BookOpen, CheckCircle2, Clock, Flame, Search, Sparkles, Star, Swords } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { PageHeader } from '../../components/layout';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  Select,
  buttonClasses,
} from '../../components/ui';
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
      <PageHeader
        eyebrow="Course Realms"
        eyebrowIcon={<Swords className="h-3.5 w-3.5" />}
        title="Choose Your Next Quest Realm"
        description="Each Realm opens a playable winding overworld map with micro-challenges and a Boss Battle."
        actions={
          <>
            <label htmlFor="catalog-sort" className="text-xs font-bold text-muted">
              Sort by
            </label>
            <Select
              id="catalog-sort"
              value={filters.sort}
              onChange={(e) => dispatch(setCatalogSort(e.target.value as CatalogSort))}
              options={[
                { value: 'xp', label: 'Highest XP Reward' },
                { value: 'rating', label: 'Highest Rated' },
                { value: 'newest', label: 'Newest Realms' },
              ]}
            />
          </>
        }
      />

      <Card padding="sm" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          id="catalog-search"
          type="search"
          label="Search realms"
          hideLabel
          leftIcon={<Search className="h-4 w-4" />}
          value={filters.query}
          onChange={(e) => dispatch(setCatalogQuery(e.target.value))}
          placeholder="Search realms, topics, instructors..."
        />

        <Select
          id="catalog-category"
          label="Filter by category"
          hideLabel
          value={filters.category}
          onChange={(e) => dispatch(setCatalogCategory(e.target.value))}
          options={categories.map((cat) => ({
            value: cat,
            label: cat === 'all' ? 'All Categories' : cat,
          }))}
        />

        <Select
          id="catalog-level"
          label="Filter by difficulty level"
          hideLabel
          value={filters.level}
          onChange={(e) => dispatch(setCatalogLevel(e.target.value as 'all' | CourseLevel))}
          options={[
            { value: 'all', label: 'All Levels' },
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
          ]}
        />

        <Select
          id="catalog-skill"
          label="Filter by skill tag"
          hideLabel
          value={filters.skillTag}
          onChange={(e) => dispatch(setCatalogSkillTag(e.target.value as 'all' | SkillTag))}
          options={[
            { value: 'all', label: 'All Skills' },
            ...SKILLS.map((skill) => ({
              value: skill,
              label: SKILL_LABELS[skill],
            })),
          ]}
        />
      </Card>

      {error && (
        <ErrorState
          code={error.code}
          message={error.message}
          onRetry={() => void dispatch(fetchRealms())}
        />
      )}

      {status === 'loading' ? (
        <LoadingState variant="skeleton-cards" count={3} label="Loading Course Realms..." />
      ) : filteredRealms.length === 0 ? (
        <Card padding="lg" className="text-center">
          <h2 className="text-lg font-bold">No Course Realms match those filters</h2>
          <p className="mt-1 text-sm text-muted">
            Try clearing your search or switching difficulty level.
          </p>
          <Button
            variant="primary"
            onClick={() => dispatch(resetCatalogFilters())}
            className="mt-4"
          >
            Reset Filters
          </Button>
        </Card>
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
                    <Badge tone="brand">
                      {realm.category} · {SKILL_LABELS[realm.skillTag]}
                    </Badge>
                    <Badge
                      tone="gold"
                      icon={<Sparkles className="h-3.5 w-3.5" />}
                      className="font-mono font-extrabold"
                    >
                      +{realm.xpReward} XP
                    </Badge>
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
                      className={buttonClasses({
                        variant: 'primary',
                        size: 'sm',
                        className: 'rounded-xl px-4 py-2',
                      })}
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
