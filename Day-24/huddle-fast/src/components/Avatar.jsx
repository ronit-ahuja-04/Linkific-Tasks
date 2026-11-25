import { avatarSources, initials } from '../lib/avatars';
import { useAuth } from '../auth/AuthContext';

/**
 * A profile picture from the public 'avatars' bucket, or the person's initials.
 * Day 24: the smallest file that is sharp at this size (srcSet + sizes), a fixed width and height (no layout shift when
 * it arrives), and lazy loading: an avatar far down a 500-message chat is not downloaded until scrolled near.
 * `priority` is for the one avatar that is the page's main picture (the profile page): loaded at once, first.
 */
export default function Avatar({ profile, size = 32, className = '', priority = false }) {
  const { client } = useAuth();
  const sources = avatarSources(client, profile?.avatar_path);
  return (
    <span className={`avatar ${className}`.trim()} style={{ width: size, height: size, fontSize: Math.max(11, size * 0.4) }} aria-hidden="true">
      {sources ? (
        <img src={sources.src} srcSet={sources.srcSet} sizes={sources.srcSet ? `${size}px` : undefined} width={size} height={size} alt=""
          loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : undefined} />
      ) : initials(profile)}
    </span>
  );
}
