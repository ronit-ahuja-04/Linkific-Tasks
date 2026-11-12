// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import BenchmarkScreen from '../../src/screens/BenchmarkScreen';

const row = (suite, winner) => ({ id: suite.id, title: suite.title, lodashMs: 2, nativeMs: 1, winner, factor: 2 });
const tick = () => new Promise((r) => setTimeout(r, 0));

const fastRunner = async (suites, _users, { onStart, onResult }) => {
  for (let i = 0; i < suites.length; i += 1) {
    onStart(i + 1, suites.length, suites[i]);
    await tick();
    onResult(row(suites[i], i === 0 ? 'lodash' : 'native'));
  }
};

describe('BenchmarkScreen', () => {
  it('runs the suites and shows rows with a summary', async () => {
    render(<BenchmarkScreen runner={fastRunner} />);
    fireEvent.click(screen.getByRole('button', { name: 'Run benchmarks' }));
    expect(await screen.findByText('Native won 11 of 12 suites; Lodash won 1.')).toBeTruthy();
    expect(screen.getAllByRole('img').length).toBe(12);
    expect(screen.getByText('groupBy department')).toBeTruthy();
    expect(screen.getByText('Finished 12 suites.')).toBeTruthy();
  });

  it('cancel stops the run', async () => {
    let release;
    const gate = new Promise((r) => { release = r; });
    const slow = async (suites, _u, { onStart, onResult, isCancelled }) => {
      for (let i = 0; i < suites.length; i += 1) {
        if (isCancelled()) return;
        onStart(i + 1, suites.length, suites[i]);
        await (i === 1 ? gate : tick());
        if (isCancelled()) return;
        onResult(row(suites[i], 'native'));
      }
    };
    render(<BenchmarkScreen runner={slow} />);
    fireEvent.click(screen.getByRole('button', { name: 'Run benchmarks' }));
    expect(await screen.findByText('Running 2 of 12: sort by salary')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    release();
    expect(await screen.findByText('Cancelled after 1 suites.')).toBeTruthy();
    await tick();
    expect(screen.getAllByRole('img').length).toBe(1);
  });

  it('works with the real runSuite (1,000 users, 1 iteration)', async () => {
    render(<BenchmarkScreen initialIterations={1} />);
    fireEvent.click(screen.getByRole('button', { name: 'Run benchmarks' }));
    expect(await screen.findByText('Finished 12 suites.', {}, { timeout: 10000 })).toBeTruthy();
    expect(screen.getAllByRole('row').length).toBe(13);
  }, 15000);
});
