import styled from 'styled-components';

const Track = styled.button`
  position: relative; width: 56px; height: 30px; padding: 0; cursor: pointer;
  border-radius: 999px; border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.secondary};
  &:focus-visible { outline: 3px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
`;

const Knob = styled.span`
  position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%;
  display: grid; place-items: center; font-size: 13px;
  background: ${({ theme }) => theme.colors.primary};
  transform: translateX(${({ $dark }) => ($dark ? '26px' : '0')});
  transition: transform .2s;
`;

export function ThemeSwitcher({ mode, onToggle }) {
  const dark = mode === 'dark';
  return (
    <Track role="switch" aria-checked={dark} aria-label="Dark mode" onClick={onToggle}>
      <Knob $dark={dark}>{dark ? '🌙' : '☀️'}</Knob>
    </Track>
  );
}
