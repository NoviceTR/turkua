import { createMetric, escapeHtml, localDateTime } from './utils.js';
import {
  bindMediaDropZone,
  deleteManagedMedia,
  uploadManagedMedia
} from './media-tools.js';

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'sponsor';
}

function statusOf(item) {
  const now = Date.now();
  if (new Date(item.end_date).getTime() <= now) return 'expired';
  if (!item.is_active) return 'passive';
  if (new Date(item.start_date).getTime() > now) return 'scheduled';
  return 'active';
}

export function createSponsorsManager({ services, config, isConnected, showToast }) {
  const state = {
    languages: [],
    slots: [],
    records: [],
    selected: null,
    channel: null
  };

  function languageName(code) {
    return state.languages.find(language => language.code === code)?.native_name || code.toUpperCase();
  }

  function renderMetrics() {
    const target = document.getElementById('sponsorMetrics');
    const active = state.records.filter(item => statusOf(item) === 'active').length;
    const scheduled = state.records.filter(item => statusOf(item) === 'scheduled').length;
    const passive = state.records.filter(item => statusOf(item) === 'passive').length;
    target.replaceChildren(
      createMetric('Toplam sponsor', state.records.length, 'Tüm dil kayıtları'),
      createMetric('Aktif', active, 'Şu anda yayında'),
      createMetric('Planlanan', scheduled, 'Yayın sırası bekliyor'),
      createMetric('Pasif', passive, 'Elle durduruldu')
    );
  }

  function renderOptions() {
    document.getElementById('sponsorLocale').replaceChildren(...state.languages.map(language =>
      new Option(language.native_name, language.code)
    ));
    document.getElementById('sponsorSlot').replaceChildren(...state.slots.map(slot =>
      new Option(`${slot.name} · ${slot.code}`, slot.code)
    ));
  }

  function renderTable() {
    const body = document.getElementById('sponsorTableBody');
    if (!state.records.length) {
      body.innerHTML = '<tr><td colspan="6"><div class="view-loading">Henüz sponsor reklam bulunmuyor.</div></td></tr>';
      return;
    }
    body.replaceChildren(...state.records.map(item => {
      const status = statusOf(item);
      const statusText = { active: 'Aktif', passive: 'Pasif', scheduled: 'Planlandı', expired: 'Sona erdi' }[status];
      const badgeClass = status === 'active' ? 'published' : status === 'scheduled' ? 'review' : 'draft';
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.advertiser_name)}</small></td>
        <td>${escapeHtml(item.slot_code)}</td>
        <td>${escapeHtml(languageName(item.locale))}</td>
        <td>${new Date(item.start_date).toLocaleDateString('tr-TR')} - ${new Date(item.end_date).toLocaleDateString('tr-TR')}</td>
        <td><span class="status-badge ${badgeClass}">${statusText}</span></td>
        <td>
          <button class="row-action" type="button" data-sponsor-action="toggle" data-sponsor-id="${item.id}">${item.is_active ? 'Pasif Yap' : 'Aktif Yap'}</button>
          <button class="row-action" type="button" data-sponsor-action="edit" data-sponsor-id="${item.id}">Düzenle</button>
        </td>`;
      return row;
    }));
  }

  function render() {
    renderMetrics();
    renderOptions();
    renderTable();
  }

  async function load() {
    if (!isConnected()) {
      document.getElementById('sponsorTableBody').innerHTML =
        '<tr><td colspan="6"><div class="view-loading">Supabase bağlantısı yapılandırıldığında sponsorlar burada görünecek.</div></td></tr>';
      renderMetrics();
      return;
    }
    const [languagesTable, slotsTable, sponsorsTable] = await Promise.all([
      services.database.table('languages'),
      services.database.table('adSlots'),
      services.database.table('sponsoredAds')
    ]);
    const [languagesResult, slotsResult, sponsorsResult] = await Promise.all([
      languagesTable.select('*').eq('enabled', true).order('sort_order'),
      slotsTable.select('*').eq('enabled', true).order('sort_order'),
      sponsorsTable.select('*, media:media_assets(*)').order('sort_order').order('start_date', { ascending: false })
    ]);
    const error = languagesResult.error || slotsResult.error || sponsorsResult.error;
    if (error) throw error;
    state.languages = languagesResult.data || [];
    state.slots = slotsResult.data || [];
    state.records = sponsorsResult.data || [];
    render();
  }

  function preview(url) {
    const element = document.getElementById('sponsorImagePreview');
    element.classList.toggle('is-hidden', !url);
    element.style.backgroundImage = url ? `url("${url}")` : '';
  }

  function openEditor(item = null) {
    state.selected = item;
    const form = document.getElementById('sponsorForm');
    form.reset();
    form.elements.id.value = item?.id || '';
    form.elements.campaign_key.value = item?.campaign_key || '';
    form.elements.media_asset_id.value = item?.media_asset_id || '';
    form.elements.locale.value = item?.locale || state.languages[0]?.code || '';
    form.elements.slot_code.value = item?.slot_code || state.slots[0]?.code || '';
    form.elements.advertiser_name.value = item?.advertiser_name || '';
    form.elements.title.value = item?.title || '';
    form.elements.body.value = item?.body || '';
    form.elements.target_url.value = item?.target_url || '';
    form.elements.sort_order.value = item?.sort_order ?? 100;
    form.elements.start_date.value = localDateTime(item?.start_date || new Date());
    form.elements.end_date.value = localDateTime(item?.end_date || new Date(Date.now() + 30 * 86400000));
    form.elements.is_active.checked = Boolean(item?.is_active);
    document.getElementById('sponsorEditorTitle').textContent = item ? 'Sponsoru düzenle' : 'Yeni sponsor';
    document.getElementById('deleteSponsorButton').classList.toggle('is-hidden', !item);
    preview(item?.media?.public_url);
    document.getElementById('sponsorEditor').classList.remove('is-hidden');
    document.getElementById('sponsorEditor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeEditor() {
    state.selected = null;
    document.getElementById('sponsorEditor').classList.add('is-hidden');
  }

  async function uploadImage(file, sponsorId, altText) {
    if (!file?.size) return null;
    return uploadManagedMedia({
      services,
      file,
      bucketName: 'ads',
      folder: `sponsors/${sponsorId}`,
      altText
    });
  }

  async function save(event) {
    event.preventDefault();
    if (!isConnected()) return showToast('Supabase bağlantısı bekleniyor.');
    const form = event.currentTarget;
    const id = form.elements.id.value || crypto.randomUUID();
    const startDate = new Date(form.elements.start_date.value);
    const endDate = new Date(form.elements.end_date.value);
    if (endDate <= startDate) return showToast('Bitiş tarihi başlangıçtan sonra olmalıdır.');

    const title = form.elements.title.value.trim();
    const uploaded = await uploadImage(form.elements.image.files[0], id, title);
    const campaignKey = form.elements.campaign_key.value ||
      `${slugify(title || form.elements.advertiser_name.value)}-${id.slice(0, 8)}`;
    const table = await services.database.table('sponsoredAds');
    const { error } = await table.upsert({
      id,
      campaign_key: campaignKey,
      locale: form.elements.locale.value,
      slot_code: form.elements.slot_code.value,
      advertiser_name: form.elements.advertiser_name.value.trim(),
      title,
      body: form.elements.body.value.trim(),
      target_url: form.elements.target_url.value.trim() || null,
      media_asset_id: uploaded?.id || form.elements.media_asset_id.value || null,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      is_active: form.elements.is_active.checked,
      sort_order: Number(form.elements.sort_order.value || 100)
    }, { onConflict: 'id' });
    if (error) {
      if (uploaded) await deleteManagedMedia(services, uploaded, { checkReferences: false });
      throw error;
    }
    if (uploaded && state.selected?.media) {
      await deleteManagedMedia(services, state.selected.media, { checkReferences: false });
    }
    showToast('Sponsor reklam kaydedildi.');
    closeEditor();
    await load();
  }

  async function removeSelected() {
    if (!state.selected || !window.confirm('Bu sponsor reklam kalıcı olarak silinsin mi?')) return;
    const table = await services.database.table('sponsoredAds');
    const { error } = await table.delete().eq('id', state.selected.id);
    if (error) throw error;
    await deleteManagedMedia(services, state.selected.media, { checkReferences: false });
    showToast('Sponsor reklam silindi.');
    closeEditor();
    await load();
  }

  async function toggle(item) {
    const table = await services.database.table('sponsoredAds');
    const { error } = await table.update({ is_active: !item.is_active }).eq('id', item.id);
    if (error) throw error;
    showToast(item.is_active ? 'Sponsor pasif yapıldı.' : 'Sponsor aktif yapıldı.');
    await load();
  }

  function bind() {
    const root = document.querySelector('[data-view-root="sponsors"]');
    root.addEventListener('click', event => {
      const action = event.target.closest('[data-sponsor-action]');
      if (!action) return;
      const item = state.records.find(record => record.id === action.dataset.sponsorId);
      if (action.dataset.sponsorAction === 'new') openEditor();
      if (action.dataset.sponsorAction === 'close') closeEditor();
      if (action.dataset.sponsorAction === 'edit') openEditor(item);
      if (action.dataset.sponsorAction === 'toggle') {
        toggle(item).catch(() => showToast('Sponsor durumu değiştirilemedi.'));
      }
      if (action.dataset.sponsorAction === 'delete') {
        removeSelected().catch(() => showToast('Sponsor silinemedi.'));
      }
    });
    document.getElementById('sponsorForm').addEventListener('submit', event => {
      save(event).catch(() => showToast('Sponsor kaydedilemedi.'));
    });
    bindMediaDropZone({
      zone: document.getElementById('sponsorDropZone'),
      input: document.querySelector('#sponsorForm [name="image"]'),
      showToast,
      onFile: file => preview(URL.createObjectURL(file))
    });
  }

  return {
    async mount() {
      bind();
      await load();
      if (isConnected()) {
        state.channel = await services.realtime.subscribe({
          channel: 'turkua-admin-sponsored-ads',
          table: config.resources.tables.sponsoredAds
        }, () => load().catch(() => {}));
      }
    },
    async destroy() {
      if (state.channel) await services.realtime.removeChannel(state.channel);
      state.channel = null;
    }
  };
}
