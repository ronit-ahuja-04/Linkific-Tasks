import common from './common';
import auth from './auth';
import dashboard from './dashboard';
import task from './task';
import chat from './chat';
import settings from './settings';

// One file per area of the app, merged into one flat dictionary of dotted keys
export default { ...common, ...auth, ...dashboard, ...task, ...chat, ...settings };
