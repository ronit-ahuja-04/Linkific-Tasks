/**
 * ui.js - Habit Tracker DOM Rendering
 * Strict separation: receives state data, constructs DOM nodes using createElement,
 * and sets text strictly via textContent.
 */

// CONCEPT: createElement
// CONCEPT: Object.keys/values/entries

import { getCurrentStreak, getLongestStreak, isDoneOn } from './streaks.js';
import { getLastNDays, formatDisplayDate } from './dates.js';
import { getTotalCheckIns, rankByStreak, checkInsByDate, getMostActiveDate } from './stats.js';

export const elements = {
  habitList: document.getElementById('habit-list'),
  emptyState: document.getElementById('empty-state'),
  addHabitForm: document.getElementById('add-habit-form'),
  habitNameInput: document.getElementById('habit-name-input'),
  validationMsg: document.getElementById('validation-msg'),
  statsContainer: document.getElementById('stats-container'),
  totalCheckInsCount: document.getElementById('total-checkins-count'),
  activeHabitsCount: document.getElementById('active-habits-count'),
  topStreakValue: document.getElementById('top-streak-value'),
  topActiveDateValue: document.getElementById('top-active-date-value'),
  streakRankingList: document.getElementById('streak-ranking-list'),
  dateActivityTableBody: document.getElementById('date-activity-table-body'),
  btnResetAll: document.getElementById('btn-reset-all'),
};

/**
 * Renders all habits into the habit list container.
 * @param {Array<object>} habits
 * @param {string} todayKey
 */
export function renderHabits(habits, todayKey) {
  elements.habitList.replaceChildren();

  if (habits.length === 0) {
    elements.emptyState.hidden = false;
    return;
  }
  elements.emptyState.hidden = true;

  const last7Days = getLastNDays(7, todayKey);

  habits.forEach((habit) => {
    const isCompletedToday = isDoneOn(habit.checkIns, todayKey);
    const currentStreak = getCurrentStreak(habit.checkIns, todayKey);
    const longestStreak = getLongestStreak(habit.checkIns);

    // Main Card Element
    const card = document.createElement('article');
    card.className = `habit-card ${isCompletedToday ? 'is-completed' : ''}`;
    card.setAttribute('data-id', habit.id);

    // Card Header (Name + Streaks)
    const header = document.createElement('div');
    header.className = 'habit-header';

    const titleGroup = document.createElement('div');
    titleGroup.className = 'habit-title-group';

    const title = document.createElement('h3');
    title.className = 'habit-name';
    title.textContent = habit.name; // textContent for XSS safety!

    const createdMeta = document.createElement('span');
    createdMeta.className = 'habit-created-date';
    createdMeta.textContent = `Started ${formatDisplayDate(habit.createdAt)}`;

    titleGroup.appendChild(title);
    titleGroup.appendChild(createdMeta);

    // Streaks Badge Group
    const badges = document.createElement('div');
    badges.className = 'streak-badges';

    const currentBadge = document.createElement('span');
    currentBadge.className = 'streak-badge current-streak';
    currentBadge.title = 'Current active streak';
    currentBadge.textContent = `${currentStreak}d streak`;

    const longestBadge = document.createElement('span');
    longestBadge.className = 'streak-badge longest-streak';
    longestBadge.title = 'Longest historical streak';
    longestBadge.textContent = `Best: ${longestStreak}d`;

    badges.appendChild(currentBadge);
    badges.appendChild(longestBadge);

    header.appendChild(titleGroup);
    header.appendChild(badges);

    // HT-8: Last 7 Days Mini-Grid
    const historySection = document.createElement('div');
    historySection.className = 'week-history';

    const historyLabel = document.createElement('span');
    historyLabel.className = 'history-label';
    historyLabel.textContent = 'Last 7 days:';
    historySection.appendChild(historyLabel);

    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'week-dots';

    last7Days.forEach((dayKey) => {
      const isDone = isDoneOn(habit.checkIns, dayKey);
      const isToday = dayKey === todayKey;

      const dot = document.createElement('span');
      dot.className = `day-dot ${isDone ? 'done' : 'missed'} ${isToday ? 'today' : ''}`;
      dot.title = `${formatDisplayDate(dayKey)}: ${isDone ? 'Completed' : 'Missed'}`;
      dot.textContent = isDone ? 'Y' : '—';

      dotsContainer.appendChild(dot);
    });
    historySection.appendChild(dotsContainer);

    // Actions (Toggle Done Today & Delete)
    const actions = document.createElement('div');
    actions.className = 'habit-actions';

    const btnToggle = document.createElement('button');
    btnToggle.type = 'button';
    btnToggle.className = `btn btn-toggle-done ${isCompletedToday ? 'btn-completed' : 'btn-pending'}`;
    btnToggle.setAttribute('data-action', 'toggle');
    btnToggle.textContent = isCompletedToday ? 'Completed Today' : 'Mark Done Today';

    const btnDelete = document.createElement('button');
    btnDelete.type = 'button';
    btnDelete.className = 'btn btn-delete';
    btnDelete.setAttribute('data-action', 'delete');
    btnDelete.setAttribute('aria-label', `Delete habit ${habit.name}`);
    btnDelete.textContent = 'Delete';

    actions.appendChild(btnToggle);
    actions.appendChild(btnDelete);

    // Assemble Card
    card.appendChild(header);
    card.appendChild(historySection);
    card.appendChild(actions);

    elements.habitList.appendChild(card);
  });
}

