import { escapeHtml, localDateTime } from './utils.js';
import {
  bindMediaDropZone,
  deleteManagedMedia,
  uploadManagedMedia
} from './media-tools.js';

function languageSections(languages, records, fields) {
  return languages.map(language => {
    const record = records.find(item => item.locale === language.code);
    const section = document.createElement('section');
    section.className = 'locale-section';
    section.innerHTML = `
      <div class="locale-heading">
        <strong>${escapeHtml(language.native_name)}</strong>
        <span>${escapeHtml(language.code.toUpperCase())}</span>
      </div>
      <input type="hidden" name="id__${escapeHtml(language.code)}" value="${escapeHtml(record?.id)}">
      ${fields(language, record)}`;
    return section;
  });
}

async function loadLanguages(services) {
  const table = await services.database.table('languages');
  const { data, error } = await table.select('*').eq('enabled', true).order('sort_order');
  if (error) throw error;
  return data || [];
}

function createLocalizedManager({
  resource,
  rootSelector,
  formId,
  fieldsTargetId,
  channelName,
  conflictTarget,
  recordKey,
  selectColumns = '*',
  renderFields,
  toRecord,
  afterRender,
  bindExtras,
  prepareSave,
  afterSave,
  successMessage
}) {
  return function createManager({ services, config, isConnected, showToast }) {
    const state = { languages: [], records: [], channel: null, unbindExtras: null };

    function render() {
      const target = document.getElementById(fieldsTargetId);
      target.replaceChildren(...languageSections(state.languages, state.records, renderFields));
      afterRender?.({ state });
    }

    async function load() {
      if (!isConnected()) {
        document.getElementById(fieldsTargetId).innerHTML =
          '<div class="view-loading">Supabase bağlantısı yapılandırıldığında içerikler burada görünecek.</div>';
        return;
      }
      const [languages, table] = await Promise.all([
        loadLanguages(services),
        services.database.table(resource)
      ]);
      const { data, error } = await table
        .select(selectColumns)
        .eq(recordKey, 'main')
        .order('sort_order');
      if (error) throw error;
      state.languages = languages;
      state.records = data || [];
      render();
    }

    async function save(event) {
      event.preventDefault();
      if (!isConnected()) return showToast('Supabase bağlantısı bekleniyor.');
      const form = event.currentTarget;
      const saveContext = await prepareSave?.({ form, state, services, showToast }) || {};
      const records = state.languages.map(language => {
        const existing = state.records.find(item => item.locale === language.code);
        return toRecord(form, language, existing, saveContext);
      });
      const table = await services.database.table(resource);
      const { error } = await table.upsert(records, { onConflict: conflictTarget });
      if (error) {
        await saveContext.rollback?.();
        throw error;
      }
      const resultMessage = await afterSave?.({ form, state, saveContext, services, showToast });
      showToast(resultMessage || successMessage);
      await load();
    }

    return {
      async mount() {
        if (!document.querySelector(rootSelector)) return;
        state.unbindExtras = bindExtras?.({ state, showToast }) || null;
        document.getElementById(formId).addEventListener('submit', event => {
          save(event).catch(() => showToast('İçerik kaydedilemedi.'));
        });
        await load();
        if (isConnected()) {
          state.channel = await services.realtime.subscribe({
            channel: channelName,
            table: config.resources.tables[resource]
          }, () => load().catch(() => {}));
        }
      },
      async destroy() {
        state.unbindExtras?.();
        if (state.channel) await services.realtime.removeChannel(state.channel);
        state.channel = null;
      }
    };
  };
}

