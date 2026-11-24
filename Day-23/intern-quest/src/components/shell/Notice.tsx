const NOTICES: Record<string, string> = {
  'mentors-only': 'The Guild hall is for mentors. Have an invite code? Enter it on your character page.',
  deleted: 'Quest deleted.',
  saved: 'Character saved.',
  welcome: 'Welcome! First, create your character.',
  promoted: 'You are now a guild master. The Guild hall is open to you.',
};

/** A one-line message after a redirect (?notice=deleted …), shown at the top of a page. Unknown codes show nothing. */
export default function Notice({ code }: { code: string | string[] | undefined }) {
  const message = typeof code === 'string' ? NOTICES[code] : undefined;
  return message ? <p className="notice" role="status">{message}</p> : null;
}
