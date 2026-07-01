import { getSupabaseClient } from './client.js';

export async function invoke(functionName, options = {}) {
  const client = await getSupabaseClient();
  return client.functions.invoke(functionName, options);
}
