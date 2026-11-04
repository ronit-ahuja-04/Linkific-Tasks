import { useState } from 'react';
import styled, { ThemeProvider, css } from 'styled-components';
import { GlobalStyle } from './GlobalStyle';
import { useThemeMode } from './useTheme';
import { Button, PillButton, Card, CardTitle, CardText, Input, Modal, Badge, ThemeSwitcher } from './components';

const Page = styled.main`
  max-width: 980px; margin: 0 auto;
  padding: ${({ theme }) => theme.space(6)} ${({ theme }) => theme.space(4)} ${({ theme }) => theme.space(16)};
`;

const Header = styled.header`
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  margin-bottom: ${({ theme }) => theme.space(8)};
`;

const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.space(10)};
  > h2 { margin-bottom: ${({ theme }) => theme.space(1)}; }
  > p { margin: 0 0 ${({ theme }) => theme.space(4)}; color: ${({ theme }) => theme.colors.muted}; }
`;

const Row = styled.div`
  display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
`;

// Media query + nested styling: grid collapses on small screens
const Grid = styled.div`
  display: grid; gap: 16px; grid-template-columns: repeat(3, 1fr);
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) { grid-template-columns: 1fr; }
`;

// Dynamic styling: props -> CSS (progress bar)
const Bar = styled.div`
  height: 10px; border-radius: 999px; background: ${({ theme }) => theme.colors.secondary}; overflow: hidden;
  &::before {
    content: ''; display: block; height: 100%;
    width: ${({ $pct }) => $pct}%;
    background: ${({ theme, $pct }) => ($pct > 80 ? theme.colors.danger : theme.colors.primary)};
    transition: width .3s, background .3s;
  }
`;

const Heading = styled.h2`
  ${({ $big }) => $big && css`font-size: 2rem;`}
`;

// Pseudo-element + nested selector demo
const FancyLink = styled.a`
  position: relative; color: ${({ theme }) => theme.colors.primary}; font-weight: 600; text-decoration: none;
  &::after {
    content: ''; position: absolute; left: 0; bottom: -2px; height: 2px; width: 0;
    background: currentColor; transition: width .2s;
  }
  &:hover::after { width: 100%; }
  & + & { margin-left: 16px; }
`;

const Code = styled.pre`
  margin: 0; padding: 12px 16px; overflow-x: auto; font-size: .8rem;
  background: ${({ theme }) => theme.colors.surface}; border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export default function App() {
  const { mode, toggle, theme } = useThemeMode();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [pct, setPct] = useState(40);

  const emailError = email && !/^\S+@\S+\.\S+$/.test(email) ? 'Enter a valid email' : '';

  const fakeSubmit = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Page>
        <Header>
          <div>
            <Heading as="h1" $big>HackHQ UI Kit</Heading>
            <Badge>styled-components v6</Badge> <Badge $tone="neutral">{mode} theme</Badge>
          </div>
          <ThemeSwitcher mode={mode} onToggle={toggle} />
        </Header>

        <Section>
          <h2>Button variants</h2>
          <p>One component, variants + sizes via transient props ($variant, $size).</p>
          <Row>
            <Button>Primary</Button>
            <Button $variant="secondary">Secondary</Button>
            <Button $variant="danger">Danger</Button>
            <Button $variant="ghost">Ghost</Button>
            <Button disabled>Disabled</Button>
          </Row>
          <br />
          <Row>
            <Button $size="sm">Small</Button>
            <Button $size="lg">Large</Button>
            <PillButton>Extended: PillButton</PillButton>
            <Button as="a" href="#links" $variant="secondary">I am an &lt;a&gt; (as prop)</Button>
            <Button $loading={loading} onClick={fakeSubmit}>{loading ? 'Saving' : 'Click for spinner'}</Button>
          </Row>
        </Section>

        <Section>
          <h2>Cards</h2>
          <p>Theme tokens for colour, radius, spacing; $interactive adds hover lift. Grid uses media queries.</p>
          <Grid>
            {[['Hack Night', 'info', 'Open'], ['Judging', 'neutral', 'Soon'], ['Prizes', 'danger', 'Closing']].map(([t, tone, label]) => (
              <Card key={t} $interactive>
                <CardTitle>{t} <Badge $tone={tone}>{label}</Badge></CardTitle>
                <CardText>Hover me. Styles are scoped to a generated class, so nothing leaks.</CardText>
                <Button $size="sm" $variant="ghost">Details</Button>
              </Card>
            ))}
          </Grid>
        </Section>

        <Section>
          <h2>Inputs</h2>
          <p>Validation state flows in as a prop and restyles border, focus ring and hint.</p>
          <Grid>
            <Input label="Email" placeholder="you@hackhq.dev" value={email} onChange={(e) => setEmail(e.target.value)} error={emailError} hint="We never share it" />
            <Input label="Team name" placeholder="Team Rocket" />
            <Input label="Disabled" placeholder="Locked" disabled />
          </Grid>
        </Section>

        <Section>
          <h2>Dynamic styling</h2>
          <p>Capacity: {pct}% (bar turns red above 80%).</p>
          <Bar $pct={pct} />
          <br />
          <Row>
            <Button $size="sm" $variant="secondary" onClick={() => setPct((p) => Math.max(0, p - 20))}>-20</Button>
            <Button $size="sm" onClick={() => setPct((p) => Math.min(100, p + 20))}>+20</Button>
          </Row>
        </Section>

        <Section id="links">
          <h2>Pseudo-elements and nesting</h2>
          <p>Underline grows on hover via &amp;::after.</p>
          <FancyLink href="#links">Rules</FancyLink>
          <FancyLink href="#links">Schedule</FancyLink>
          <FancyLink href="#links">Sponsors</FancyLink>
        </Section>

        <Section>
          <h2>Modal</h2>
          <p>Keyframe animations, Esc and overlay click to close.</p>
          <Button $variant="danger" onClick={() => setOpen(true)}>Delete project…</Button>
          <Modal
            open={open}
            title="Delete this project?"
            onClose={() => setOpen(false)}
            actions={<>
              <Button $variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button $variant="danger" onClick={() => setOpen(false)}>Delete</Button>
            </>}
          >
            This cannot be undone.
          </Modal>
        </Section>

        <Section>
          <h2>Snippet</h2>
          <Code>{`const Button = styled.button\`
  background: \${({ theme }) => theme.colors.primary};
  \${({ $variant }) => variants[$variant]}
\`;`}</Code>
        </Section>
      </Page>
    </ThemeProvider>
  );
}
