import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { CheckCircle2 } from 'lucide-react';
import { Button, Card, toneColors } from '../components/ui.jsx';
import { animatePop, animateRise } from '../styles/animations.js';

const Center = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 0;
  min-height: 60vh;
`;
const Panel = styled(Card).attrs({ as: 'section' })`
  width: 100%;
  max-width: 32rem;
  padding: 1.5rem;
  text-align: center;
  ${animateRise}
  ${({ theme }) => theme.media.up('sm')} {
    padding: 3rem;
  }
  h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
  }
`;
const Check = styled.span`
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  ${animatePop}
  background: ${({ theme }) => toneColors(theme, 'good').bg};
  color: ${({ theme }) => toneColors(theme, 'good').fg};
`;
const Text = styled.p`
  margin: 0.5rem auto 0;
  max-width: 28rem;
  color: ${({ theme }) => theme.colors.muted};
  code {
    word-break: break-word;
  }
`;
const Actions = styled.div`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.75rem;
  ${({ theme }) => theme.media.up('sm')} {
    flex-direction: row;
  }
`;

export default function ContactSent() {
  return (
    <Center>
      <Panel aria-labelledby="contact-sent-title">
        <Check aria-hidden="true">
          <CheckCircle2 size={44} />
        </Check>
        <h1 id="contact-sent-title">Message received</h1>
        <Text>
          The form was submitted with{' '}
          <code>navigate(&apos;/contact/sent&apos;, {'{ replace: true }'})</code>. Press your
          browser&apos;s Back button: it skips the form you already sent.
        </Text>
        <Actions>
          <Button as={Link} to="/" $variant="primary">
            Back to mission control
          </Button>
          <Button as={Link} to="/contact" $variant="secondary">
            Send another
          </Button>
        </Actions>
      </Panel>
    </Center>
  );
}
