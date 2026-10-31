/**
 * DEMO ONLY. A passcode baked into client JavaScript is visible to anyone who
 * opens DevTools. Route guards are a UX layer; real auth lives on the server.
 */
export const DEMO_PASSCODE = 'hackhq';

export function isValidPasscode(input) {
  return typeof input === 'string' && input.trim() === DEMO_PASSCODE;
}
