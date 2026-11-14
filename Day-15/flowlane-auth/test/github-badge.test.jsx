// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import GitHubBadge from '../src/components/GitHubBadge.jsx';
import { LanguageProvider } from '../src/context/LanguageContext.jsx';

afterEach(cleanup);
const renderBadge = (source) => render(<LanguageProvider><GitHubBadge source={source} /></LanguageProvider>);
const source = { type: 'github', repo: 'octo/hello', number: 123, url: 'https://github.com/octo/hello/issues/123' };

describe('GitHubBadge', () => {
  it('renders #number as a safe external link with an accessible name', () => {
    renderBadge(source);
    const link = screen.getByRole('link', { name: 'Open issue #123 on GitHub' });
    expect(link.textContent).toBe('#123');
    expect(link.getAttribute('href')).toBe(source.url);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders nothing for tasks that did not come from GitHub', () => {
    const { container } = renderBadge(undefined);
    expect(container.innerHTML).toBe('');
    const other = renderBadge({ type: 'manual' });
    expect(other.container.innerHTML).toBe('');
  });

  it('never turns an unsafe URL into a link', () => {
    renderBadge({ ...source, url: 'javascript:alert(1)' });
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('#123')).toBeTruthy();
  });

  it('does not let the click reach the task card (which would open the panel)', () => {
    const onCard = vi.fn();
    render(
      <LanguageProvider>
        <div onClick={onCard}><GitHubBadge source={source} /></div>
      </LanguageProvider>
    );
    fireEvent.click(screen.getByRole('link'));
    expect(onCard).not.toHaveBeenCalled();
  });
});
