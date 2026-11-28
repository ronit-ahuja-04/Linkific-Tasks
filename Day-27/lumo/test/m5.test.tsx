import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../src/app/store';
import { daysAway, effectiveFlame } from '../src/lib/game/path';

const api = vi.hoisted(() => ({ reportContent: vi.fn() }));
vi.mock('../src/lib/api/trust', () => api);
const { ReportDialog } = await import('../src/features/learn/ReportDialog');

describe('the flame as it really stands', () => {
  const now = new Date('2026-11-28T08:00:00Z'); // 13:30 in Kolkata
  const base = { flame_days: 12, embers: 0, timezone: 'Asia/Kolkata' };

  it('stays lit today and yesterday', () => {
    expect(effectiveFlame({ ...base, last_goal_date: '2026-11-28' }, now)).toBe(12);
    expect(effectiveFlame({ ...base, last_goal_date: '2026-11-27' }, now)).toBe(12);
  });

  it('survives one missed day only with an Ember', () => {
    expect(effectiveFlame({ ...base, last_goal_date: '2026-11-26' }, now)).toBe(0);
    expect(effectiveFlame({ ...base, embers: 1, last_goal_date: '2026-11-26' }, now)).toBe(12);
  });

  it('is out after longer breaks, and counts the days away', () => {
    expect(effectiveFlame({ ...base, embers: 2, last_goal_date: '2026-11-20' }, now)).toBe(0);
    expect(daysAway('2026-11-20', 'Asia/Kolkata', now)).toBe(8);
    expect(daysAway(null, 'UTC', now)).toBeNull();
  });
});

describe('Report a problem', () => {
  it('sends the reason and note, then closes', async () => {
    api.reportContent.mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <Provider store={createAppStore()}>
        <ReportDialog questionId="q1" onClose={onClose} />
      </Provider>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Something here upset me'));
    expect(screen.getByText(/talking to someone you trust/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Anything else? (optional)'), 'The example felt mean');
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    expect(api.reportContent).toHaveBeenCalledWith('q1', 'wellbeing', 'The example felt mean');
    expect(onClose).toHaveBeenCalled();
  });
});
