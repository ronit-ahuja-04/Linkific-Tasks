import styled, { css } from 'styled-components';

const Wrap = styled.label`
  display: flex; flex-direction: column; gap: 4px; font-size: .85rem; font-weight: 600;
`;

const Field = styled.input`
  padding: 9px 12px; font: inherit; font-weight: 400;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: border-color .15s, box-shadow .15s;

  &::placeholder { color: ${({ theme }) => theme.colors.muted}; }
  &:focus {
    outline: none;
    border-color: ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : theme.colors.primary)};
    box-shadow: 0 0 0 3px ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : theme.colors.primary)}33;
  }
  ${({ disabled }) => disabled && css`opacity: .55; cursor: not-allowed;`}
`;

const Hint = styled.span`
  font-weight: 400; font-size: .8rem;
  color: ${({ theme, $error }) => ($error ? theme.colors.danger : theme.colors.muted)};
`;

export function Input({ label, error, hint, ...props }) {
  return (
    <Wrap>
      {label}
      <Field $invalid={!!error} aria-invalid={!!error} {...props} />
      {(error || hint) && <Hint $error={!!error}>{error || hint}</Hint>}
    </Wrap>
  );
}