export const createHeroManager = createLocalizedManager({
  resource: 'heroContent',
  rootSelector: '[data-view-root="hero"]',
  formId: 'heroForm',
  fieldsTargetId: 'heroLocaleFields',
  channelName: 'turkua-admin-hero-content',
  conflictTarget: 'content_key,locale',
  recordKey: 'content_key',
  selectColumns: '*, background:media_assets(*)',
  successMessage: 'Hero içeriği kaydedildi.',
  bindExtras: ({ showToast }) => bindMediaDropZone({
    zone: document.getElementById('heroDropZone'),
    input: document.querySelector('#heroForm [name="background_image"]'),
    showToast,
    onFile: file => {
      const preview = document.getElementById('heroImagePreview');
      preview.classList.remove('is-hidden');
      preview.style.backgroundImage = `url("${URL.createObjectURL(file)}")`;
    }
  }),
  afterRender: ({ state }) => {
    const media = state.records.find(record => record.background)?.background;
    const form = document.getElementById('heroForm');
    form.elements.background_media_id.value = media?.id || '';
    const preview = document.getElementById('heroImagePreview');
    preview.classList.toggle('is-hidden', !media?.public_url);
    preview.style.backgroundImage = media?.public_url ? `url("${media.public_url}")` : '';
  },
  prepareSave: async ({ form, state, services }) => {
    const oldMedia = state.records.find(record => record.background)?.background || null;
    const file = form.elements.background_image.files?.[0];
    if (!file) return { backgroundId: form.elements.background_media_id.value || null };
    const title = form.elements.title__tr?.value.trim() || 'TürkUA Hero';
    const uploaded = await uploadManagedMedia({
      services,
      file,
      bucketName: 'media',
      folder: 'hero',
      altText: title
    });
    return {
      backgroundId: uploaded.id,
      oldMedia,
      uploaded,
      rollback: () => deleteManagedMedia(services, uploaded, { checkReferences: false })
    };
  },
  afterSave: async ({ form, saveContext, services }) => {
    form.elements.background_image.value = '';
    if (!saveContext.uploaded || !saveContext.oldMedia) return;
    try {
      await deleteManagedMedia(services, saveContext.oldMedia);
    } catch (error) {
      return 'Yeni Hero görseli kaydedildi; kullanımda olan eski görsel korundu.';
    }
    return '';
  },
  renderFields: (language, record) => `
    <div class="form-grid">
      <label class="field"><span>Üst etiket</span><input name="eyebrow__${escapeHtml(language.code)}" value="${escapeHtml(record?.eyebrow)}"></label>
      <label class="field"><span>Sıra</span><input name="sort_order__${escapeHtml(language.code)}" type="number" min="0" step="1" value="${escapeHtml(record?.sort_order ?? 100)}"></label>
      <label class="field full"><span>Ana başlık</span><input name="title__${escapeHtml(language.code)}" value="${escapeHtml(record?.title)}" required></label>
      <label class="field full"><span>Alt başlık</span><input name="subtitle__${escapeHtml(language.code)}" value="${escapeHtml(record?.subtitle)}"></label>
      <label class="field full"><span>Açıklama</span><textarea name="body__${escapeHtml(language.code)}">${escapeHtml(record?.body)}</textarea></label>
      <label class="field"><span>Birinci düğme metni</span><input name="primary_action_label__${escapeHtml(language.code)}" value="${escapeHtml(record?.primary_action_label)}"></label>
      <label class="field"><span>Birinci düğme bağlantısı</span><input name="primary_action_url__${escapeHtml(language.code)}" value="${escapeHtml(record?.primary_action_url)}"></label>
      <label class="field"><span>İkinci düğme metni</span><input name="secondary_action_label__${escapeHtml(language.code)}" value="${escapeHtml(record?.secondary_action_label)}"></label>
      <label class="field"><span>İkinci düğme bağlantısı</span><input name="secondary_action_url__${escapeHtml(language.code)}" value="${escapeHtml(record?.secondary_action_url)}"></label>
      <label class="field switch-field"><span>Bu dilde aktif</span><span class="switch"><input name="is_active__${escapeHtml(language.code)}" type="checkbox" ${record?.is_active !== false ? 'checked' : ''}><i></i></span></label>
    </div>`,
  toRecord: (form, language, existing, saveContext) => ({
    id: existing?.id || crypto.randomUUID(),
    content_key: 'main',
    locale: language.code,
    eyebrow: form.elements[`eyebrow__${language.code}`].value.trim(),
    title: form.elements[`title__${language.code}`].value.trim(),
    subtitle: form.elements[`subtitle__${language.code}`].value.trim(),
    body: form.elements[`body__${language.code}`].value.trim(),
    primary_action_label: form.elements[`primary_action_label__${language.code}`].value.trim(),
    primary_action_url: form.elements[`primary_action_url__${language.code}`].value.trim() || null,
    secondary_action_label: form.elements[`secondary_action_label__${language.code}`].value.trim(),
    secondary_action_url: form.elements[`secondary_action_url__${language.code}`].value.trim() || null,
    background_media_id: saveContext.backgroundId,
    is_active: form.elements[`is_active__${language.code}`].checked,
    sort_order: Number(form.elements[`sort_order__${language.code}`].value || 100)
  })
});

