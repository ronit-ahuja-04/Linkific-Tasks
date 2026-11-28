// AI providers behind one interface: generate(prompt, schema) -> { json, model }.
//
//   gemini: Google's Gemini API on the FREE tier (a key from aistudio.google.com, no billing account). When the
//           free quota runs out it answers 429; nothing is ever charged. We throw QuotaError so the job waits.
//   fake:   no AI at all. Builds a believable draft from the topic, for tests and demos without a key.

export class QuotaError extends Error {
  constructor(message, { retryAfterSeconds = null, daily = false } = {}) {
    super(message);
    this.name = 'QuotaError';
    this.retryAfterSeconds = retryAfterSeconds;
    this.daily = daily;
  }
}

const API = 'https://generativelanguage.googleapis.com/v1beta';

/** Pick the newest general "flash" model this key can use (the free tier's best-value model). */
async function pickModel(key) {
  const res = await fetch(`${API}/models?pageSize=200`, { headers: { 'x-goog-api-key': key } });
  if (res.status === 400 || res.status === 401 || res.status === 403) {
    throw new Error('Gemini rejected the API key. Check GEMINI_API_KEY in .env.worker.');
  }
  if (!res.ok) throw new Error(`Couldn't list Gemini models (HTTP ${res.status}).`);
  const { models = [] } = await res.json();
  const usable = models
    .filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''))
    .filter((n) => /^gemini-\d+(\.\d+)?-flash$/.test(n));
  usable.sort((a, b) => parseFloat(b.split('-')[1]) - parseFloat(a.split('-')[1]));
  return usable[0] ?? 'gemini-2.5-flash';
}

function quotaFrom(body) {
  const details = body?.error?.details ?? [];
  const retry = details.find((d) => String(d['@type']).includes('RetryInfo'))?.retryDelay;
  const seconds = retry ? parseFloat(retry) : null;
  const daily = details
    .filter((d) => String(d['@type']).includes('QuotaFailure'))
    .flatMap((d) => d.violations ?? [])
    .some((v) => /PerDay/i.test(`${v.quotaId ?? ''} ${v.quotaMetric ?? ''}`));
  return { retryAfterSeconds: seconds, daily };
}

export function geminiProvider({ key, model: fixedModel }) {
  let model = fixedModel || null;
  return {
    name: 'gemini',
    async generate(prompt, schema) {
      model ??= await pickModel(key);
      const res = await fetch(`${API}/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        }),
        signal: AbortSignal.timeout(120_000),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 429) {
        const q = quotaFrom(body);
        throw new QuotaError(
          q.daily ? "Out of today's free Gemini quota" : 'Gemini is busy (rate limit)',
          q,
        );
      }
      if (!res.ok)
        throw new Error(`Gemini error ${res.status}: ${body?.error?.message ?? 'unknown'}`);
      const candidate = body.candidates?.[0];
      if (candidate?.finishReason === 'SAFETY')
        throw new Error('Gemini declined this topic (safety filter).');
      const text = candidate?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      try {
        return { json: JSON.parse(text), model };
      } catch {
        throw new Error('Gemini returned something that is not valid JSON.');
      }
    },
  };
}

/** A no-AI stand-in with the same output shape. Content is generic but structurally real. */
export function fakeProvider() {
  return {
    name: 'fake',
    async generate(prompt) {
      const topic = /This unit must teach: (.+)\./.exec(prompt)?.[1] ?? 'the next idea';
      const code = prompt.includes('"code" (a tiny JavaScript example');
      const t = topic.replace(/\.$/, '');
      const title = t.length > 40 ? t.slice(0, 40) : t;
      return {
        model: 'fake (no AI)',
        json: {
          unit_title: title.charAt(0).toUpperCase() + title.slice(1),
          unit_summary: `The essentials of ${t}, in one short video and a quick check.`,
          video: {
            title: `${title.charAt(0).toUpperCase() + title.slice(1)} in a minute`,
            summary: `What ${t} is, why it matters, and how to use it.`,
            code: code ? 'const items = [3, 5, 8];\nconsole.log(items.length);' : undefined,
            parts: code ? [{ name: 'Count', text: 'items.length' }] : [],
            scenes: [
              {
                visual: 'title',
                lines: [
                  { say: `Today we're looking at ${t}.`, bubble: 'New idea!' },
                  { say: 'It sounds big, but it fits in one minute.' },
                ],
              },
              {
                visual: 'points',
                heading: 'Key ideas',
                lines: [
                  { say: 'First, notice what it is for.', point: 'What it’s for' },
                  { say: 'Then, see how it works step by step.', point: 'How it works' },
                  { say: 'Finally, spot the common mistake.', point: 'The usual mistake' },
                ],
              },
              ...(code
                ? [
                    {
                      visual: 'code',
                      lines: [
                        { say: 'Here is a tiny example.' },
                        {
                          say: 'This part counts the items, so it prints three.',
                          highlight: 'Count',
                        },
                      ],
                    },
                  ]
                : []),
              {
                visual: 'recap',
                lines: [
                  {
                    say: 'So remember what it is for, and how it works.',
                    point: 'Purpose',
                    bubble: 'Recap',
                  },
                  { say: 'And watch out for the usual mistake.', point: 'Watch out' },
                  { say: 'Ready for a quick check?', bubble: 'Quiz!' },
                ],
              },
            ],
          },
          questions: [
            ...(code
              ? [
                  {
                    prompt: 'What does this print?',
                    code: 'const items = [3, 5, 8];\nconsole.log(items.length);',
                    asks_for_output: true,
                    expected_output: '3',
                    options: ['3', '8', '16'],
                    correct_index: 0,
                    explanation: 'length counts the items in the array: there are three.',
                    mistakes: [
                      {
                        option_index: 1,
                        note: '8 is the last item, not how many items there are.',
                      },
                      { option_index: 2, note: '16 is the sum; length counts items.' },
                    ],
                    concept: 'array length',
                  },
                ]
              : []),
            {
              prompt: `What is the first thing to understand about ${t}?`,
              options: ['What it’s for', 'Its history', 'Its longest example'],
              correct_index: 0,
              explanation: 'Knowing what something is for makes every detail easier to place.',
              mistakes: [
                {
                  option_index: 1,
                  note: 'History is interesting, but it comes after the purpose.',
                },
              ],
              concept: `${title} purpose`.slice(0, 80),
            },
            {
              prompt: 'What helps most when learning a new idea?',
              options: ['Seeing it step by step', 'Memorising definitions', 'Skipping examples'],
              correct_index: 0,
              explanation: 'Step-by-step examples show how the idea actually works.',
              mistakes: [{ option_index: 2, note: 'Examples are where ideas become clear.' }],
              concept: `${title} steps`.slice(0, 80),
            },
          ],
        },
      };
    },
  };
}
