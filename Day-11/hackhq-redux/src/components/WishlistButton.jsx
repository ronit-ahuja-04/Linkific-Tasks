import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Heart } from 'lucide-react';
import styled from 'styled-components';
import { IconButton } from './ui.jsx';
import { makeSelectIsWishlisted, wishlistToggled } from '../store/slices/wishlistSlice.js';
import { notify } from '../store/slices/toastsSlice.js';

const Toggle = styled(IconButton)`
  width: 2rem;
  height: 2rem;
  color: ${({ theme, $on }) => ($on ? theme.colors.bad : theme.colors.muted)};
  svg {
    fill: ${({ $on }) => ($on ? 'currentColor' : 'none')};
    transition: transform 0.15s;
  }
  &:hover svg {
    transform: scale(1.15);
  }
`;

/** Heart button: saves or removes one product from the wishlist */
export default function WishlistButton({ productId, productName }) {
  // REDUX: a selector factory built once per product, so only this button re-renders when
  // this product's saved state changes
  const selectIsSaved = useMemo(() => makeSelectIsWishlisted(productId), [productId]);
  const saved = useSelector(selectIsSaved);
  const dispatch = useDispatch();

  const handleClick = () => {
    dispatch(wishlistToggled(productId));
    dispatch(
      notify(
        saved ? `Removed ${productName} from wishlist` : `Saved ${productName} to wishlist`,
        null,
        saved ? 'info' : 'success'
      )
    );
  };

  return (
    <Toggle
      $variant="ghost"
      $on={saved}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      onClick={handleClick}
    >
      <Heart size={18} aria-hidden="true" />
    </Toggle>
  );
}