export const createContactManager = createLocalizedManager({
  resource: 'contactSettings',
  rootSelector: '[data-view-root="contact"]',
  formId: 'contactForm',
  fieldsTargetId: 'contactLocaleFields',
  channelName: 'turkua-admin-contact-settings',
  conflictTarget: 'setting_key,locale',
  recordKey: 'setting_key',
  successMessage: 'İletişim bilgileri kaydedildi.',
  renderFields: (language, record) => `
    <div class="form-grid">
      <label class="field"><span>E-posta</span><input name="email__${escapeHtml(language.code)}" type="email" value="${escapeHtml(record?.email)}"></label>
      <label class="field"><span>Telefon</span><input name="phone__${escapeHtml(language.code)}" value="${escapeHtml(record?.phone)}"></label>
      <label class="field"><span>WhatsApp</span><input name="whatsapp__${escapeHtml(language.code)}" value="${escapeHtml(record?.whatsapp)}"></label>
      <label class="field"><span>Telegram</span><input name="telegram__${escapeHtml(language.code)}" value="${escapeHtml(record?.telegram)}"></label>
      <label class="field full"><span>Adres</span><textarea name="address__${escapeHtml(language.code)}">${escapeHtml(record?.address)}</textarea></label>
      <label class="field"><span>Çalışma saatleri</span><input name="working_hours__${escapeHtml(language.code)}" value="${escapeHtml(record?.working_hours)}"></label>
      <label class="field"><span>Yanıt süresi metni</span><input name="response_time_text__${escapeHtml(language.code)}" value="${escapeHtml(record?.response_time_text)}"></label>
      <label class="field"><span>Sıra</span><input name="sort_order__${escapeHtml(language.code)}" type="number" min="0" step="1" value="${escapeHtml(record?.sort_order ?? 100)}"></label>
      <label class="field switch-field"><span>İletişim bilgileri aktif</span><span class="switch"><input name="is_active__${escapeHtml(language.code)}" type="checkbox" ${record?.is_active !== false ? 'checked' : ''}><i></i></span></label>
      <label class="field switch-field"><span>Başvuru formu açık</span><span class="switch"><input name="form_enabled__${escapeHtml(language.code)}" type="checkbox" ${record?.form_enabled !== false ? 'checked' : ''}><i></i></span></label>
    </div>`,
  toRecord: (form, language, existing) => ({
    id: existing?.id || crypto.randomUUID(),
    setting_key: 'main',
    locale: language.code,
    email: form.elements[`email__${language.code}`].value.trim() || null,
    phone: form.elements[`phone__${language.code}`].value.trim() || null,
    whatsapp: form.elements[`whatsapp__${language.code}`].value.trim() || null,
    telegram: form.elements[`telegram__${language.code}`].value.trim() || null,
    address: form.elements[`address__${language.code}`].value.trim(),
    working_hours: form.elements[`working_hours__${language.code}`].value.trim(),
    response_time_text: form.elements[`response_time_text__${language.code}`].value.trim(),
    form_enabled: form.elements[`form_enabled__${language.code}`].checked,
    is_active: form.elements[`is_active__${language.code}`].checked,
    sort_order: Number(form.elements[`sort_order__${language.code}`].value || 100)
  })
});

