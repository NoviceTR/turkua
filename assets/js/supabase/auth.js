import { getSupabaseClient } from './client.js';

export async function getSession() {
  const client = await getSupabaseClient();
  return client.auth.getSession();
}

export async function getUser() {
  const client = await getSupabaseClient();
  return client.auth.getUser();
}

export async function signInWithPassword(credentials) {
  const client = await getSupabaseClient();
  return client.auth.signInWithPassword(credentials);
}

export async function signOut() {
  const client = await getSupabaseClient();
  return client.auth.signOut();
}

export async function onAuthStateChange(callback) {
  const client = await getSupabaseClient();
  return client.auth.onAuthStateChange(callback);
}
