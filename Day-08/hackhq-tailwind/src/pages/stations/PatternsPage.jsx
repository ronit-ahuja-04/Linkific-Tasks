import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import { buttonClass } from '../../components/ui.jsx';
import { EffectPatterns } from '../../components/patterns/EffectPatterns.jsx';

export default function PatternsPage() {
  return (
    <div>
      <PageHeader breadcrumb="PATTERNS" title="Effect Patterns" pill="9 Lifecycles">
        <Link to="/patterns/navigation" className={buttonClass({ variant: 'secondary' })}>
          <span>Navigation patterns</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </PageHeader>
      <EffectPatterns />
    </div>
  );
}