export function createTrackerManager({ services, config, isConnected, showToast }) {
  const state = { record: null, channel: null };

  function fillForm() {
    const form = document.getElementById('trackerForm');
    const record = state.record;
    form.elements.id.value = record?.id || '';
    form.elements.probability_1d.value = record?.probability_1d ?? 0;
    form.elements.probability_1m.value = record?.probability_1m ?? 0;
    form.elements.probability_1y.value = record?.probability_1y ?? 0;
    form.elements.confidence.value = record?.confidence ?? 0;
    form.elements.trend_percent.value = record?.trend_percent ?? 0;
    form.elements.observed_at.value = localDateTime(record?.observed_at || new Date());
    form.elements.war_status_key.value = record?.war_status_key || 'tracker.status.war';
    form.elements.negotiation_status_key.value = record?.negotiation_status_key || 'tracker.status.negotiation';
    form.elements.trend_key.value = record?.trend_key || 'tracker.trend';
    form.elements.reasoning_key.value = record?.reasoning_key || 'tracker.reasoning';
    form.elements.developments.value = JSON.stringify(record?.developments || [], null, 2);
    form.elements.news_items.value = JSON.stringify(record?.news_items || [], null, 2);
    form.elements.is_active.checked = record?.is_active !== false;
  }

  async function load() {
    if (!isConnected()) return;
    const table = await services.database.table('trackerData');
    const { data, error } = await table
      .select('*')
      .eq('dataset_key', 'current')
      .order('observed_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    state.record = data?.[0] || null;
    fillForm();
  }

  function parseList(value, label) {
    const parsed = JSON.parse(value || '[]');
    if (!Array.isArray(parsed)) throw new Error(`${label} bir JSON listesi olmalıdır.`);
    return parsed;
  }

  async function save(event) {
    event.preventDefault();
    if (!isConnected()) return showToast('Supabase bağlantısı bekleniyor.');
    const form = event.currentTarget;
    let developments;
    let newsItems;
    try {
      developments = parseList(form.elements.developments.value, 'Gelişmeler');
      newsItems = parseList(form.elements.news_items.value, 'Takip haberleri');
    } catch (error) {
      return showToast(error.message);
    }
    const table = await services.database.table('trackerData');
    const { error } = await table.upsert({
      id: form.elements.id.value || crypto.randomUUID(),
      dataset_key: 'current',
      probability_1d: Number(form.elements.probability_1d.value),
      probability_1m: Number(form.elements.probability_1m.value),
      probability_1y: Number(form.elements.probability_1y.value),
      confidence: Number(form.elements.confidence.value),
      trend_percent: Number(form.elements.trend_percent.value),
      observed_at: new Date(form.elements.observed_at.value).toISOString(),
      war_status_key: form.elements.war_status_key.value.trim(),
      negotiation_status_key: form.elements.negotiation_status_key.value.trim(),
      trend_key: form.elements.trend_key.value.trim(),
      reasoning_key: form.elements.reasoning_key.value.trim(),
      developments,
      news_items: newsItems,
      is_active: form.elements.is_active.checked,
      sort_order: 100
    }, { onConflict: 'id' });
    if (error) throw error;
    showToast('Takip verileri kaydedildi.');
    await load();
  }

  return {
    async mount() {
      fillForm();
      document.getElementById('trackerForm').addEventListener('submit', event => {
        save(event).catch(() => showToast('Takip verileri kaydedilemedi.'));
      });
      await load();
      if (isConnected()) {
        state.channel = await services.realtime.subscribe({
          channel: 'turkua-admin-tracker-data',
          table: config.resources.tables.trackerData
        }, () => load().catch(() => {}));
      }
    },
    async destroy() {
      if (state.channel) await services.realtime.removeChannel(state.channel);
      state.channel = null;
    }
  };
}
