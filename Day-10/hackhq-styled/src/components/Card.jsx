import styled from 'styled-components';

export const Card = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadow};
  padding: ${({ theme }) => theme.space(5)};
  transition: transform .15s, border-color .15s;

  ${({ $interactive, theme }) => $interactive && `
    cursor: pointer;
    &:hover { transform: translateY(-3px); border-color: ${theme.colors.primary}; }
  `}
`;

export const CardTitle = styled.h3`
  font-size: 1.1rem;
  margin-bottom: ${({ theme }) => theme.space(1)};
`;

export const CardText = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(3)};
  color: ${({ theme }) => theme.colors.muted};
`;
