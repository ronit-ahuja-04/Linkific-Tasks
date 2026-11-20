'use client';

import { useState } from 'react';

/** Client component: it holds state and handles clicks. The count is local to the page view (there is no database). */
export default function LikeButton({ initial = 0 }: { initial?: number }) {
  const [likes, setLikes] = useState(initial);
  const [liked, setLiked] = useState(false);
  return (
    <button
      type="button"
      className="btn"
      aria-pressed={liked}
      onClick={() => {
        setLikes((n) => (liked ? n - 1 : n + 1));
        setLiked((v) => !v);
      }}
    >
      {liked ? '♥' : '♡'} {likes} {likes === 1 ? 'like' : 'likes'}
    </button>
  );
}
