// Demo accounts for local development (SEED_DEMO=true). Idempotent.
import { hashPasswordSync } from './passwords.js';

export function seedDemo(store, config, now = Date.now) {
  const stamp = new Date(now()).toISOString();
  const add = (name, email, password, role) => {
    const existing = store.users.find((u) => u.email === email);
    if (existing) return existing;
    return store.users.insert({
      name, email, passwordHash: hashPasswordSync(password, config.bcryptCost), role,
      emailVerified: true, provider: 'password', githubId: null, avatarUrl: null, createdAt: stamp,
    });
  };
  const demo = add('Demo User', 'demo@flowlane.dev', 'Demo-Pass-123', 'member');
  add('Admin User', 'admin@flowlane.dev', 'Admin-Pass-123', 'admin');

  if (!store.projects.find((p) => p.userId === demo.id)) {
    const project = store.projects.insert({ userId: demo.id, name: 'Website launch', color: '#2563EB', createdAt: stamp });
    for (const [title, status] of [['Write the announcement post', 'done'], ['Fix the pricing page', 'doing'], ['Prepare the demo', 'todo']]) {
      store.tasks.insert({ projectId: project.id, title, status, createdAt: stamp });
    }
  }
}
