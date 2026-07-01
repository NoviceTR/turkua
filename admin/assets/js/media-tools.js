const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const AD_TYPES = new Set([...MEDIA_TYPES, 'image/gif']);

export function validateMediaFile(file, bucketName) {
  if (!file?.size) throw new Error('Bir görsel seçin.');
  if (file.size > MAX_IMAGE_SIZE) throw new Error('Görsel en fazla 5 MB olabilir.');
  const allowed = bucketName === 'ads' ? AD_TYPES : MEDIA_TYPES;
  if (!allowed.has(file.type)) {
    throw new Error(bucketName === 'ads'
      ? 'JPG, PNG, WEBP veya GIF dosyası seçin.'
      : 'JPG, PNG veya WEBP dosyası seçin.');
  }
}

async function imageDimensions(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  } catch (error) {
    return { width: null, height: null };
  }
}

function fileExtension(file) {
  return file.name.split('.').pop()?.toLocaleLowerCase('en').replace(/[^a-z0-9]/g, '') || 'img';
}

export function bindMediaDropZone({ zone, input, onFile, showToast }) {
  if (!zone || !input) return () => {};
  const selectFile = file => {
    if (!file) return;
    try {
      validateMediaFile(file, zone.dataset.bucket || 'media');
      onFile(file);
    } catch (error) {
      input.value = '';
      showToast(error.message);
    }
  };
  const prevent = event => {
    event.preventDefault();
    event.stopPropagation();
  };
  const enter = event => {
    prevent(event);
    zone.classList.add('is-dragging');
  };
  const leave = event => {
    prevent(event);
    zone.classList.remove('is-dragging');
  };
  const drop = event => {
    leave(event);
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    selectFile(file);
  };
  const change = () => selectFile(input.files?.[0]);
  const click = event => {
    if (event.target !== input) input.click();
  };

  zone.addEventListener('dragenter', enter);
  zone.addEventListener('dragover', enter);
  zone.addEventListener('dragleave', leave);
  zone.addEventListener('drop', drop);
  zone.addEventListener('click', click);
  input.addEventListener('change', change);

  return () => {
    zone.removeEventListener('dragenter', enter);
    zone.removeEventListener('dragover', enter);
    zone.removeEventListener('dragleave', leave);
    zone.removeEventListener('drop', drop);
    zone.removeEventListener('click', click);
    input.removeEventListener('change', change);
  };
}

export async function uploadManagedMedia({
  services,
  file,
  bucketName,
  folder,
  altText = '',
  sortOrder = 100
}) {
  validateMediaFile(file, bucketName);
  const id = crypto.randomUUID();
  const path = `${folder}/${id}.${fileExtension(file)}`;
  const { error: uploadError } = await services.storage.upload(bucketName, path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false
  });
  if (uploadError) throw uploadError;

  const { data } = await services.storage.getPublicUrl(bucketName, path);
  const dimensions = await imageDimensions(file);
  const record = {
    id,
    bucket_name: bucketName,
    object_path: path,
    public_url: data.publicUrl,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    width: dimensions.width,
    height: dimensions.height,
    alt_text: altText,
    is_active: true,
    sort_order: sortOrder
  };
  const table = await services.database.table('mediaAssets');
  const { error: mediaError } = await table.insert(record);
  if (mediaError) {
    await services.storage.remove(bucketName, [path]);
    throw mediaError;
  }
  return record;
}

export async function mediaReferences(services, media) {
  const checks = [
    ['heroContent', 'background_media_id', media.id, 'Hero'],
    ['newsItems', 'media_asset_id', media.id, 'Yeni haber'],
    ['sectionCards', 'media_asset_id', media.id, 'Bölüm kartı'],
    ['sponsoredAds', 'media_asset_id', media.id, 'Sponsor reklam'],
    ['news', 'image_path', media.object_path, 'Haber'],
    ['ads', 'image_path', media.object_path, 'Reklam']
  ];
  const results = await Promise.all(checks.map(async ([resource, column, value, label]) => {
    const table = await services.database.table(resource);
    const { count, error } = await table
      .select('id', { count: 'exact', head: true })
      .eq(column, value);
    if (error) throw error;
    return count ? `${label} (${count})` : '';
  }));
  return results.filter(Boolean);
}

export async function deleteManagedMedia(services, media, { checkReferences = true } = {}) {
  if (!media?.id) return;
  if (checkReferences) {
    const references = await mediaReferences(services, media);
    if (references.length) {
      throw new Error(`Bu görsel kullanımda: ${references.join(', ')}.`);
    }
  }
  const { error: storageError } = await services.storage.remove(
    media.bucket_name,
    [media.object_path]
  );
  if (storageError) throw storageError;
  const table = await services.database.table('mediaAssets');
  const { error: deleteError } = await table.delete().eq('id', media.id);
  if (deleteError) throw deleteError;
}

export async function deleteManagedMediaByPath(services, bucketName, objectPath) {
  if (!objectPath) return;
  const table = await services.database.table('mediaAssets');
  const { data, error } = await table
    .select('*')
    .eq('bucket_name', bucketName)
    .eq('object_path', objectPath)
    .limit(1);
  if (error) throw error;
  if (data?.[0]) {
    await deleteManagedMedia(services, data[0], { checkReferences: false });
    return;
  }
  const { error: storageError } = await services.storage.remove(bucketName, [objectPath]);
  if (storageError) throw storageError;
}

export async function replaceManagedMedia(services, media, file) {
  validateMediaFile(file, media.bucket_name);
  const replacement = await uploadManagedMedia({
    services,
    file,
    bucketName: media.bucket_name,
    folder: `library/${media.bucket_name}`,
    altText: media.alt_text,
    sortOrder: media.sort_order
  });
  const { error: replaceError } = await services.database.rpc('replace_media_asset_references', {
    p_old_media_id: media.id,
    p_new_media_id: replacement.id,
    p_old_object_path: media.object_path,
    p_new_object_path: replacement.object_path,
    p_new_public_url: replacement.public_url
  });
  if (replaceError) {
    await deleteManagedMedia(services, replacement, { checkReferences: false });
    throw replaceError;
  }
  try {
    await deleteManagedMedia(services, media, { checkReferences: false });
  } catch (error) {
    replacement.cleanup_warning = true;
  }
  return replacement;
}
