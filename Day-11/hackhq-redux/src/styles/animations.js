import { css, keyframes } from 'styled-components';

export const rise = keyframes`from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; }`;
export const fade = keyframes`from { opacity: 0; } to { opacity: 1; }`;
export const pop = keyframes`from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: none; }`;
export const toast = keyframes`from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; }`;
export const flap = keyframes`0%, 100% { transform: rotateX(0deg); } 50% { transform: rotateX(-90deg); }`;
export const settle = keyframes`from { opacity: .5; transform: translateY(-8px); } to { opacity: 1; transform: none; }`;
export const pingSlow = keyframes`75%, 100% { transform: scale(2.2); opacity: 0; }`;
export const float = keyframes`0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); }`;
export const scan = keyframes`from { transform: translateY(-100%); } to { transform: translateY(100%); }`;
export const spin = keyframes`to { transform: rotate(360deg); }`;
export const shimmer = keyframes`0%, 100% { opacity: .5; } 50% { opacity: 1; }`;

// css helpers: drop into any styled component, e.g. `${animateRise}`
export const animateRise = css`
  animation: ${rise} 420ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
`;
export const animateFade = css`
  animation: ${fade} 200ms ease-out both;
`;
export const animatePop = css`
  animation: ${pop} 220ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
`;
export const animateToast = css`
  animation: ${toast} 260ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
`;
export const animateFlap = css`
  animation: ${flap} 260ms cubic-bezier(0.4, 0, 0.2, 1);
`;
export const animateSettle = css`
  animation: ${settle} 260ms ease-out both;
`;
export const animateFloat = css`
  animation: ${float} 6s ease-in-out infinite;
`;
export const animateScan = css`
  animation: ${scan} 3s linear infinite;
`;
