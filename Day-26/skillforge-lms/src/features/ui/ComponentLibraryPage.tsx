import { BookOpen, CheckCircle2, Layers, Search, Sparkles, Swords } from 'lucide-react';
import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  Select,
  Textarea,
  type BadgeTone,
  type ButtonVariant,
  type LoadingVariant,
} from '../../components/ui';

const BUTTON_VARIANTS: readonly ButtonVariant[] = [
  'primary',
  'gold',
  'secondary',
  'outline',
  'ghost',
  'danger',
];

const BADGE_TONES: readonly BadgeTone[] = ['brand', 'gold', 'good', 'warn', 'danger', 'neutral'];

export function ComponentLibraryPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sampleInput, setSampleInput] = useState('maya');
  const [sampleSelect, setSampleSelect] = useState('frontend_mage');
  const [sampleNotes, setSampleNotes] = useState('');
  const [loadingMode, setLoadingMode] = useState<LoadingVariant>('spinner');
  const [simulateError, setSimulateError] = useState(false);

  const handleError =
    sampleInput.trim().length > 0 && sampleInput.trim().length < 3
      ? 'Handle must be at least 3 characters.'
      : undefined;

  return (
    <section className="space-y-8">
      <Card variant="brand" padding="lg">
        <Badge tone="gold" icon={<Layers className="h-3.5 w-3.5" />}>
          SkillForge UI Kit · Day 26
        </Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Component Library &amp; Design System
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">
          Strongly typed, accessible UI primitives built on SkillForge&apos;s Plum, Violet, and Gold
          Tailwind v4 tokens. Every interactive component enforces semantic roles, keyboard support,
          and reduced-motion compliance.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="none">
          <CardHeader>
            <h2 className="text-xl font-bold">Buttons &amp; Variants</h2>
            <p className="text-xs text-muted">
              Supports primary, gold, secondary, outline, ghost, danger, sizes (sm/md/lg), icons,
              and async loading states.
            </p>
          </CardHeader>
          <CardBody className="space-y-5">
            <div className="flex flex-wrap gap-2.5">
              {BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant} className="capitalize">
                  {variant}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button size="sm" leftIcon={<Sparkles className="h-3.5 w-3.5" />}>
                Small
              </Button>
              <Button size="md" leftIcon={<BookOpen className="h-4 w-4" />}>
                Medium
              </Button>
              <Button size="lg" variant="gold" rightIcon={<Swords className="h-4 w-4" />}>
                Large CTA
              </Button>
              <Button loading loadingText="Saving Quest...">
                Save
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card padding="none">
          <CardHeader>
            <h2 className="text-xl font-bold">Badges &amp; Card Surfaces</h2>
            <p className="text-xs text-muted">
              Semantic status pills and composable CardHeader / CardBody / CardFooter containers.
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {BADGE_TONES.map((tone) => (
                <Badge key={tone} tone={tone} className="capitalize">
                  {tone}
                </Badge>
              ))}
              <Badge tone="good" size="sm" icon={<CheckCircle2 className="h-3 w-3" />}>
                Verified
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card variant="muted" padding="sm">
                <p className="font-display text-sm font-bold">Muted Card</p>
                <p className="mt-1 text-xs text-muted">Secondary surface for callouts and tips.</p>
              </Card>
              <Card variant="gold" padding="sm">
                <p className="font-display text-sm font-bold">Gold Card</p>
                <p className="mt-1 text-xs text-muted">Highlights podiums and earned rewards.</p>
              </Card>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="none">
          <CardHeader>
            <h2 className="text-xl font-bold">Accessible Form Controls</h2>
            <p className="text-xs text-muted">
              Auto-linked label, hint, and error IDs via React useId() with aria-invalid feedback.
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Guild Handle"
              value={sampleInput}
              onChange={(e) => setSampleInput(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              hint="Try clearing down to 2 characters to preview validation state."
              error={handleError}
              placeholder="e.g. maya"
            />
            <Select
              label="Character Class"
              value={sampleSelect}
              onChange={(e) => setSampleSelect(e.target.value)}
              options={[
                { value: 'frontend_mage', label: 'Frontend Mage (+10% React/UI XP)' },
                { value: 'backend_knight', label: 'Backend Knight (+10% Database XP)' },
                { value: 'fullstack_ranger', label: 'Full-stack Ranger' },
                { value: 'design_bard', label: 'Design Bard' },
              ]}
            />
            <Textarea
              label="Quest Notes"
              rows={2}
              value={sampleNotes}
              onChange={(e) => setSampleNotes(e.target.value)}
              placeholder="Capture reflections or architectural notes..."
            />
          </CardBody>
        </Card>

        <Card padding="none">
          <CardHeader>
            <h2 className="text-xl font-bold">Modal, Loading &amp; Error States</h2>
            <p className="text-xs text-muted">
              Interactive dialog focus management, skeleton loaders, and recoverable error banners.
            </p>
          </CardHeader>
          <CardBody className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="gold" onClick={() => setModalOpen(true)}>
                Open Demo Modal
              </Button>
              <Button variant="outline" onClick={() => setSimulateError((prev) => !prev)}>
                {simulateError ? 'Clear Error Demo' : 'Trigger Error State'}
              </Button>
            </div>

            {simulateError && (
              <ErrorState
                code="QUEST_SYNC_TIMEOUT"
                message="Could not reach local Supabase node. Running safely in offline Demo Mode."
                onRetry={() => setSimulateError(false)}
                actionLabel="Recover"
              />
            )}

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-muted">Loading variant:</span>
                {(['spinner', 'skeleton-cards', 'skeleton-rows'] as const).map((mode) => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={loadingMode === mode ? 'primary' : 'outline'}
                    onClick={() => setLoadingMode(mode)}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
              <LoadingState
                variant={loadingMode}
                count={loadingMode === 'skeleton-cards' ? 2 : 2}
                label="Loading Guild quest data..."
              />
            </div>
          </CardBody>
          <CardFooter className="text-xs text-muted">
            Full prop tables and TypeScript interfaces are documented in Day-26/COMPONENTS.md.
          </CardFooter>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Guild Component Modal"
        description="Press Escape, click outside the backdrop, or use the action buttons below."
        closeLabel="Close demo modal"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Confirm Quest
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Modals trap heading focus on mount, restore focus on close, and respect
          prefers-reduced-motion automatically.
        </p>
      </Modal>
    </section>
  );
}
