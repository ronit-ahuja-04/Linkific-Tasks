import PageHeader from '../../components/layout/PageHeader.jsx';
import { HackClock } from '../../components/clock/HackClock.jsx';

export default function ClockPage() {
  return (
    <div>
      <PageHeader breadcrumb="HACK CLOCK" title="Hack Clock" pill="Interval" />
      <HackClock />
    </div>
  );
}
