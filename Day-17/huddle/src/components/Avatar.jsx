import { avatarUrl, initials } from '../lib/avatars';
import { useAuth } from '../auth/AuthContext';

/** A profile picture from the public 'avatars' bucket, or the person's initials */
export default function Avatar({ profile, size = 32, className = '' }) {
  const { client } = useAuth();
  const url = avatarUrl(client, profile?.avatar_path);
  return (
    <span className={`avatar ${className}`.trim()} style={{ width: size, height: size, fontSize: Math.max(11, size * 0.4) }} aria-hidden="true">
      {url ? <img src={url} alt="" /> : initials(profile)}
    </span>
  );
}
