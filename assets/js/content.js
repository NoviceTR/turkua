// Database-backed content renderer with free-tier friendly Realtime updates.
(function() {
  const state = {
    languages: [],
    records: new Map(),
    channels: [],
    locale: localStorage.getItem('turkua-lang') || 'tr',
    hasAppliedLocale: false,
    contentElements: [...document.querySelectorAll('[data-content-key]')],
    localeElements: [...document.querySelectorAll('[data-locale]')],
    elementsByRecord: new Map()
  };

  let services;
  let config;

  function recordId(contentKey, locale) {
    return `${contentKey}:${locale}`;
  }

  state.contentElements.forEach(element => {
    const locale = element.dataset.locale ||
      (element.hasAttribute('data-ua') ? 'ua' : element.hasAttribute('data-tr') ? 'tr' : state.locale);
    const id = recordId(element.dataset.contentKey, locale);
    const elements = state.elementsByRecord.get(id) || [];
    elements.push(element);
    state.elementsByRecord.set(id, elements);
  });

  function setElementValue(element, record) {
    if (!record) return;

    const attribute = element.dataset.contentAttr;
    if (attribute) {
      element.setAttribute(attribute, record.value);
      return;
    }

    if (record.content_type === 'html') element.innerHTML = record.value;
    else element.textContent = record.value;
  }

  function updateLocaleVisibility(root = document) {
    const elements = root === document ? state.localeElements : root.querySelectorAll('[data-locale]');
    elements.forEach(element => {
      element.hidden = element.dataset.locale !== state.locale;
    });
  }

  function apply(root = document) {
    const elements = root === document ? state.contentElements : root.querySelectorAll('[data-content-key]');
    elements.forEach(element => {
      const locale = element.dataset.locale ||
        (element.hasAttribute('data-ua') ? 'ua' : element.hasAttribute('data-tr') ? 'tr' : state.locale);
      setElementValue(element, state.records.get(recordId(element.dataset.contentKey, locale)));
    });
    updateLocaleVisibility(root);
  }

  function applyRecord(contentKey, locale) {
    const id = recordId(contentKey, locale);
    const record = state.records.get(id);
    (state.elementsByRecord.get(id) || []).forEach(element => setElementValue(element, record));
  }

  function t(contentKey, locale = state.locale, fallback = '') {
    return state.records.get(recordId(contentKey, locale))?.value || fallback;
  }

  function languageHtmlCode(locale) {
    return state.languages.find(language => language.code === locale)?.html_code ||
      (locale === 'ua' ? 'uk' : locale);
  }

  function setLocale(locale) {
    if (!locale) return;
    const changed = state.locale !== locale;
    if (!changed && state.hasAppliedLocale) return;
    state.locale = locale;
    localStorage.setItem('turkua-lang', locale);
    document.documentElement.dataset.lang = locale;
    document.documentElement.lang = languageHtmlCode(locale);
    apply();
    state.hasAppliedLocale = true;
    window.dispatchEvent(new CustomEvent('turkua:languagechange', {
      detail: { locale }
    }));
  }

  function upsertRecord(record) {
    if (!record?.content_key || !record?.locale) return;
    state.records.set(recordId(record.content_key, record.locale), record);
  }

  async function load() {
    const [languageQuery, translationQuery] = await Promise.all([
      services.database.table('languages'),
      services.database.table('translations')
    ]);
    const [{ data: languages, error: languageError }, { data: translations, error: translationError }] =
      await Promise.all([
        languageQuery.select('*').eq('enabled', true).order('sort_order'),
        translationQuery.select('*').eq('status', 'published')
      ]);

    if (languageError) throw languageError;
    if (translationError) throw translationError;

    state.languages = languages || [];
    state.records.clear();
    (translations || []).forEach(upsertRecord);
    state.hasAppliedLocale = false;
    setLocale(state.languages.some(language => language.code === state.locale) ? state.locale : 'tr');
    window.dispatchEvent(new CustomEvent('turkua:content-ready'));
    window.dispatchEvent(new CustomEvent('turkua:languages-updated', {
      detail: { languages: state.languages }
    }));
  }

  async function subscribe() {
    state.channels.push(await services.realtime.subscribe({
      channel: 'turkua-public-translations',
      table: config.resources.tables.translations
    }, payload => {
      if (payload.eventType === 'DELETE') {
        state.records.delete(recordId(payload.old.content_key, payload.old.locale));
      } else if (payload.new.status === 'published') {
        upsertRecord(payload.new);
      } else {
        state.records.delete(recordId(payload.new.content_key, payload.new.locale));
      }
      const record = payload.eventType === 'DELETE' ? payload.old : payload.new;
      applyRecord(record.content_key, record.locale);
      window.dispatchEvent(new CustomEvent('turkua:content-updated', { detail: payload }));
    }));

    state.channels.push(await services.realtime.subscribe({
      channel: 'turkua-public-languages',
      table: config.resources.tables.languages
    }, () => load().catch(() => {})));
  }

  const ready = (async() => {
    if (window.location.protocol === 'file:') return false;
    try {
      const module = await import('./supabase/index.js');
      await module.supabaseReady;
      if (!module.getSupabaseStatus().connected) return false;
      services = module.supabaseServices;
      config = module.supabaseConfig;
      await load();
      await subscribe();
      return true;
    } catch (error) {
      return false;
    }
  })();

  window.TurkuaI18n = {
    ready,
    apply,
    load,
    t,
    setLocale,
    getLocale: () => state.locale,
    getLanguages: () => [...state.languages]
  };
})();
