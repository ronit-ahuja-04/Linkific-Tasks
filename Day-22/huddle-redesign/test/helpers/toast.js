import { screen, waitFor, within } from '@testing-library/react';
import { expect } from 'vitest';

/**
 * A toast is SHOWN (inside the "Notifications" region) and ANNOUNCED (its text is in one of the viewport's
 * always-present aria-live regions). Returns the visible toast's message element.
 */
export async function expectToast(text) {
  const region = await screen.findByRole('region', { name: 'Notifications' });
  const shown = await waitFor(() => within(region).getByText(text));
  const live = [...document.querySelectorAll('[aria-live]')].filter((el) => !region.contains(el) && el.parentElement === region.parentElement);
  const said = live.map((el) => el.textContent);
  expect(said.some((t) => (text instanceof RegExp ? text.test(t) : t === text)), `announced: ${JSON.stringify(said)}`).toBe(true);
  return shown;
}
