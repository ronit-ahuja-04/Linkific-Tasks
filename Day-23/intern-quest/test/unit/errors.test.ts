import { describe, expect, it } from 'vitest';
import { AppError, fromException, fromResponse, kindForStatus, MESSAGES, shortRef, toAppError, type ErrorKind } from '@/lib/errors';

describe('kindForStatus: every HTTP status has a kind', () => {
  it.each<[number, ErrorKind]>([
    [400, 'validation'], [422, 'validation'], [401, 'unauthorized'], [403, 'forbidden'], [404, 'notFound'], [410, 'notFound'],
    [409, 'conflict'], [413, 'tooLarge'], [429, 'rateLimited'], [500, 'server'], [502, 'server'], [503, 'unavailable'], [504, 'server'], [418, 'unknown'],
  ])('%i -> %s', (status, kind) => expect(kindForStatus(status)).toBe(kind));
});

describe('fromResponse: an answer that is not OK', () => {
  it('a 4xx uses the API\'s own sentence (written for people) and keeps the field errors', () => {
    const error = fromResponse(400, { error: 'That quest is not valid.', fields: { title: 'title must be at least 3 characters' } });
    expect(error.kind).toBe('validation');
    expect(error.message).toBe('That quest is not valid.');
    expect(error.fields).toEqual({ title: 'title must be at least 3 characters' });
    expect(error.status).toBe(400);
  });

  it('409 keeps the API sentence ("You already logged day 2…")', () => {
    expect(fromResponse(409, { error: 'You already logged day 2. Edit that quest instead.' }).message).toBe('You already logged day 2. Edit that quest instead.');
  });

  it('401 always says the session ended, whatever the server wrote', () => {
    expect(fromResponse(401, { error: 'Sign in to do this.' }).message).toBe(MESSAGES.unauthorized);
  });

  it('a 5xx never shows server text: an HTML page, an empty body or a JSON sentence all get our message', () => {
    expect(fromResponse(500, null).message).toBe(MESSAGES.server);
    expect(fromResponse(500, '<html>Internal Server Error</html>').message).toBe(MESSAGES.server);
    expect(fromResponse(503, { error: 'db down' }).message).toBe(MESSAGES.unavailable);
  });

  it('a 4xx without a usable sentence falls back to the kind\'s message', () => {
    expect(fromResponse(404, null).message).toBe(MESSAGES.notFound);
    expect(fromResponse(403, { error: '   ' }).message).toBe(MESSAGES.forbidden);
  });

  it('ignores malformed field maps', () => {
    expect(fromResponse(400, { error: 'x', fields: { title: 3 } }).fields).toBeUndefined();
    expect(fromResponse(400, { error: 'x', fields: ['a'] }).fields).toBeUndefined();
  });

  it('takes the request id from the header, or else from the body', () => {
    expect(fromResponse(500, { requestId: 'body-id' }).requestId).toBe('body-id');
    expect(fromResponse(500, { requestId: 'body-id' }, { requestId: 'header-id' }).requestId).toBe('header-id');
  });
});

describe('fromException: no answer at all', () => {
  it('our deadline -> timeout; for a write it warns that the save may have happened', () => {
    const timeout = new DOMException('late', 'TimeoutError');
    expect(fromException(timeout, { method: 'GET' }).message).toBe(MESSAGES.timeout);
    const write = fromException(timeout, { method: 'POST' });
    expect(write.kind).toBe('timeout');
    expect(write.message).toMatch(/may have been saved anyway/);
  });

  it('a cancelled request -> aborted', () => expect(fromException(new DOMException('x', 'AbortError')).kind).toBe('aborted'));
  it('fetch\'s TypeError while the browser is offline -> offline', () => expect(fromException(new TypeError('Failed to fetch'), { online: false }).kind).toBe('offline'));
  it('fetch\'s TypeError while online -> network (also what a CORS refusal looks like)', () => expect(fromException(new TypeError('Failed to fetch'), { online: true }).kind).toBe('network'));
  it('anything else -> unknown', () => {
    expect(fromException(new RangeError('?')).kind).toBe('unknown');
    expect(fromException('a string').kind).toBe('unknown');
  });
  it('an AppError passes through unchanged', () => {
    const error = new AppError('conflict', 'x');
    expect(fromException(error)).toBe(error);
    expect(toAppError(error)).toBe(error);
  });
});

describe('AppError flags', () => {
  it('retryable: worth a person trying again', () => {
    for (const kind of ['offline', 'network', 'timeout', 'rateLimited', 'unavailable', 'server'] as const) expect(new AppError(kind, '').retryable).toBe(true);
    for (const kind of ['validation', 'unauthorized', 'forbidden', 'notFound', 'conflict', 'tooLarge', 'aborted'] as const) expect(new AppError(kind, '').retryable).toBe(false);
  });

  it('autoRetry: only reads, and only for failures that can pass', () => {
    expect(new AppError('unavailable', '', { method: 'GET' }).autoRetry).toBe(true);
    expect(new AppError('network', '', { method: 'GET' }).autoRetry).toBe(true);
    expect(new AppError('unavailable', '', { method: 'POST' }).autoRetry).toBe(false);
    expect(new AppError('rateLimited', '', { method: 'GET' }).autoRetry).toBe(false);
    expect(new AppError('offline', '', { method: 'GET' }).autoRetry).toBe(false);
  });

  it('our own failures carry a short reference; the user\'s do not', () => {
    const ours = new AppError('server', 'Broke.', { requestId: '3f2a9c1e-77aa-4bbb-8ccc-1234567890ab' });
    expect(ours.messageWithReference).toBe('Broke. (ref 3f2a9c1e)');
    expect(new AppError('validation', 'Fix it.', { requestId: 'abc' }).messageWithReference).toBe('Fix it.');
    expect(new AppError('server', 'Broke.').messageWithReference).toBe('Broke.');
    expect(shortRef('aaaa-bbbb-cccc')).toBe('aaaabbbb');
  });
});
