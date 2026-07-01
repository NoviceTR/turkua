import { createMetric as metric, escapeHtml } from './utils.js';

const typeLabels = {
  contact: 'İletişim',
  advertising: 'Reklam',
  shop: 'Ürün talebi'
};

const statusLabels = {
  new: 'Yeni',
  read: 'Okundu',
  closed: 'Kapalı',
  spam: 'Spam'
};

export function createApplicationsManager({ services, config, isConnected, showToast }) {
  const state = {
    records: [],
    selected: null,
    statusFilter: 'all',
    typeFilter: 'all',
    channel: null
  };

  function renderMetrics() {
    const target = document.getElementById('applicationMetrics');
    if (!target) return;
    target.replaceChildren(
      metric('Yeni', state.records.filter(item => item.status === 'new').length, 'Yanıt bekliyor'),
      metric('Toplam', state.records.length, 'Son 500 kayıt'),
      metric('Reklam', state.records.filter(item => item.form_type === 'advertising').length, 'Başvurular'),
      metric('Telegram', state.records.filter(item => item.telegram_notified).length, 'Bildirim gönderildi')
    );
  }

  function filteredRecords() {
    return state.records.filter(item =>
      (state.statusFilter === 'all' || item.status === state.statusFilter) &&
      (state.typeFilter === 'all' || item.form_type === state.typeFilter)
    );
  }

  function renderTable() {
    const body = document.getElementById('applicationTableBody');
    if (!body) return;
    const records = filteredRecords();
    if (!records.length) {
      body.innerHTML = '<tr><td colspan="7"><div class="view-loading">Bu filtrede başvuru bulunmuyor.</div></td></tr>';
      return;
    }
    body.replaceChildren(...records.map(item => {
      const row = document.createElement('tr');
      const badgeClass = item.status === 'new' ? 'review' : item.status === 'spam' ? 'draft' : 'published';
      row.innerHTML = `
        <td><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.subject || item.id)}</small></td>
        <td>${escapeHtml(typeLabels[item.form_type] || item.form_type)}</td>
        <td>${escapeHtml(item.email || item.phone || '-')}</td>
        <td><span class="status-badge ${item.telegram_notified ? 'published' : 'draft'}">${item.telegram_notified ? 'Gönderildi' : 'Bekliyor'}</span></td>
        <td><span class="status-badge ${badgeClass}">${escapeHtml(statusLabels[item.status])}</span></td>
        <td>${new Date(item.created_at).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}</td>
        <td><button class="row-action" type="button" data-application-action="open" data-application-id="${item.id}">İncele</button></td>`;
      return row;
    }));
  }

  function render() {
    renderMetrics();
    renderTable();
  }

  async function load() {
    if (!isConnected()) {
      document.getElementById('applicationTableBody').innerHTML =
        '<tr><td colspan="7"><div class="view-loading">Supabase bağlantısı yapılandırıldığında başvurular burada görünecek.</div></td></tr>';
      renderMetrics();
      return;
    }
    const table = await services.database.table('submissions');
    const { data, error } = await table.select('*').order('created_at', { ascending: false }).limit(500);
    if (error) throw error;
    state.records = data || [];
    render();
  }

  function detailEntry(label, value) {
    const wrapper = document.createElement('div');
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label;
    detail.textContent = value || '-';
    wrapper.append(term, detail);
    return wrapper;
  }

  async function open(item) {
    state.selected = item;
    document.getElementById('applicationEditorTitle').textContent = item.subject || item.name;
    const details = document.getElementById('applicationDetails');
    details.replaceChildren(
      detailEntry('Ad', item.name),
      detailEntry('Tür', typeLabels[item.form_type] || item.form_type),
      detailEntry('E-posta', item.email),
      detailEntry('Telefon', item.phone),
      detailEntry('Dil', item.locale),
      detailEntry('Tarih', new Date(item.created_at).toLocaleString('tr-TR')),
      detailEntry('Telegram', item.telegram_notified ? 'Gönderildi' : item.telegram_error || 'Gönderilmedi')
    );
    document.getElementById('applicationMessage').textContent = item.message || '-';
    document.getElementById('applicationMetadata').textContent = JSON.stringify(item.details || {}, null, 2);
    document.getElementById('applicationStatus').value = item.status;
    document.getElementById('applicationNotes').value = item.internal_notes || '';
    document.getElementById('applicationAttachment').classList.toggle('is-hidden', !item.attachment_path);
    document.getElementById('applicationEditor').classList.remove('is-hidden');
    document.getElementById('applicationEditor').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (item.status === 'new') {
      const table = await services.database.table('submissions');
      await table.update({ status: 'read' }).eq('id', item.id);
      item.status = 'read';
      document.getElementById('applicationStatus').value = 'read';
      render();
    }
  }

  function close() {
    state.selected = null;
    document.getElementById('applicationEditor')?.classList.add('is-hidden');
  }

  async function save() {
    if (!state.selected) return;
    const table = await services.database.table('submissions');
    const values = {
      status: document.getElementById('applicationStatus').value,
      internal_notes: document.getElementById('applicationNotes').value.trim()
    };
    const { error } = await table.update(values).eq('id', state.selected.id);
    if (error) throw error;
    Object.assign(state.selected, values);
    showToast('Başvuru güncellendi.');
    render();
  }

  async function remove() {
    if (!state.selected || !window.confirm('Bu başvuru kalıcı olarak silinsin mi?')) return;
    const table = await services.database.table('submissions');
    const { error } = await table.delete().eq('id', state.selected.id);
    if (error) throw error;
    if (state.selected.attachment_path) {
      await services.storage.remove('submissions', [state.selected.attachment_path]);
    }
    showToast('Başvuru silindi.');
    close();
    await load();
  }

  async function openAttachment() {
    if (!state.selected?.attachment_path) return;
    const { data, error } = await services.storage.createSignedUrl(
      'submissions',
      state.selected.attachment_path,
      60
    );
    if (error) throw error;
    window.open(data.signedUrl, '_blank', 'noopener');
  }

  function bind() {
    const root = document.querySelector('[data-view-root="applications"]');
    root.addEventListener('click', event => {
      const action = event.target.closest('[data-application-action]');
      if (!action) return;
      const name = action.dataset.applicationAction;
      if (name === 'open') open(state.records.find(item => item.id === action.dataset.applicationId))
        .catch(() => showToast('Başvuru açılamadı.'));
      if (name === 'close') close();
      if (name === 'refresh') load().catch(() => showToast('Başvurular yenilenemedi.'));
      if (name === 'save') save().catch(() => showToast('Başvuru kaydedilemedi.'));
      if (name === 'delete') remove().catch(() => showToast('Başvuru silinemedi.'));
      if (name === 'attachment') openAttachment().catch(() => showToast('Dosya açılamadı.'));
    });
    root.addEventListener('click', event => {
      const filter = event.target.closest('[data-application-status]');
      if (!filter) return;
      state.statusFilter = filter.dataset.applicationStatus;
      root.querySelectorAll('[data-application-status]').forEach(button =>
        button.classList.toggle('active', button === filter)
      );
      renderTable();
    });
    document.getElementById('applicationTypeFilter').addEventListener('change', event => {
      state.typeFilter = event.target.value;
      renderTable();
    });
  }

  return {
    async mount() {
      bind();
      await load();
      if (isConnected()) {
        state.channel = await services.realtime.subscribe({
          channel: 'turkua-admin-submissions',
          table: config.resources.tables.submissions
        }, () => load().catch(() => {}));
      }
    },
    async destroy() {
      if (state.channel) await services.realtime.removeChannel(state.channel);
      state.channel = null;
    }
  };
}
