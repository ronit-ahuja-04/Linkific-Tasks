import { API, HANDLE, withApi } from './config.js';

// The embed: fetch a public quest card from another origin and show it.
// Everything from the API is written with textContent, never innerHTML: data from another origin is not trusted HTML.
document.getElementById('origin').textContent = location.origin;
document.getElementById('api').textContent = API;
document.getElementById('lab').href = withApi('lab.html');

const result = document.getElementById('result');
const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};

async function show(handle) {
  result.replaceChildren(el('p', 'Loading the card…'));
  let response;
  try {
    response = await fetch(`${API}/api/public/characters/${encodeURIComponent(handle)}`);
  } catch {
    // A CORS refusal and a dropped connection look the SAME to a script ("Failed to fetch"). Only the console and the
    // Network tab tell them apart; a script can not, by design: it must not learn anything about an answer it may not read.
    result.replaceChildren(el('p', 'The card could not be loaded: the API could not be reached, or it does not allow this site (see the console).', 'error'));
    return;
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    // readable because the API exposes X-Request-Id to allowed origins
    const ref = response.headers.get('x-request-id');
    result.replaceChildren(el('p', `${body?.error ?? 'The card could not be loaded.'}${ref ? ` (ref ${ref.slice(0, 8)})` : ''}`, 'error'));
    return;
  }
  const { card } = body;
  const box = el('article', undefined, 'quest-card');
  box.setAttribute('aria-label', `Quest card: ${card.name}`);
  box.append(
    el('span', card.name, 'name'),
    el('span', `${card.class} · level ${card.level} ${card.title}`, 'meta'),
    el('span', `${card.totalXp.toLocaleString('en-US')} XP from ${card.questCount} quests · best streak ${card.bestStreak} days · ${card.badgeCount} badges`),
  );
  const skills = el('ul');
  for (const skill of card.topSkills) skills.append(el('li', `${skill.label}: level ${skill.level}`));
  const link = el('a', 'See the full character sheet');
  link.href = card.sheetUrl;
  box.append(skills, link);
  result.replaceChildren(box);
}

document.getElementById('form').addEventListener('submit', (event) => {
  event.preventDefault();
  const handle = document.getElementById('handle').value.trim().toLowerCase();
  if (handle) void show(handle);
});
document.getElementById('handle').value = HANDLE;
void show(HANDLE);
