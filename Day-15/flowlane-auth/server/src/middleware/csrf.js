// CSRF = another website making your browser send a request with your cookies.
// The refresh cookie is SameSite=Strict already; this is the second layer.
//  1. Require a custom header. A cross-site page cannot add X-Requested-With without a CORS
//     preflight, which our CORS policy refuses for foreign origins.
//  2. If the browser sent an Origin, it must be our client or this server itself.
import { AppError } from '../errors.js';

export function csrfGuard(config) {
  return (req, res, next) => {
    const blocked = () => next(new AppError(403, 'csrf_blocked', 'Request blocked for your protection.'));
    if (req.get('x-requested-with') !== 'fetch') return blocked();
    const origin = req.get('origin');
    if (origin) {
      const own = `${req.protocol}://${req.get('host')}`;
      if (origin !== config.clientOrigin && origin !== own) return blocked();
    }
    next();
  };
}
