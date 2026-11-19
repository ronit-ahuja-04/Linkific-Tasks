// @vitest-environment jsdom
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Text } from '../../src/components/Text';

describe('Text, a polymorphic component', () => {
  it('renders a paragraph by default and any element with `as`', () => {
    render(<><Text>plain</Text><Text as="h3" id="title">heading</Text><Text as="a" href="/docs" muted>link</Text></>);
    expect(screen.getByText('plain').tagName).toBe('P');
    expect(screen.getByRole('heading', { name: 'heading' }).id).toBe('title');
    const link = screen.getByRole('link', { name: 'link' });
    expect(link.getAttribute('href')).toBe('/docs');
    expect(link.className).toBe('muted');
  });

  it('passes a ref to the element it renders (React 19: ref is a prop)', () => {
    const ref = createRef<Element>();
    render(<Text as="span" ref={ref}>x</Text>);
    expect(ref.current?.tagName).toBe('SPAN');
  });

  it('takes only the props of the element it renders as', () => {
    // @ts-expect-error an <h3> has no `href`
    const bad = <Text as="h3" href="/docs">x</Text>;
    // @ts-expect-error `as` must be an element or component
    const worse = <Text as="not-an-element-type-object" />;
    expect(bad && worse).toBeTruthy();
  });
});
