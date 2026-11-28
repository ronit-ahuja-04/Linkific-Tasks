import type { Profile } from '../types';

/**
 * Wisp's voice. The explanation itself always comes from the lesson (written or checked by its instructor);
 * these are only the opening words, in the personality the learner picked. In M4 Wisp can also explain in its
 * own words through the AI, grounded in the same explanation.
 */
type Persona = Profile['wisp_persona'];

const LINES: Record<Persona, Record<'right' | 'wrong' | 'done' | 'fog', string[]>> = {
  cheeky: {
    right: ['Nailed it!', 'Too easy for you.', 'Show-off. I love it.', 'Yesss!'],
    wrong: ['Ooh, sneaky one.', 'Not quite. Here’s the trick:', 'Close! Look again:'],
    done: ['Look at you glow!', 'The isles are brighter already.'],
    fog: ['Gloom’s been creeping. Let’s blow it away.'],
  },
  calm: {
    right: ['That’s right.', 'Well done.', 'Exactly.'],
    wrong: ['Not this time, and that’s fine.', 'Let’s look at why:', 'Almost there.'],
    done: ['Nicely done. One more lantern lit.', 'A good step today.'],
    fog: ['A few ideas are fading. A short review will bring them back.'],
  },
  coach: {
    right: ['Correct. Keep that pace.', 'Good rep.', 'That’s the one.'],
    wrong: ['Missed. Here’s the fix:', 'Reset and look closer:', 'Learn this one:'],
    done: ['Lesson done. Momentum matters.', 'Strong session.'],
    fog: ['Fading ideas detected. Two minutes, let’s go.'],
  },
};

/** A line that varies with `seed` (e.g. the question number), so Wisp doesn't repeat itself every time. */
export function wispSays(persona: Persona, kind: keyof (typeof LINES)['calm'], seed = 0): string {
  const options = LINES[persona][kind];
  return options[Math.abs(seed) % options.length] ?? options[0]!;
}
