import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import { EffectPatterns } from '../../components/patterns/EffectPatterns.jsx';

export default function PatternsPage() {
  return (
    <div className="station-view station-patterns">
      <PageHeader breadcrumb="PATTERNS" title="Effect Patterns" pill="9 Lifecycles">
        <Link to="/patterns/navigation" className="btn btn-secondary">
          <span>Navigation patterns</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </PageHeader>
      <EffectPatterns />
    </div>
  );
}
