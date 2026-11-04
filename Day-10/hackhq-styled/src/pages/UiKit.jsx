import { useState } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { darken, getLuminance, lighten, transparentize } from 'polished';
import {
  Alert,
  Backdrop,
  Badge,
  Button,
  Card,
  Dialog,
  Eyebrow,
  FormGroup,
  Grid,
  Hint,
  ErrorText,
  Input,
  Label,
  Select,
  SectionTitle,
  Skeleton,
  Spinner,
  Stack,
  Textarea,
} from '../components/ui.jsx';
import { animateRise } from '../styles/animations.js';

/* Dynamic styling: props -> CSS, with polished colour helpers */
const Meter = styled.div`
  height: 0.625rem;
  border-radius: 999px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface2};
  &::before {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $pct }) => $pct}%;
    background: ${({ theme, $pct }) => ($pct > 80 ? theme.colors.bad : $pct > 50 ? theme.colors.warn : theme.colors.good)};
    transition:
      width 0.3s,
      background 0.3s;
  }
`;

/* Extending: same styles + overrides */
const PillButton = styled(Button)`
  border-radius: 999px;
`;

/* Pseudo-element + nested selector + sibling combinator */
const FancyLink = styled.a`
  position: relative;
  font-weight: 600;
  text-decoration: none;
  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -2px;
    height: 2px;
    width: 0;
    background: currentColor;
    transition: width 0.2s;
  }
  &:hover::after {
    width: 100%;
  }
  & + & {
    margin-left: 1rem;
  }
`;

/* css helper + conditional fragment */
const hoverLift = css`
  transition: transform 0.15s;
  &:hover {
    transform: translateY(-3px);
  }
`;
const Swatch = styled.div`
  ${hoverLift}
  ${animateRise}
  padding: 1rem;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 0.8125rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  background: ${({ $c }) => $c};
  color: ${({ $c }) => (getLuminance($c) > 0.4 ? '#0e0e11' : '#fff')};
  border: 1px solid ${({ theme }) => theme.colors.line};
`;

