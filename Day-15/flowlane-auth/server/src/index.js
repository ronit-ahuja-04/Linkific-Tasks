import 'dotenv/config';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { seedDemo } from './seed.js';
import { createStore } from './store.js';

const config = loadConfig(process.env);
const store = createStore({ dbFile: config.dbFile });
if (config.seedDemo) seedDemo(store, config);

if (config.secretGenerated) {
  console.warn('[config] JWT_SECRET is not set: using a random one. All tokens become invalid when the server restarts.');
}

const app = createApp({ config, store });
app.listen(config.port, () => {
  // Never print secrets: only non-sensitive settings.
  console.log(`FlowLane API listening on http://localhost:${config.port} (${config.nodeEnv})`);
  console.log(`  client: ${config.clientUrl} | dev outbox: ${config.enableDevOutbox} | fake OAuth: ${config.oauthFake} | db: ${config.dbFile === ':memory:' ? 'memory' : 'file'}`);
});
