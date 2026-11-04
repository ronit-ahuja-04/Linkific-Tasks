import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import styled, { css } from 'styled-components';
import { animatePop } from '../styles/animations.js';

const TOKENS = {
  key: css`
    font-weight: 500;
    color: #6cc8f0;
  `,
  string: css`
    color: #4cc38a;
  `,
  bool: css`
    font-weight: 600;
    color: #ff6b7a;
  `,
  null: css`
    font-style: italic;
    color: #ff6b7a;
  `,
  number: css`
    color: #ffc857;
  `,
};
const Tok = styled.span`
  ${({ $kind }) => TOKENS[$kind]}
`;

const Panel = styled.aside`
  position: fixed;
  bottom: 0;
  right: 0;
  margin: 1rem;
  padding: 1rem;
  overflow: hidden;
  z-index: 1040;
  width: min(360px, calc(100vw - 1.5rem));
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid #6c757d;
  box-shadow: 0 1rem 3rem rgb(0 0 0 / 0.3);
  font-family: ${({ theme }) => theme.fonts.mono};
  background: ${({ theme }) => theme.colors.board};
  color: ${({ theme }) => theme.colors.onBoard};
  ${animatePop}
`;
const Top = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
`;
const TitleWrap = styled.div`
  min-width: 0;
`;
const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }
`;
const LiveDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.brand};
`;
const Sub = styled.span`
  display: block;
  margin-top: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875em;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.75;
`;
const BtnRow = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.25rem;
`;
const XrayBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
  color: #f8f9fa;
  background: transparent;
  border: 1px solid #f8f9fa;
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  transition:
    background-color 0.15s,
    color 0.15s;
  &:hover {
    background: #f8f9fa;
    color: #000;
  }
`;
const Rule = styled.hr`
  margin: 1rem 0;
  border: 0;
  border-top: 1px solid #6c757d;
  opacity: 0.5;
`;
const Scroll = styled.div`
  overflow: auto;
  max-height: 50vh;
  padding: 1rem;
  border-radius: ${({ theme }) => theme.radii.md};
  background: rgba(0, 0, 0, 0.3);
`;
const Pre = styled.pre`
  margin: 0;
  font-size: 0.875em;
  color: inherit;
`;
const Line = styled.span`
  white-space: pre;
`;

/**
 * Format and highlight JSON tokens using design spec color tokens:
 * - Keys: lanyard
 * - Strings: mint
 * - Numbers: tape
 * - Booleans / Null: signal
 */
function highlightJSON(jsonString) {
  if (!jsonString) return null;

  // Split lines and token regex
  return jsonString.split('\n').map((line, lineIdx) => {
    // Match JSON components: keys, strings, numbers, booleans, null
    const parts = [];
    const regex =
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }

      const str = match[0];
      let kind;

      if (/^"/.test(str)) {
        kind = /:$/.test(str) ? 'key' : 'string';
      } else if (/true|false/.test(str)) {
        kind = 'bool';
      } else if (/null/.test(str)) {
        kind = 'null';
      } else {
        kind = 'number';
      }

      parts.push(
        <Tok key={`${lineIdx}-${match.index}`} $kind={kind}>
          {str}
        </Tok>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    return (
      <div key={lineIdx}>
        <Line>{parts}</Line>
      </div>
    );
  });
}

export default function StateXray({
  stationName,
  activeStation,
  stationNames,
  statePayload,
  isOpen,
  onClose,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const stationTitle =
    stationName ||
    (stationNames && activeStation ? stationNames[activeStation] : null) ||
    activeStation ||
    'Active Station';
  const jsonOutput = JSON.stringify(statePayload, null, 2);

  const handleCopy = () => {
    navigator.clipboard?.writeText(jsonOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Panel role="complementary" aria-label={`Live State X-ray telemetry for ${stationTitle}`}>
      <Top>
        <TitleWrap>
          <TitleRow>
            <h2>State X-ray</h2>
            <LiveDot aria-hidden="true" />
          </TitleRow>
          <Sub>Live state for {stationTitle.toLowerCase()}</Sub>
        </TitleWrap>
        <BtnRow>
          <XrayBtn
            type="button"
            onClick={handleCopy}
            title="Copy state JSON"
            aria-label="Copy state JSON"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </XrayBtn>
          <XrayBtn
            type="button"
            onClick={onClose}
            title="Close X-ray panel"
            aria-label="Close State X-ray"
          >
            <X size={14} />
          </XrayBtn>
        </BtnRow>
      </Top>

      <Rule />

      <Scroll>
        <Pre tabIndex={0} aria-label="Live JSON state view">
          <code>{highlightJSON(jsonOutput)}</code>
        </Pre>
      </Scroll>
    </Panel>
  );
}
