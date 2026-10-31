import PageHeader from '../../components/layout/PageHeader.jsx';
import { HackClock } from '../../components/clock/HackClock.jsx';

export default function ClockPage({ laps, onAddLap, onClearLaps }) {
  return (
    <div className="station-view station-clock">
      <PageHeader breadcrumb="HACK CLOCK" title="Hack Clock" pill="Interval" />
      <HackClock laps={laps} onAddLap={onAddLap} onClearLaps={onClearLaps} />
    </div>
  );
}
