import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuestionForm } from '../src/features/studio/QuestionForm';
import { questionInputFrom } from '../src/features/studio/questionInput';
import type { Course } from '../src/lib/types';

const api = vi.hoisted(() => ({ searchCourses: vi.fn() }));
vi.mock('../src/lib/api/courses', async (original) => ({
  ...(await original<typeof import('../src/lib/api/courses')>()),
  searchCourses: api.searchCourses,
}));

const { ExplorePage } = await import('../src/features/explore/ExplorePage');

describe('QuestionForm', () => {
  it('shows what to fix and sends nothing when the question is incomplete', async () => {
    const onSubmit = vi.fn();
    render(
      <QuestionForm initial={questionInputFrom(null)} onSubmit={onSubmit} onCancel={() => {}} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save question' }));
    expect(screen.getByText('Mark which option is correct.')).toBeInTheDocument();
    expect(screen.getAllByText('Write this option, or remove it.')).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the right answer and mistake notes attached to their options when one is removed', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <QuestionForm
        initial={{
          prompt: 'How many laps?',
          code: '',
          options: ['Forever', '3', '4'],
          concept: 'loop count',
          correct_index: 1,
          explanation: 'i goes 0, 1, 2.',
          mistakes: { '0': 'It stops.', '2': 'Off by one.' },
        }}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove option A' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save question' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        options: ['3', '4'],
        correct_index: 0,
        mistakes: { '1': 'Off by one.' },
      }),
    );
  });
});

const island = (over: Partial<Course>): Course => ({
  id: over.slug ?? 'x',
  slug: 'x',
  title: 'X',
  island_name: 'X',
  guardian: 'byte',
  topic: 'code',
  level: 'beginner',
  summary: '',
  owner_id: 'o',
  status: 'live',
  version: 1,
  ai_generated: false,
  updated_at: '',
  ...over,
});

function Where() {
  return <output data-testid="url">{useLocation().search}</output>;
}

describe('Explore', () => {
  beforeEach(() => {
    api.searchCourses.mockReset();
    api.searchCourses.mockImplementation(async ({ topic }: { topic?: string }) =>
      topic === 'money' ? [] : [island({ slug: 'reef', island_name: 'Code Reef' })],
    );
  });

  it('searches as you type, filters by topic, and "clear" really clears', async () => {
    render(
      <MemoryRouter initialEntries={['/explore']}>
        <Routes>
          <Route
            path="/explore"
            element={
              <>
                <ExplorePage />
                <Where />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Code Reef' })).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Search islands'), 'reef');
    await waitFor(() => expect(screen.getByTestId('url')).toHaveTextContent('q=reef'));
    expect(api.searchCourses).toHaveBeenLastCalledWith({ q: 'reef', topic: '', level: '' });

    await userEvent.click(screen.getByRole('button', { name: 'Money' }));
    expect(await screen.findByText('No islands found')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Clear search and filters' }));
    await new Promise((r) => setTimeout(r, 400)); // longer than the search debounce
    expect(screen.getByTestId('url')).toHaveTextContent(/^$/);
    expect(screen.getByRole('button', { name: 'All topics' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(await screen.findByRole('heading', { name: 'Code Reef' })).toBeInTheDocument();
  });
});
