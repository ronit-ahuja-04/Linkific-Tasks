import { Router } from 'express'

// Shows what the SERVER learned from the verified token (the Security page displays this).
export function meRouter() {
  const router = Router()
  router.get('/me', (req, res) => {
    const { claims, verifiedBy } = req.user
    res.json({
      uid: claims.sub,
      email: claims.email ?? null,
      emailVerified: claims.email_verified === true,
      name: claims.name ?? null,
      picture: claims.picture ?? null,
      provider: claims.firebase?.sign_in_provider ?? null,
      issuedAt: claims.iat * 1000,
      expiresAt: claims.exp * 1000,
      authTime: claims.auth_time * 1000,
      verifiedBy,
    })
  })
  return router
}
