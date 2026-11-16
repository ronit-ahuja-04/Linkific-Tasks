import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearGithubToken, getGithubToken, setGithubToken, subscribeGithubToken } from '../src/lib/githubToken';

afterEach(() => clearGithubToken());

describe('githubToken (in-memory store)', () => {
  it('holds a token and clears it', () => {
    expect(getGithubToken()).toBeNull();
    setGithubToken('gho_abc');
    expect(getGithubToken()).toBe('gho_abc');
    clearGithubToken();
    expect(getGithubToken()).toBeNull();
  });
  it('notifies subscribers only when the value changes, and stops after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeGithubToken(listener);
    setGithubToken('a');
    setGithubToken('a');
    setGithubToken('b');
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    setGithubToken('c');
    expect(listener).toHaveBeenCalledTimes(2);
  });
  it('treats empty values as no token and never writes to browser storage', () => {
    setGithubToken('');
    expect(getGithubToken()).toBeNull();
  });
});
