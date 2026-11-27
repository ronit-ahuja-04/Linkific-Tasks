import type { PipMood } from '../../types/lms';

const GREETINGS: Record<PipMood, readonly string[]> = {
  happy: [
    'Pick a Realm and let us grab some XP today!',
    'I warmed up the video theater. Ready for the next Quest?',
    'Small lessons build mighty Guardians.',
  ],
  proud: [
    'Look at those XP bars climb! I am telling the whole Guild.',
    'Another badge on the shelf. Can I polish it?',
    'Level up energy! Keep the streak rolling.',
  ],
  fired_up: [
    'Boss Quiz ahead! Take a breath — you know this.',
    'Streak flames active! Nothing stops us today.',
    'Combo mode ready. Let us crush this chapter!',
  ],
  worried: [
    'Tricky question? Jump back to the lesson clip — no shame in a quick replay.',
    'Every missed Boss Quiz is just reconnaissance.',
  ],
  sleepy: [
    'Zzz... oh! Ready to wake up our learning streak?',
    'Even one 5-minute lesson wakes the dragon.',
  ],
};

function hashText(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function pipLineFor(mood: PipMood, seedKey: string): string {
  const options = GREETINGS[mood];
  return options[hashText(seedKey) % options.length] ?? options[0] ?? 'Ready for your next quest!';
}

export function pipMoodForStats(completedLessons: number, passedQuizzes: number): PipMood {
  if (passedQuizzes > 0) return 'proud';
  if (completedLessons >= 3) return 'fired_up';
  if (completedLessons === 0) return 'sleepy';
  return 'happy';
}
