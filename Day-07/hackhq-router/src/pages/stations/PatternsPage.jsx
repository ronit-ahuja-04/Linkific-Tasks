import PageHeader from '../../components/layout/PageHeader.jsx';
import { EffectPatterns } from '../../components/patterns/EffectPatterns.jsx';

export default function PatternsPage() {
  return (
    <div className="station-view station-patterns">
      <PageHeader breadcrumb="PATTERNS" title="Effect Patterns" pill="9 Lifecycles" />
      <EffectPatterns />
    </div>
  );
}
