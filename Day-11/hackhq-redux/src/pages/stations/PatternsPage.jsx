import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import { Button } from '../../components/ui.jsx';
import { EffectPatterns } from '../../components/patterns/EffectPatterns.jsx';

export default function PatternsPage() {
  return (
    <div>
      <PageHeader breadcrumb="PATTERNS" title="Effect Patterns" pill="9 Lifecycles">
        <Button as={Link} to="/patterns/navigation" $variant="secondary">
          <span>Navigation patterns</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </PageHeader>
      <EffectPatterns />
    </div>
  );
}
