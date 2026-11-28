// The shape of one AI-drafted unit, the prompt that asks for it, and the checks it must pass before it's saved.
// One request writes the whole unit (video script + quiz), which keeps us well inside the free daily quota.

/** Gemini "responseSchema" (an OpenAPI subset): the model must answer with exactly this JSON. */
export const DRAFT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    unit_title: { type: 'STRING' },
    unit_summary: { type: 'STRING' },
    video: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        summary: { type: 'STRING' },
        code: {
          type: 'STRING',
          description: 'Optional short code shown on screen (code topics only), max 6 lines.',
        },
        parts: {
          type: 'ARRAY',
          description:
            'Named pieces of `code` that lines can highlight. text must appear exactly in code.',
          items: {
            type: 'OBJECT',
            properties: { name: { type: 'STRING' }, text: { type: 'STRING' } },
            required: ['name', 'text'],
          },
        },
        scenes: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              visual: { type: 'STRING', enum: ['title', 'points', 'code', 'recap'] },
              heading: { type: 'STRING' },
              lines: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    say: { type: 'STRING' },
                    bubble: {
                      type: 'STRING',
                      description: 'One to three words in the guide’s speech bubble.',
                    },
                    point: {
                      type: 'STRING',
                      description: 'A short key phrase revealed on screen with this line.',
                    },
                    highlight: {
                      type: 'STRING',
                      description: 'name of a part to highlight (code scenes).',
                    },
                  },
                  required: ['say'],
                },
              },
            },
            required: ['visual', 'lines'],
          },
        },
      },
      required: ['title', 'summary', 'scenes'],
    },
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          prompt: { type: 'STRING' },
          code: { type: 'STRING' },
          asks_for_output: {
            type: 'BOOLEAN',
            description: 'true when the question asks what the code prints.',
          },
          expected_output: {
            type: 'STRING',
            description: 'Exactly what the code prints (when code is given).',
          },
          options: { type: 'ARRAY', items: { type: 'STRING' } },
          correct_index: { type: 'INTEGER' },
          explanation: { type: 'STRING' },
          mistakes: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: { option_index: { type: 'INTEGER' }, note: { type: 'STRING' } },
              required: ['option_index', 'note'],
            },
          },
          concept: { type: 'STRING' },
        },
        required: ['prompt', 'options', 'correct_index', 'explanation', 'concept'],
      },
    },
  },
  required: ['unit_title', 'unit_summary', 'video', 'questions'],
};

/** The request. Only course facts and the instructor's topic go in: never anyone's personal data. */
export function draftPrompt({ course, topic, notes, existingUnits }) {
  const code = course.topic === 'code';
  return [
    `You are Wisp, the friendly guide of Lumo, a game-like learning app. Write ONE new unit for the course`,
    `"${course.title}" (island "${course.island_name}", topic: ${course.topic}, level: ${course.level}).`,
    course.summary ? `Course summary: ${course.summary}` : '',
    existingUnits.length
      ? `Units it already has (don't repeat them): ${existingUnits.join('; ')}.`
      : '',
    `This unit must teach: ${topic}.`,
    notes ? `Instructor notes: ${notes}` : '',
    '',
    'Write:',
    '1. unit_title (2–6 words) and unit_summary (one sentence).',
    `2. video: a script for a ~60-second animated explainer narrated by the island's guardian. 3–5 scenes,`,
    '   10–14 lines in total, each line one short spoken sentence (max 16 words), plain words, no markdown.',
    '   Scene visuals: "title" (first scene, a hook), "points" (key ideas: give each line a short `point`),',
    code
      ? '   "code" (a tiny JavaScript example in `code`, max 6 lines, with named `parts` to highlight), "recap" (last scene: 2–3 `point`s).'
      : '   "recap" (last scene: 2–3 `point`s). Do not use the "code" visual for this topic.',
    '   Give 2–4 lines a `bubble` of 1–3 words.',
    `3. questions: 3 or 4 multiple-choice questions on exactly what the video teaches, 3–4 options each,`,
    '   one correct (`correct_index`, 0-based). explanation: why the right answer is right (1–2 sentences).',
    '   mistakes: for each wrong option, a short note on why someone might pick it and why it is wrong.',
    '   concept: a 2–4 word label for the idea checked.',
    code
      ? '   At least one question shows JavaScript `code` and asks what it prints: set asks_for_output=true and expected_output to the exact printed text (use console.log only, no other APIs). The correct option must equal that output.'
      : '',
    'Be accurate. Keep it encouraging and suitable for all ages.',
  ]
    .filter((l) => l !== '')
    .join('\n');
}

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * Check and tidy a draft from any provider. Returns { draft, problems }: problems that make it unusable are
 * listed (the worker then asks once more); small issues are fixed silently (lengths trimmed, bad parts dropped).
 */
