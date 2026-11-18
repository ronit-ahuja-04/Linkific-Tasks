/**
 * Test helper: give back the value, or fail the test with a clear message when it is missing.
 *
 * With `noUncheckedIndexedAccess`, `array[0]` is `T | undefined` and `querySelector` is `T | null`. In app code you
 * handle that case; in a test a missing value means the test is wrong, so say so instead of silencing the compiler
 * with `!` (which would turn a missing value into a confusing "cannot read property of undefined" later).
 */
export function must<T>(value: T | null | undefined, what = 'value'): T {
  if (value === null || value === undefined) throw new Error(`Expected ${what} to exist in this test`);
  return value;
}
