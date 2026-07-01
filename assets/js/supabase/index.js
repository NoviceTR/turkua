import * as auth from './auth.js';
import * as database from './database.js';
import * as storage from './storage.js';
import * as realtime from './realtime.js';
import * as functions from './functions.js';

export {
  getSupabaseClient,
  getSupabaseStatus,
  supabaseConfig,
  supabaseReady
} from './client.js';

export const supabaseServices = Object.freeze({
  auth,
  database,
  storage,
  realtime,
  functions
});
