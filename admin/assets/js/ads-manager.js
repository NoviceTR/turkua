import {
  createMetric as metric,
  escapeHtml,
  formatNumber,
  localDateTime
} from './utils.js';
import {
  bindMediaDropZone,
  deleteManagedMediaByPath,
  uploadManagedMedia
} from './media-tools.js';

function campaignStatus(item) {
  const now = Date.now();
  if (new Date(item.ends_at).getTime() <= now) return 'expired';
  if (!item.is_active) return 'passive';
  if (new Date(item.starts_at).getTime() > now) return 'scheduled';
  return 'active';
}

export function createAdsManager({ services, config, isConnected, showToast }) {
  const state = {
    slots: [],
    records: [],
    selected: null,
    statusFilter: 'all',
    typeFilter: 'all',
    channel: null
  };

  function renderMetrics() {
    const target = document.getElementById('adMetrics');
    if (!target) return;
    const active = state.records.filter(item => campaignStatus(item) === 'active').length;
    const impressions = state.records.reduce((total, item) => total + Number(item.impressions || 0), 0);
    const clicks = state.records.reduce((total, item) => total + Number(item.clicks || 0), 0);
    const ctr = impressions ? `${((clicks / impressions) * 100).toFixed(2)}%` : '0%';
    target.replaceChildren(
      metric('Aktif kampanya', active, `${state.records.length} toplam`),
      metric('Gösterim', formatNumber(impressions), 'Toplam'),
      metric('Tıklama', formatNumber(clicks), 'Toplam'),
      metric('Tıklama oranı', ctr, 'CTR')
    );
  }

  function renderSlotOptions() {
    const select = document.getElementById('adSlot');
    if (select) {
      select.replaceChildren(...state.slots.map(slot =>
        new Option(`${slot.name} · ${slot.slot_type}`, slot.id)
      ));
    }
    const filter = document.getElementById('adTypeFilter');
    if (filter) {
      const types = [...new Set(state.slots.map(slot => slot.slot_type))];
      filter.replaceChildren(new Option('Tüm reklam türleri', 'all'), ...types.map(type =>
        new Option(type[0].toUpperCase() + type.slice(1), type)
      ));
      filter.value = state.typeFilter;
    }
  }

  function renderGrid() {
    const grid = document.getElementById('adCampaignGrid');
    if (!grid) return;
    const filtered = state.records.filter(item => {
      const statusMatches = state.statusFilter === 'all' || campaignStatus(item) === state.statusFilter;
      const typeMatches = state.typeFilter === 'all' || item.slot?.slot_type === state.typeFilter;
      return statusMatches && typeMatches;
    });
    const occupiedSlots = new Set(state.records.map(item => item.slot_id));
    const emptySlots = state.slots.filter(slot =>
      !occupiedSlots.has(slot.id) &&
      (state.typeFilter === 'all' || slot.slot_type === state.typeFilter) &&
      ['all', 'passive'].includes(state.statusFilter)
    );
    if (!filtered.length && !emptySlots.length) {
      grid.innerHTML = '<div class="view-loading">Bu filtrede reklam bulunmuyor.</div>';
      return;
    }
    const campaignCards = filtered.map(item => {
      const status = campaignStatus(item);
      const statusText = { active: 'Aktif', passive: 'Pasif', scheduled: 'Planlandı', expired: 'Sona erdi' }[status];
      const badgeClass = status === 'active' ? 'published' : status === 'scheduled' ? 'review' : 'draft';
      const ctr = item.impressions ? `${((Number(item.clicks) / Number(item.impressions)) * 100).toFixed(2)}%` : '0%';
      const card = document.createElement('article');
      card.className = 'ad-slot-card';
      card.innerHTML = `
        <div class="slot-preview ${escapeHtml(item.slot?.slot_type || '')}${item.image_url ? ' has-image' : ' empty'}" ${item.image_url ? `style="background-image:url('${escapeHtml(item.image_url)}')"` : ''}>
          <span>${escapeHtml(item.slot?.name || '')}</span>
        </div>
        <div class="slot-card-body">
          <div><span class="status-badge ${badgeClass}">${statusText}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.headline || item.slot?.slot_type)}</p></div>
          <button class="secondary-button" type="button" data-ad-action="edit" data-ad-id="${item.id}">Düzenle</button>
        </div>
        <dl>
          <div><dt>Yayın</dt><dd>${new Date(item.starts_at).toLocaleDateString('tr-TR')} - ${new Date(item.ends_at).toLocaleDateString('tr-TR')}</dd></div>
          <div><dt>Gösterim</dt><dd>${formatNumber(item.impressions)}</dd></div>
          <div><dt>Tıklama</dt><dd>${formatNumber(item.clicks)}</dd></div>
          <div><dt>CTR</dt><dd>${ctr}</dd></div>
        </dl>`;
      return card;
    });
    const emptyCards = emptySlots.map(slot => {
      const card = document.createElement('article');
      card.className = 'ad-slot-card';
      card.innerHTML = `
        <div class="slot-preview ${escapeHtml(slot.slot_type)} empty"><span>${escapeHtml(slot.width || '')}${slot.width && slot.height ? ' × ' : ''}${escapeHtml(slot.height || '')}</span></div>
        <div class="slot-card-body">
          <div><span class="status-badge draft">Boş</span><h3>${escapeHtml(slot.name)}</h3><p>${escapeHtml(slot.slot_type)}</p></div>
          <button class="secondary-button" type="button" data-ad-action="new" data-slot-id="${slot.id}">Reklam Ekle</button>
        </div>
        <dl><div><dt>Yayın</dt><dd>-</dd></div><div><dt>Gösterim</dt><dd>0</dd></div><div><dt>Tıklama</dt><dd>0</dd></div><div><dt>CTR</dt><dd>0%</dd></div></dl>`;
      return card;
    });
    grid.replaceChildren(...campaignCards, ...emptyCards);
  }

  function render() {
    renderMetrics();
    renderSlotOptions();
    renderGrid();
  }

  async function load() {
    if (!isConnected()) {
      document.getElementById('adCampaignGrid').innerHTML =
        '<div class="view-loading">Supabase bağlantısı yapılandırıldığında reklamlar burada görünecek.</div>';
      renderMetrics();
      return;
    }
    const [slotTable, adTable] = await Promise.all([
      services.database.table('adSlots'),
      services.database.table('ads')
    ]);
    const [slotResult, adResult] = await Promise.all([
      slotTable.select('*').eq('enabled', true).order('sort_order'),
      adTable.select('*, slot:ad_slots(*)').order('created_at', { ascending: false })
    ]);
    const error = slotResult.error || adResult.error;
    if (error) throw error;
    state.slots = slotResult.data || [];
    state.records = adResult.data || [];
    render();
  }

  function preview(url) {
    const element = document.getElementById('adImagePreview');
    element.classList.toggle('is-hidden', !url);
    element.style.backgroundImage = url ? `url("${url}")` : '';
  }

  function openEditor(item = null, slotId = '') {
    state.selected = item;
    const form = document.getElementById('adForm');
    form.reset();
    form.elements.id.value = item?.id || '';
    form.elements.image_path.value = item?.image_path || '';
    form.elements.image_url.value = item?.image_url || '';
    form.elements.slot_id.value = item?.slot_id || slotId || state.slots[0]?.id || '';
    form.elements.name.value = item?.name || '';
    form.elements.headline.value = item?.headline || '';
    form.elements.target_url.value = item?.target_url || '';
    form.elements.alt_text.value = item?.alt_text || '';
    form.elements.starts_at.value = localDateTime(item?.starts_at || new Date());
    form.elements.ends_at.value = localDateTime(item?.ends_at || new Date(Date.now() + 30 * 86400000));
    form.elements.is_active.checked = Boolean(item?.is_active);
    document.getElementById('adEditorTitle').textContent = item ? 'Reklamı düzenle' : 'Yeni reklam';
    document.getElementById('deleteAdButton').classList.toggle('is-hidden', !item);
    preview(item?.image_url);
    document.getElementById('adEditor').classList.remove('is-hidden');
    document.getElementById('adEditor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeEditor() {
    state.selected = null;
    document.getElementById('adEditor')?.classList.add('is-hidden');
  }

  async function uploadImage(file, id, altText) {
    if (!file?.size) return null;
    return uploadManagedMedia({
      services,
      file,
      bucketName: 'ads',
      folder: `campaigns/${id}`,
      altText
    });
  }

  async function save(event) {
    event.preventDefault();
    if (!isConnected()) return showToast('Supabase bağlantısı bekleniyor.');
    const form = event.currentTarget;
    const id = form.elements.id.value || crypto.randomUUID();
    const oldImagePath = form.elements.image_path.value;
    let imagePath = oldImagePath || null;
    let imageUrl = form.elements.image_url.value || null;
    const uploaded = await uploadImage(
      form.elements.image.files[0],
      id,
      form.elements.alt_text.value.trim()
    );
    if (uploaded) {
      imagePath = uploaded.object_path;
      imageUrl = uploaded.public_url;
    }
    const startsAt = new Date(form.elements.starts_at.value);
    const endsAt = new Date(form.elements.ends_at.value);
    if (endsAt <= startsAt) return showToast('Bitiş tarihi başlangıçtan sonra olmalıdır.');

    const table = await services.database.table('ads');
    const { error } = await table.upsert({
      id,
      slot_id: form.elements.slot_id.value,
      name: form.elements.name.value.trim(),
      headline: form.elements.headline.value.trim(),
      target_url: form.elements.target_url.value.trim() || null,
      alt_text: form.elements.alt_text.value.trim(),
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      image_path: imagePath,
      image_url: imageUrl,
      is_active: form.elements.is_active.checked
    }, { onConflict: 'id' });
    if (error) throw error;
    if (uploaded && oldImagePath) {
      await deleteManagedMediaByPath(services, 'ads', oldImagePath);
    }
    showToast('Reklam kaydedildi ve alanlar güncellendi.');
    closeEditor();
    await load();
  }

  async function removeSelected() {
    if (!state.selected || !window.confirm('Bu reklam kalıcı olarak silinsin mi?')) return;
    const table = await services.database.table('ads');
    const { error } = await table.delete().eq('id', state.selected.id);
    if (error) throw error;
    if (state.selected.image_path) {
      await deleteManagedMediaByPath(services, 'ads', state.selected.image_path);
    }
    showToast('Reklam silindi.');
    closeEditor();
    await load();
  }

  function bind() {
    const root = document.querySelector('[data-view-root="ads"]');
    root.addEventListener('click', event => {
      const action = event.target.closest('[data-ad-action]');
      if (!action) return;
      if (action.dataset.adAction === 'new') openEditor(null, action.dataset.slotId);
      if (action.dataset.adAction === 'close') closeEditor();
      if (action.dataset.adAction === 'edit') openEditor(state.records.find(item => item.id === action.dataset.adId));
      if (action.dataset.adAction === 'delete') {
        removeSelected().catch(() => showToast('Reklam silinemedi.'));
      }
    });
    root.addEventListener('click', event => {
      const filter = event.target.closest('[data-ad-filter]');
      if (!filter) return;
      state.statusFilter = filter.dataset.adFilter;
      root.querySelectorAll('[data-ad-filter]').forEach(button =>
        button.classList.toggle('active', button === filter)
      );
      renderGrid();
    });
    document.getElementById('adTypeFilter').addEventListener('change', event => {
      state.typeFilter = event.target.value;
      renderGrid();
    });
    document.getElementById('adForm').addEventListener('submit', event => {
      save(event).catch(() => showToast('Reklam kaydedilemedi.'));
    });
    bindMediaDropZone({
      zone: document.getElementById('adDropZone'),
      input: document.querySelector('#adForm [name="image"]'),
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
          channel: 'turkua-admin-ads',
          table: config.resources.tables.ads
        }, () => load().catch(() => {}));
      }
    },
    async destroy() {
      if (state.channel) await services.realtime.removeChannel(state.channel);
      state.channel = null;
    }
  };
}
