import { execSync } from 'node:child_process';

/** Remove every account the browser tests registered (they all use the reserved .invalid domain) */
export default function teardown(): void {
  execSync(`docker exec supabase_db_intern-quest psql -U postgres -qc "delete from public.users where email like '%@test.invalid'"`, { stdio: 'ignore' });
}
