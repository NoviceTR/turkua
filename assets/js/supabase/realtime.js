import { getSupabaseClient, supabaseConfig } from './client.js';

export async function subscribe(options, callback, statusCallback) {
  const client = await getSupabaseClient();
  const channelName = options.channel ||
    `${supabaseConfig.realtime.channelPrefix}-${options.table || 'schema'}`;

  const filter = {
    event: options.event || '*',
    schema: options.schema || supabaseConfig.realtime.schema
  };
  if (options.table) filter.table = options.table;
  if (options.filter) filter.filter = options.filter;

  const channel = client
    .channel(channelName)
    .on('postgres_changes', filter, callback)
    .subscribe(statusCallback);

  return channel;
}

export async function removeChannel(channel) {
  const client = await getSupabaseClient();
  return client.removeChannel(channel);
}

export async function removeAllChannels() {
  const client = await getSupabaseClient();
  return client.removeAllChannels();
}
