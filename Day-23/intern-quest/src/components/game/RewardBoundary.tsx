'use client';

import { catchError, type ErrorInfo } from 'next/error';
import { useEffect, useRef } from 'react';
import { isChunkError } from '@/lib/error-view';
import { reportClientError } from '@/lib/report-client';
import type { Reward } from '@/lib/server/quests';

/**
 * A boundary around the reward screen. The reward screen is loaded on demand (next/dynamic), AFTER the quest has been
 * saved. If its code can not load (a new version was deployed while the tab was open) or it crashes, the quest is
 * still saved, and the user must be told so: before Day 23 they saw "This page couldn't load" and would have tried
 * again, only to be told the day was already logged (inventory row C11, finding E-4).
 */
function RewardFallback({ reward, onDone }: { reward: Reward; onDone: () => void }, { error }: ErrorInfo) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    reportClientError(error, 'boundary');
  }, [error]);
  return (
    <div className="reward-fallback" role="dialog" aria-modal="true" aria-labelledby="reward-fallback-title">
      <div className="card">
        <h2 id="reward-fallback-title" ref={heading} tabIndex={-1}>Quest saved: +{reward.xpGained} XP</h2>
        <p>
          {isChunkError(error)
            ? 'The celebration could not load, because Intern Quest was just updated. Your quest and its XP are saved.'
            : 'The celebration could not be shown, but your quest and its XP are saved.'}
        </p>
        <button type="button" className="big-button" onClick={onDone}>Back to my journal</button>
      </div>
    </div>
  );
}

export default catchError(RewardFallback);
