import { describe, expect, it } from 'vitest';
import { importedUrls, isImported, issueToTask, labelColor, safeGithubUrl, taskIdForIssue } from '../src/lib/github.js';
import { addTasks, makeEmptyBoard } from '../src/lib/board.js';

const issue = (n, extra = {}) => ({
  id: n * 10, number: n, title: `Issue ${n}`, body: 'details', url: `https://github.com/o/r/issues/${n}`, state: 'open',
  labels: [{ name: 'bug', color: 'd73a4a' }], author: 'me', comments: 1, createdAt: '2025-03-04T10:00:00Z', updatedAt: '', ...extra,
});

describe('dedupe helpers', () => {
  it('importedUrls collects source.url of tasks and ignores the rest', () => {
    const urls = importedUrls({ a: { source: { url: 'u1' } }, b: {}, c: { source: { url: 'u2' } } });
    expect([...urls].sort()).toEqual(['u1', 'u2']);
    expect(importedUrls(undefined).size).toBe(0);
  });
  it('isImported checks the issue url', () => {
    const urls = new Set([issue(1).url]);
    expect(isImported(issue(1), urls)).toBe(true);
    expect(isImported(issue(2), urls)).toBe(false);
  });
});

describe('issueToTask', () => {
  it('builds the FlowLane task shape plus source', () => {
    const task = issueToTask(issue(7), { repo: 'o/r', uid: 'u1' });
    expect(task).toMatchObject({
      content: 'Issue 7', description: 'details', priority: 'medium', comments: 0, users: ['u1'],
      source: { type: 'github', repo: 'o/r', number: 7, url: 'https://github.com/o/r/issues/7' },
    });
    expect(task.tags).toEqual([{ id: 'label-bug', type: 'dev', text: 'bug' }]);
    expect(task._isDraft).toBeUndefined();
  });
  it('caps tags at 3, tolerates a bad date and a missing uid', () => {
    const labels = ['a', 'b', 'c', 'd'].map((name) => ({ name, color: '000000' }));
    const task = issueToTask(issue(1, { labels, createdAt: 'nope', body: '' }), { repo: 'o/r' });
    expect(task.tags).toHaveLength(3);
    expect(task.users).toEqual([]);
    expect(task.description).toBe('');
    expect(task.date).not.toMatch(/Invalid/);
  });
  it('ids are deterministic and safe as a Firestore field path (no dots)', () => {
    expect(taskIdForIssue(issue(3))).toBe(taskIdForIssue(issue(3)));
    expect(taskIdForIssue(issue(3))).not.toBe(taskIdForIssue(issue(4)));
    expect(taskIdForIssue(issue(3, { url: 'https://github.com/a.b/c.d/issues/3' }))).not.toContain('.');
    const other = issue(3, { url: 'https://github.com/x/y/issues/3' });
    expect(taskIdForIssue(other)).not.toBe(taskIdForIssue(issue(3)));
  });
});

describe('safeGithubUrl / labelColor', () => {
  it('only allows http(s) links', () => {
    expect(safeGithubUrl('https://github.com/o/r/issues/1')).toBe('https://github.com/o/r/issues/1');
    expect(safeGithubUrl('javascript:alert(1)')).toBeNull();
    expect(safeGithubUrl('not a url')).toBeNull();
    expect(safeGithubUrl(undefined)).toBeNull();
  });
  it('validates label colours', () => {
    expect(labelColor('d73a4a')).toBe('#d73a4a');
    expect(labelColor('red;background:url(x)')).toBe('#8b949e');
    expect(labelColor(undefined)).toBe('#8b949e');
  });
});

describe('addTasks (board helper)', () => {
  const task = (n) => issueToTask(issue(n), { repo: 'o/r', uid: 'u1' });
  it('appends tasks to the end of the column in one step', () => {
    const board = addTasks(makeEmptyBoard(), [task(1), task(2)], 'todo');
    expect(board.columns.todo.taskIds).toEqual([task(1).id, task(2).id]);
    expect(Object.keys(board.tasks)).toHaveLength(2);
  });
  it('skips tasks already on the board by id or by source url and returns the same board when nothing is new', () => {
    const board = addTasks(makeEmptyBoard(), [task(1)], 'todo');
    expect(addTasks(board, [task(1)], 'todo')).toBe(board);
    const sameUrl = { ...task(1), id: 'other-id' };
    expect(addTasks(board, [sameUrl], 'todo')).toBe(board);
    expect(addTasks(board, [task(2), task(1)], 'todo').columns.todo.taskIds).toHaveLength(2);
  });
  it('counts a url that appears twice in the batch once; unknown column is a no-op', () => {
    const dup = { ...task(1), id: 'dup' };
    expect(addTasks(makeEmptyBoard(), [task(1), dup], 'todo').columns.todo.taskIds).toHaveLength(1);
    const board = makeEmptyBoard();
    expect(addTasks(board, [task(1)], 'nope')).toBe(board);
  });
});
