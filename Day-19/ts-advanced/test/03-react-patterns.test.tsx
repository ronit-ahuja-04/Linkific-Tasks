// @vitest-environment jsdom
import { createRef, type ComponentType } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';
import { Accordion, Box, FancyButton, List, Select, TextInput, Toggle, countChildren, withLoading, withUser, type InjectedUser, type WithLoadingProps } from '../src/03-react-patterns';

afterEach(cleanup);

function Hello({ name }: { name: string }) {
  return <p>Hello {name}</p>;
}
function Greeter({ user, punctuation }: InjectedUser & { punctuation: string }) {
  return <p>Hi {user.name}{punctuation}</p>;
}

describe('03 HOCs', () => {
  it('withLoading adds a `loading` prop and keeps the original props', () => {
    const Loadable = withLoading(Hello);
    expectTypeOf(Loadable).toEqualTypeOf<ComponentType<{ name: string } & WithLoadingProps>>();
    const { rerender } = render(<Loadable name="Ann" loading />);
    expect(screen.getByRole('status')).toBeTruthy();
    rerender(<Loadable name="Ann" loading={false} />);
    expect(screen.getByText('Hello Ann')).toBeTruthy();
  });
  it('withLoading still checks the original props', () => {
    const Loadable = withLoading(Hello);
    // @ts-expect-error  `name` is still required
    render(<Loadable loading={false} />);
    cleanup();
  });
  it('withUser injects a prop: the new component no longer asks for it', () => {
    const Ready = withUser(Greeter, { name: 'Bo' });
    render(<Ready punctuation="!" />);
    expect(screen.getByText('Hi Bo!')).toBeTruthy();
    // @ts-expect-error  `punctuation` is still required; only `user` was removed
    render(<Ready />);
    cleanup();
  });
});

describe('03 render props', () => {
  it('List infers T from items', () => {
    render(<List items={[{ id: 1, label: 'one' }, { id: 2, label: 'two' }]} getKey={(i) => i.id} renderItem={(i) => <b>{i.label.toUpperCase()}</b>} />);
    expect(screen.getByText('TWO')).toBeTruthy();
  });
  it('List shows the empty state and rejects a wrong item usage', () => {
    render(<List items={[] as number[]} getKey={(n) => n} renderItem={(n) => n} empty={<em>none</em>} />);
    expect(screen.getByText('none')).toBeTruthy();
    expect(() =>
      // @ts-expect-error  items are numbers: `.toUpperCase` does not exist on number
      render(<List items={[1]} getKey={(n) => n} renderItem={(n) => n.toUpperCase()} />)
    ).toThrow();
  });
  it('Toggle passes state to children as a function', async () => {
    render(<Toggle>{({ on, toggle }) => <button onClick={toggle}>{on ? 'on' : 'off'}</button>}</Toggle>);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText('on')).toBeTruthy();
  });
});

describe('03 compound components', () => {
  it('Accordion.Item toggles through context', async () => {
    render(
      <Accordion defaultOpen="a">
        <Accordion.Item id="a" title="A">body a</Accordion.Item>
        <Accordion.Item id="b" title="B">body b</Accordion.Item>
      </Accordion>
    );
    expect(screen.getByText('body a')).toBeTruthy();
    expect(screen.queryByText('body b')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(screen.getByText('body b')).toBeTruthy();
    expect(screen.queryByText('body a')).toBeNull();
  });
  it('an Item outside the Accordion fails loudly; the static member is typed', () => {
    expect(() => render(<Accordion.Item id="x" title="X">x</Accordion.Item>)).toThrow('inside <Accordion>');
    // @ts-expect-error  Accordion has no `Panel` member
    expect(Accordion.Panel).toBeUndefined();
    expect(countChildren([<i key="1" />, <i key="2" />])).toBe(2);
  });
});

describe('03 polymorphic component', () => {
  it('renders the element named by `as` and accepts ITS props', () => {
    render(<Box as="a" href="/home" padding={4}>link</Box>);
    const a = screen.getByRole('link');
    expect(a.getAttribute('href')).toBe('/home');
    expect(a.style.padding).toBe('4px');
    render(<Box>plain</Box>);
    expect(screen.getByText('plain').tagName).toBe('DIV');
  });
  it('rejects props that do not belong to the chosen element', () => {
    // @ts-expect-error  a <div> has no `href`
    render(<Box href="/x">a</Box>);
    // @ts-expect-error  a <button> has no `href`
    render(<Box as="button" href="/x">b</Box>);
  });
});

describe('03 forwardRef and ref-as-prop', () => {
  it('forwardRef passes the ref to the input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextInput ref={ref} label="Name" defaultValue="x" />);
    expect(ref.current?.value).toBe('x');
    // @ts-expect-error  the ref must be for an input, not a button
    render(<TextInput ref={createRef<HTMLButtonElement>()} label="Name" />);
  });
  it('generic Select keeps T', async () => {
    const picked: number[] = [];
    render(<Select options={[10, 20, 30]} value={10} getLabel={(n) => `n${n}`} onChange={(n) => { picked.push(n); expectTypeOf(n).toBeNumber(); }} />);
    await userEvent.selectOptions(screen.getByRole('combobox'), 'n30');
    expect(picked).toEqual([30]);
    // @ts-expect-error  value must be one of the options' type (number), not a string
    render(<Select options={[1, 2]} value="x" getLabel={(n: number) => String(n)} onChange={() => {}} />);
  });
  it('React 19: ref is a plain prop', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<FancyButton ref={ref}>go</FancyButton>);
    expect(ref.current?.tagName).toBe('BUTTON');
  });
});