export function checkDraft(raw, { codeTopic }) {
  const problems = [];
  const d = raw && typeof raw === 'object' ? raw : {};
  const video = d.video && typeof d.video === 'object' ? d.video : {};
  const code = codeTopic ? str(video.code, 400) : '';
  const parts = Array.isArray(video.parts)
    ? video.parts.filter(
        (p) => p && str(p.name, 30) && str(p.text, 80) && code.includes(p.text.trim()),
      )
    : [];
  const partNames = new Set(parts.map((p) => p.name.trim()));

  const scenes = (Array.isArray(video.scenes) ? video.scenes : [])
    .map((s) => ({
      visual: ['title', 'points', 'code', 'recap'].includes(s?.visual) ? s.visual : 'points',
      heading: str(s?.heading, 60),
      lines: (Array.isArray(s?.lines) ? s.lines : [])
        .map((l) => ({
          say: str(l?.say, 220),
          bubble: str(l?.bubble, 24) || undefined,
          point: str(l?.point, 48) || undefined,
          highlight: partNames.has(str(l?.highlight, 30)) ? str(l?.highlight, 30) : undefined,
        }))
        .filter((l) => l.say.length >= 2),
    }))
    .map((s) => (s.visual === 'code' && !code ? { ...s, visual: 'points' } : s))
    .filter((s) => s.lines.length > 0);
  const lineCount = scenes.reduce((n, s) => n + s.lines.length, 0);
  if (scenes.length < 2) problems.push('the video needs at least 2 scenes');
  if (lineCount < 5 || lineCount > 20)
    problems.push(`the video has ${lineCount} lines (want 8–14)`);

  const questions = (Array.isArray(d.questions) ? d.questions : [])
    .map((q) => {
      const options = (Array.isArray(q?.options) ? q.options : [])
        .map((o) => str(o, 200))
        .filter(Boolean);
      const mistakes = {};
      for (const m of Array.isArray(q?.mistakes) ? q.mistakes : []) {
        const i = Number(m?.option_index);
        if (
          Number.isInteger(i) &&
          i >= 0 &&
          i < options.length &&
          i !== q.correct_index &&
          str(m?.note, 300)
        ) {
          mistakes[String(i)] = str(m.note, 300);
        }
      }
      return {
        prompt: str(q?.prompt, 500),
        code: codeTopic ? str(q?.code, 600) || null : null,
        asks_for_output: Boolean(q?.asks_for_output),
        expected_output: str(q?.expected_output, 300) || null,
        options,
        correct_index: Number(q?.correct_index),
        explanation: str(q?.explanation, 1000),
        mistakes,
        concept: str(q?.concept, 80),
      };
    })
    .filter(
      (q) =>
        q.prompt.length >= 3 &&
        q.options.length >= 2 &&
        q.options.length <= 6 &&
        new Set(q.options.map((o) => o.toLowerCase())).size === q.options.length &&
        Number.isInteger(q.correct_index) &&
        q.correct_index >= 0 &&
        q.correct_index < q.options.length &&
        q.explanation.length >= 3 &&
        q.concept.length >= 2,
    );
  if (questions.length < 2) problems.push(`only ${questions.length} usable questions (want 3–4)`);

  const draft = {
    unit_title: str(d.unit_title, 120),
    unit_summary: str(d.unit_summary, 300),
    video: {
      title: str(video.title, 120) || str(d.unit_title, 120),
      summary: str(video.summary, 300),
      code,
      parts,
      scenes,
    },
    questions,
  };
  if (draft.unit_title.length < 2) problems.push('missing unit title');
  return { draft, problems };
}

/** Turn a checked draft's video into the script format the video package renders. */
export function toVideoScript(draft, { id, course, voice }) {
  return {
    id,
    title: draft.video.title,
    island: course.island_name,
    guardian: course.guardian,
    voice,
    code: draft.video.code,
    parts: Object.fromEntries(draft.video.parts.map((p) => [p.name.trim(), p.text.trim()])),
    scenes: draft.video.scenes.map((scene) => {
      const revealed = [];
      return {
        visual: scene.visual,
        heading: scene.heading,
        lines: scene.lines.map((l) => {
          if (l.point) revealed.push(l.point);
          return {
            say: l.say,
            show: {
              ...(l.bubble ? { bubble: l.bubble } : {}),
              ...(l.highlight ? { highlight: l.highlight, label: l.highlight } : {}),
              ...(revealed.length ? { points: [...revealed] } : {}),
            },
          };
        }),
      };
    }),
  };
}
