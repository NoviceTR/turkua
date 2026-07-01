import { supabaseConfig } from './config.js';

const SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.105.3/+esm';

let client = null;
let initializationError = null;

function hasBrowserConfiguration() {
  let validUrl = false;
  try {
    const url = new URL(supabaseConfig.url);
    validUrl = url.protocol === 'https:' && Boolean(url.hostname);
  } catch (error) {
    validUrl = false;
  }
  const validKey = /^sb_publishable_/i.test(supabaseConfig.publishableKey);
  return validUrl && validKey;
}

async function initialize() {
  if (!hasBrowserConfiguration()) return null;

  try {
    const { createClient } = await import(SDK_URL);
    client = createClient(
      supabaseConfig.url,
      supabaseConfig.publishableKey,
      {
        db: { schema: supabaseConfig.schema },
        auth: supabaseConfig.auth
      }
    );
    return client;
  } catch (error) {
    initializationError = error;
    return null;
  }
}

export const supabaseReady = initialize();

export function getSupabaseStatus() {
  return Object.freeze({
    configured: hasBrowserConfiguration(),
    connected: Boolean(client),
    error: initializationError
  });
}

export async function getSupabaseClient() {
  await supabaseReady;
  if (client) return client;

  if (!hasBrowserConfiguration()) {
    throw new Error('Supabase URL veya publishable key yapılandırılmadı.');
  }
  throw initializationError || new Error('Supabase istemcisi başlatılamadı.');
}

export { supabaseConfig };
