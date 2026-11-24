/**
 * Pip's colours and accessories, in a plain module (no 'use client') so server code such as the share-card image can
 * import them too. The animated Pip component re-exports them.
 */
export const PIP_TINTS = ['#FFF7EC', '#DFF7E8', '#DDEEFF', '#FFE4D6', '#EDE4FF', '#FFF6C8', '#FFE0EA', '#ECEAE6'] as const;
export const PIP_TINT_NAMES = ['Cream', 'Mint', 'Sky', 'Peach', 'Lilac', 'Lemon', 'Rose', 'Stone'] as const;
export const PIP_ACCESSORIES = ['None', 'Glasses', 'Scarf', 'Bow', 'Headphones', 'Freckles'] as const;
