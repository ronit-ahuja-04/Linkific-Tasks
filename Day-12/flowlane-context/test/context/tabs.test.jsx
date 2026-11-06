// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Tabs } from '../../src/components/Tabs.jsx';

afterEach(cleanup);

function Demo(props) {
  return (
    <Tabs {...props}>
      <h1>Header sits between the parts</h1>
      <Tabs.List aria-label="Views">
        <Tabs.Tab value="board">Board</Tabs.Tab>
        <Tabs.Tab value="activity">Activity</Tabs.Tab>
        <Tabs.Tab value="files" disabled>Files</Tabs.Tab>
        <Tabs.Tab value="notes">Notes</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="board">Board content</Tabs.Panel>
      <Tabs.Panel value="activity">Activity content</Tabs.Panel>
      <Tabs.Panel value="notes" keepMounted>Notes content</Tabs.Panel>
    </Tabs>
  );
}

describe('Tabs (compound component)', () => {
  it('renders the ARIA tabs structure with the default tab open', () => {
    render(<Demo defaultValue="board" />);
    expect(screen.getByRole('tablist', { name: 'Views' })).toBeTruthy();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['Board', 'Activity', 'Files', 'Notes']);
    expect(screen.getByRole('tab', { name: 'Board' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Activity' }).getAttribute('aria-selected')).toBe('false');
    expect(screen.getByRole('tabpanel').textContent).toBe('Board content');
  });

  it('lets other content sit between the parts (no wrapper element)', () => {
    render(<Demo defaultValue="board" />);
    expect(screen.getByText('Header sits between the parts')).toBeTruthy();
  });

  it('links each tab to its panel with ids, aria-controls and aria-labelledby', () => {
    render(<Demo defaultValue="board" />);
    const tab = screen.getByRole('tab', { name: 'Board' });
    const panel = screen.getByRole('tabpanel');
    expect(tab.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
  });

  it('uncontrolled: clicking opens another tab and only that panel is rendered', async () => {
    render(<Demo defaultValue="board" />);
    await userEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(screen.getByRole('tab', { name: 'Activity' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.queryByText('Board content')).toBeNull(); // closed panels are not rendered
    expect(screen.getByText('Activity content')).toBeTruthy();
  });

  it('controlled: the parent owns the value and onChange is called', async () => {
    const onChange = vi.fn();
    render(<Demo value="board" onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(onChange).toHaveBeenCalledWith('activity');
    // the parent did not change `value`, so nothing changed
    expect(screen.getByRole('tab', { name: 'Board' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('Board content')).toBeTruthy();
  });

  it('controlled by state in a parent (the way FlowLane keeps the open tab in Redux)', async () => {
    function Parent() {
      const [tab, setTab] = useState('board');
      return (
        <>
          <p>open: {tab}</p>
          <Demo value={tab} onChange={setTab} />
        </>
      );
    }
    render(<Parent />);
    await userEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(screen.getByText('open: activity')).toBeTruthy();
    expect(screen.getByText('Activity content')).toBeTruthy();
  });

  it('roving tabindex: only the open tab is in the Tab key order', () => {
    render(<Demo defaultValue="activity" />);
    expect(screen.getByRole('tab', { name: 'Activity' }).tabIndex).toBe(0);
    expect(screen.getByRole('tab', { name: 'Board' }).tabIndex).toBe(-1);
    expect(screen.getByRole('tab', { name: 'Notes' }).tabIndex).toBe(-1);
  });

  it('arrow keys move focus and open the next tab, wrapping around and skipping disabled tabs', async () => {
    render(<Demo defaultValue="board" />);
    screen.getByRole('tab', { name: 'Board' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Activity' }));
    expect(screen.getByText('Activity content')).toBeTruthy();
    await userEvent.keyboard('{ArrowRight}'); // Files is disabled: skipped
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Notes' }));
    await userEvent.keyboard('{ArrowRight}'); // wraps to the first
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Board' }));
    await userEvent.keyboard('{ArrowLeft}'); // wraps back to the last
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Notes' }));
  });

  it('Home and End jump to the first and last tab', async () => {
    render(<Demo defaultValue="activity" />);
    screen.getByRole('tab', { name: 'Activity' }).focus();
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Notes' }));
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Board' }));
  });

  it('other keys do nothing, and a disabled tab cannot be opened', async () => {
    render(<Demo defaultValue="board" />);
    screen.getByRole('tab', { name: 'Board' }).focus();
    await userEvent.keyboard('a');
    expect(screen.getByText('Board content')).toBeTruthy();
    await userEvent.click(screen.getByRole('tab', { name: 'Files' }));
    expect(screen.getByRole('tab', { name: 'Board' }).getAttribute('aria-selected')).toBe('true');
  });

  it('keepMounted keeps a closed panel in the DOM but hidden', () => {
    render(<Demo defaultValue="board" />);
    const notes = document.getElementById(screen.getByRole('tab', { name: 'Notes' }).getAttribute('aria-controls'));
    expect(notes).not.toBeNull();
    expect(notes.hidden).toBe(true);
  });

  it('passes className and other props through to the parts', () => {
    render(
      <Tabs defaultValue="a">
        <Tabs.List className="project-tabs" data-testid="list">
          <Tabs.Tab value="a" className="extra">A</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a" className="mine">A</Tabs.Panel>
      </Tabs>
    );
    expect(screen.getByTestId('list').className).toBe('project-tabs');
    expect(screen.getByRole('tab').className).toBe('tab active extra');
    expect(screen.getByRole('tabpanel').className).toBe('mine');
  });

  it('two Tabs on one page do not share state or ids', async () => {
    render(
      <>
        <Tabs defaultValue="one"><Tabs.List aria-label="first"><Tabs.Tab value="one">One</Tabs.Tab><Tabs.Tab value="two">Two</Tabs.Tab></Tabs.List></Tabs>
        <Tabs defaultValue="one"><Tabs.List aria-label="second"><Tabs.Tab value="one">One</Tabs.Tab><Tabs.Tab value="two">Two</Tabs.Tab></Tabs.List></Tabs>
      </>
    );
    const [firstTwo, secondTwo] = screen.getAllByRole('tab', { name: 'Two' });
    expect(firstTwo.id).not.toBe(secondTwo.id);
    fireEvent.click(firstTwo);
    expect(firstTwo.getAttribute('aria-selected')).toBe('true');
    expect(secondTwo.getAttribute('aria-selected')).toBe('false');
  });
});
