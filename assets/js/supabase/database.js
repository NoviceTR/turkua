import { getSupabaseClient, supabaseConfig } from './client.js';

export async function from(tableName) {
  const client = await getSupabaseClient();
  return client.from(tableName);
}

export async function table(resourceName) {
  const tableName = supabaseConfig.resources.tables[resourceName];
  if (!tableName) throw new Error(`Bilinmeyen tablo kaynağı: ${resourceName}`);
  return from(tableName);
}

export async function rpc(functionName, params = {}) {
  const client = await getSupabaseClient();
  return client.rpc(functionName, params);
}