const Code = styled.pre`
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  font-size: 0.8rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  background: ${({ theme }) => theme.colors.board};
  color: ${({ theme }) => theme.colors.onBoard};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export default function UiKit() {
  const theme = useTheme();
  const [pct, setPct] = useState(40);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const emailError = email && !/^\S+@\S+\.\S+$/.test(email) ? 'Enter a valid email' : '';
  const c = theme.colors;

  return (
    <Stack $gap={10}>
      <div>
        <Eyebrow>Day 10 · CSS-in-JS</Eyebrow>
        <h1>UI kit</h1>
        <p>
          Every component below is a styled-component reading the active theme. Use the header
          toggle to flip light/dark.
        </p>
      </div>

      <section>
        <SectionTitle eyebrow="Variants" title="Buttons" />
        <Stack $dir="row" $wrap $align="center">
          <Button>Primary</Button>
          <Button $variant="secondary">Secondary</Button>
          <Button $variant="danger">Danger</Button>
          <Button $variant="ghost">Ghost</Button>
          <Button $variant="dark">Dark</Button>
          <Button disabled>Disabled</Button>
        </Stack>
        <Stack $dir="row" $wrap $align="center" style={{ marginTop: '1rem' }}>
          <Button $size="sm">Small</Button>
          <Button $size="lg">Large</Button>
          <PillButton $variant="secondary">Extended: pill</PillButton>
          <Button as="a" href="#kit-links" $variant="secondary">
            Rendered as &lt;a&gt; (as prop)
          </Button>
          <Button
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 1500);
            }}
          >
            {loading && <Spinner />} {loading ? 'Saving…' : 'Click for spinner'}
          </Button>
        </Stack>
      </section>

      <section>
        <SectionTitle eyebrow="Surfaces" title="Cards, badges, alerts" />
        <Grid $cols={{ base: 1, md: 3 }}>
          {[
            ['accent', 'Info'],
            ['good', 'Healthy'],
            ['bad', 'Blocked'],
          ].map(([tone, label]) => (
            <Card key={tone} $interactive>
              <Stack $gap={2}>
                <Badge $tone={tone}>{label}</Badge>
                <h3>Interactive card</h3>
                <p>
                  Hover me. <code>$interactive</code> adds a lift and an accent border.
                </p>
              </Stack>
            </Card>
          ))}
        </Grid>
        <Stack $gap={2} style={{ marginTop: '1rem' }}>
          <Alert $tone="good">Alert tone: good</Alert>
          <Alert $tone="warn">Alert tone: warn</Alert>
          <Alert $tone="bad">Alert tone: bad</Alert>
        </Stack>
      </section>

      <section>
        <SectionTitle eyebrow="Forms" title="Input fields" />
        <Grid $cols={{ base: 1, md: 3 }}>
          <FormGroup>
            <Label htmlFor="kit-email">Email</Label>
            <Input
              id="kit-email"
              $invalid={!!emailError}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@hackhq.dev"
            />
            {emailError ? (
              <ErrorText>{emailError}</ErrorText>
            ) : (
              <Hint>Type a bad email to see the error state</Hint>
            )}
          </FormGroup>
          <FormGroup>
            <Label htmlFor="kit-track">Track</Label>
            <Select id="kit-track">
              <option>Web</option>
              <option>AI</option>
              <option>Hardware</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="kit-note">Note</Label>
            <Textarea id="kit-note" rows={1} placeholder="Disabled" disabled />
          </FormGroup>
        </Grid>
      </section>

      <section>
        <SectionTitle eyebrow="Props → CSS" title="Dynamic styling" />
        <Card>
          <p>Capacity: {pct}% (bar goes green → amber above 50 → red above 80)</p>
          <Meter
            $pct={pct}
            role="meter"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Capacity"
          />
          <Stack $dir="row" style={{ marginTop: '1rem' }}>
            <Button
              $size="sm"
              $variant="secondary"
              onClick={() => setPct((p) => Math.max(0, p - 20))}
            >
              −20
            </Button>
            <Button $size="sm" onClick={() => setPct((p) => Math.min(100, p + 20))}>
              +20
            </Button>
          </Stack>
        </Card>
        <Grid $cols={{ base: 2, md: 4 }} style={{ marginTop: '1rem' }}>
          <Swatch $c={c.brand}>brand</Swatch>
          <Swatch $c={lighten(0.1, c.accent)}>lighten(accent)</Swatch>
          <Swatch $c={darken(0.1, c.accent)}>darken(accent)</Swatch>
          <Swatch $c={transparentize(0.6, c.bad)}>transparentize(bad)</Swatch>
        </Grid>
        <p style={{ marginTop: '1rem' }} id="kit-links">
          <FancyLink href="#kit-links">Hover underline</FancyLink>
          <FancyLink href="#kit-links">via ::after</FancyLink>
        </p>
        <Stack $dir="row" $gap={4} style={{ marginTop: '.5rem' }}>
          <Skeleton $w="8rem" />
          <Skeleton $w="5rem" />
        </Stack>
      </section>

      <section>
        <SectionTitle eyebrow="Overlay" title="Modal" />
        <Button $variant="danger" onClick={() => setOpen(true)}>
          Delete project…
        </Button>
        {open && (
          <Backdrop
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          >
            <Dialog aria-label="Delete project" onClick={(e) => e.stopPropagation()}>
              <h3>Delete this project?</h3>
              <p>This cannot be undone.</p>
              <Stack $dir="row" $justify="flex-end">
                <Button autoFocus $variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button $variant="danger" onClick={() => setOpen(false)}>
                  Delete
                </Button>
              </Stack>
            </Dialog>
          </Backdrop>
        )}
      </section>

      <section>
        <SectionTitle eyebrow="Snippet" title="How a variant works" />
        <Code>{`const Button = styled.button\`
  \${({ $variant = 'primary' }) => buttonVariants[$variant]}  // css helper
  \${({ $size = 'md' }) => buttonSizes[$size]}
\`;
<Button $variant="danger" as={Link} to="/x" />`}</Code>
      </section>
    </Stack>
  );
}
