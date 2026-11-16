import { defineConfig } from 'vitest/config';

// Security-rules tests need the Firestore and Storage emulators: run them with `npm run test:rules`.
// The files share one Firestore emulator and each clears it, so they must run one after the other.
export default defineConfig({ test: { include: ['test/rules/**/*.rules-test.js'], testTimeout: 20000, fileParallelism: false } });
