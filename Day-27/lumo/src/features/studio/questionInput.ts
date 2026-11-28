import type { QuestionInput } from '../../lib/api/studio';
import type { QuestionWithKey } from '../../lib/types';

/** The form's starting values: blank for a new question, or a copy of an existing question and its key. */
export function questionInputFrom(q: QuestionWithKey | null): QuestionInput {
  if (!q) {
    return {
      prompt: '',
      code: '',
      options: ['', ''],
      concept: '',
      correct_index: -1,
      explanation: '',
      mistakes: {},
    };
  }
  return {
    prompt: q.prompt,
    code: q.code ?? '',
    options: [...q.options],
    concept: q.concept,
    correct_index: q.key?.correct_index ?? -1,
    explanation: q.key?.explanation ?? '',
    mistakes: { ...(q.key?.mistakes ?? {}) },
  };
}
