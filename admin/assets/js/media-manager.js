import { createMetric, escapeHtml, formatNumber } from './utils.js';
import {
  bindMediaDropZone,
  deleteManagedMedia,
  replaceManagedMedia,
  uploadManagedMedia
} from './media-tools.js';

const usageOptions = {
  news: { label: 'Haber görseli', bucket: 'media', folder: 'library/news' },
  hero: { label: 'Hero arka planı', bucket: 'media', folder: 'library/hero' },
  sponsor: { label: 'Sponsor logosu', bucket: 'ads', folder: 'library/sponsors' },
  banner: { label: 'Reklam bannerı', bucket: 'ads', folder: 'library/banners' }
};

export function createMediaManager({ services, config, isConnected, showToast }) {
  const state = {
    records: [],
    selectedFile: null,
    replacing: null,
    channel: null,
    unbindDrop: null
  };

  function showSetup(message = '') {
    const notice = document.getElementById('mediaSetupNotice');
    notice.classList.remove('is-hidden');
    if (message) notice.querySelector('p').textContent = message;
    document.getElementById('mediaUploadPanel').classList.add('is-hidden');
  }

  function preview(file) {
    const target = document.getElementById('mediaUploadPreview');
    target.classList.toggle('is-hidden', !file);
    target.style.backgroundImage = file ? `url("${URL.createObjectURL(file)}")` : '';
    document.getElementById('mediaSelectedName').textContent = file?.name || 'Dosya seçilmedi';
  }

  function renderMetrics() {
    const target = document.getElementById('mediaMetrics');
    const bytes = state.records.reduce((total, item) => total + Number(item.size_bytes || 0), 0);
    const used = state.records.filter(item => item.is_active).length;
    target.replaceChildren(
      createMetric('Toplam medya', state.records.length, 'Kayıtlı görseller'),
      createMetric('Aktif', used, 'Kullanıma açık'),
      createMetric('Medya bucket', state.records.filter(item => item.bucket_name === 'media').length, 'Hero ve haber'),
      createMetric('Toplam boyut', `${(bytes / 1048576).toFixed(2)} MB`, 'Storage kullanımı')
    );
  }

  function renderGrid() {
    const grid = document.getElementById('mediaLibraryGrid');
    if (!state.records.length) {
      grid.innerHTML = '<div class="view-loading">Henüz medya yüklenmedi.</div>';
      return;
    }
    grid.replaceChildren(...state.records.map(item => {
      const card = document.createElement('article');
      card.className = 'media-library-card';
      card.innerHTML = `
        <div class="media-library-image" style="background-image:url('${escapeHtml(item.public_url)}')"></div>
        <div class="media-library-body">
          <strong>${escapeHtml(item.file_name)}</strong>
          <small>${escapeHtml(item.bucket_name)} · ${formatNumber(item.size_bytes)} bayt</small>
          <p>${escapeHtml(item.alt_text || 'Açıklama yok')}</p>
          <div class="media-library-actions">
            <button class="row-action" type="button" data-media-action="replace" data-media-id="${item.id}">Değiştir</button>
            <button class="row-action danger-text" type="button" data-media-action="delete" data-media-id="${item.id}">Sil</button>
          </div>
        </div>`;
      return card;
    }));
  }

  async function load() {
    if (!isConnected()) {
      showSetup();
      return;
    }
    try {
      const table = await services.database.table('mediaAssets');
      const { data, error } = await table.select('*').order('created_at', { ascending: false });
      if (error) throw error;
      state.records = data || [];
      renderMetrics();
      renderGrid();
    } catch (error) {
      showSetup('Medya tabloları veya Storage bucket’ları hazır değil. Kurulum adımlarını uygulayın.');
    }
  }

  async function upload(event) {
    event.preventDefault();
    if (!state.selectedFile) return showToast('Önce bir görsel seçin.');
    const form = event.currentTarget;
    const usage = usageOptions[form.elements.usage.value];
    await uploadManagedMedia({
      services,
      file: state.selectedFile,
      bucketName: usage.bucket,
      folder: usage.folder,
      altText: form.elements.alt_text.value.trim()
    });
    form.reset();
    form.elements.usage.dispatchEvent(new Event('change'));
    state.selectedFile = null;
    preview(null);
    showToast('Görsel medya kütüphanesine yüklendi.');
    await load();
  }

  async function remove(item) {
    if (!window.confirm('Bu görsel kalıcı olarak silinsin mi?')) return;
    await deleteManagedMedia(services, item);
    showToast('Görsel silindi.');
    await load();
  }

  async function replace(file) {
    if (!state.replacing) return;
    const replacement = await replaceManagedMedia(services, state.replacing, file);
    state.replacing = null;
    document.getElementById('mediaReplaceInput').value = '';
    showToast(replacement.cleanup_warning
      ? 'Görsel değiştirildi; eski dosya daha sonra temizlenebilir.'
      : 'Görsel güvenli şekilde değiştirildi.');
    await load();
  }

  function bind() {
    const form = document.getElementById('mediaUploadForm');
    const zone = document.getElementById('mediaLibraryDropZone');
    const input = form.elements.image;
    const usage = form.elements.usage;
    const syncUsage = () => {
      const selected = usageOptions[usage.value];
      zone.dataset.bucket = selected.bucket;
      input.accept = selected.bucket === 'ads'
        ? 'image/jpeg,image/png,image/webp,image/gif'
        : 'image/jpeg,image/png,image/webp';
    };
    usage.addEventListener('change', syncUsage);
    syncUsage();
    state.unbindDrop = bindMediaDropZone({
      zone,
      input,
      showToast,
      onFile: file => {
        state.selectedFile = file;
        preview(file);
      }
    });
    form.addEventListener('submit', event => {
      upload(event).catch(() => showToast('Görsel yüklenemedi.'));
    });
    document.getElementById('mediaLibraryGrid').addEventListener('click', event => {
      const action = event.target.closest('[data-media-action]');
      if (!action) return;
      const item = state.records.find(record => record.id === action.dataset.mediaId);
      if (action.dataset.mediaAction === 'delete') {
        remove(item).catch(error => showToast(error.message || 'Görsel silinemedi.'));
      }
      if (action.dataset.mediaAction === 'replace') {
        state.replacing = item;
        const replaceInput = document.getElementById('mediaReplaceInput');
        replaceInput.accept = item.bucket_name === 'ads'
          ? 'image/jpeg,image/png,image/webp,image/gif'
          : 'image/jpeg,image/png,image/webp';
        replaceInput.click();
      }
    });
    document.getElementById('mediaReplaceInput').addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (file) replace(file).catch(error => showToast(error.message || 'Görsel değiştirilemedi.'));
    });
  }

  return {
    async mount() {
      bind();
      await load();
      if (isConnected()) {
        state.channel = await services.realtime.subscribe({
          channel: 'turkua-admin-media-assets',
          table: config.resources.tables.mediaAssets
        }, () => load().catch(() => {}));
      }
    },
      async destroy() {
      state.unbindDrop?.();
      if (state.channel) await services.realtime.removeChannel(state.channel);
      state.channel = null;
    }
  };
}