/**
 * Renders statistical aggregates into the stats panel.
 * @param {Array<object>} habits
 * @param {string} todayKey
 */
export function renderStats(habits, todayKey) {
  const total = getTotalCheckIns(habits);
  const ranked = rankByStreak(habits, todayKey);
  const dateCounts = checkInsByDate(habits);
  const mostActive = getMostActiveDate(dateCounts);

  elements.totalCheckInsCount.textContent = String(total);
  elements.activeHabitsCount.textContent = String(habits.length);

  const topStreak = ranked.length > 0 ? ranked[0].currentStreak : 0;
  elements.topStreakValue.textContent = `${topStreak} days`;

  elements.topActiveDateValue.textContent = mostActive.date
    ? `${formatDisplayDate(mostActive.date)} (${mostActive.count})`
    : 'None yet';

  // Render ranking list
  elements.streakRankingList.replaceChildren();
  if (ranked.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No habits tracked yet.';
    li.className = 'stats-empty-item';
    elements.streakRankingList.appendChild(li);
  } else {
    ranked.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'ranking-item';

      const rankBadge = document.createElement('span');
      rankBadge.className = 'rank-num';
      rankBadge.textContent = `#${index + 1}`;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'rank-name';
      nameSpan.textContent = item.name;

      const streakSpan = document.createElement('span');
      streakSpan.className = 'rank-streak';
      streakSpan.textContent = `${item.currentStreak}d streak (${item.totalCheckIns} total)`;

      li.appendChild(rankBadge);
      li.appendChild(nameSpan);
      li.appendChild(streakSpan);
      elements.streakRankingList.appendChild(li);
    });
  }

  // Render date activity table with Object.entries
  elements.dateActivityTableBody.replaceChildren();
  const sortedDates = Object.entries(dateCounts)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .slice(0, 7); // Last 7 active dates

  if (sortedDates.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 2;
    td.textContent = 'No check-ins recorded yet.';
    td.className = 'text-muted';
    tr.appendChild(td);
    elements.dateActivityTableBody.appendChild(tr);
  } else {
    sortedDates.forEach(([dateKey, count]) => {
      const tr = document.createElement('tr');

      const tdDate = document.createElement('td');
      tdDate.textContent = formatDisplayDate(dateKey);

      const tdCount = document.createElement('td');
      tdCount.textContent = `${count} habit${count === 1 ? '' : 's'}`;

      tr.appendChild(tdDate);
      tr.appendChild(tdCount);
      elements.dateActivityTableBody.appendChild(tr);
    });
  }
}

/**
 * Displays or hides validation banner.
 * @param {string | null} message
 * @param {boolean} [isError=true]
 */
export function showValidation(message, isError = true) {
  if (!message) {
    elements.validationMsg.hidden = true;
    elements.validationMsg.textContent = '';
    return;
  }
  elements.validationMsg.hidden = false;
  elements.validationMsg.textContent = message;
  elements.validationMsg.className = `alert-banner ${isError ? 'alert-danger' : 'alert-success'}`;
}
