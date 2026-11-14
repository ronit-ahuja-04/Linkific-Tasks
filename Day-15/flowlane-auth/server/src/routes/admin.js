import { Router } from 'express';

export function createAdminRouter(ctx) {
  const router = Router();
  // Authorization by ROLE: authenticated is not enough, the user must also be an admin.
  router.use(ctx.auth.requireAuth, ctx.auth.requireRole('admin'));

  router.get('/users', (req, res) => {
    const users = ctx.store.users.all().map((u) => ({
      id: u.id, name: u.name, email: u.email, role: u.role,
      emailVerified: Boolean(u.emailVerified), provider: u.provider, createdAt: u.createdAt,
    }));
    res.json({ users });
  });

  return router;
}
