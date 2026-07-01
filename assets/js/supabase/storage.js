import { getSupabaseClient, supabaseConfig } from './client.js';

function resolveBucket(bucketName) {
  return supabaseConfig.resources.buckets[bucketName] || bucketName;
}

export async function bucket(bucketName) {
  const client = await getSupabaseClient();
  return client.storage.from(resolveBucket(bucketName));
}

export async function upload(bucketName, path, file, options = {}) {
  const storageBucket = await bucket(bucketName);
  return storageBucket.upload(path, file, options);
}

export async function remove(bucketName, paths) {
  const storageBucket = await bucket(bucketName);
  return storageBucket.remove(paths);
}

export async function getPublicUrl(bucketName, path, options = {}) {
  const storageBucket = await bucket(bucketName);
  return storageBucket.getPublicUrl(path, options);
}

export async function createSignedUrl(bucketName, path, expiresIn, options = {}) {
  const storageBucket = await bucket(bucketName);
  return storageBucket.createSignedUrl(path, expiresIn, options);
}
