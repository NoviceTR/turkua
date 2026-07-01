// Public CMS bridge. Static HTML and data.js remain the fallback source.
(function() {
  const state = {
    hero: [],
    tracker: null,
    contacts: [],
    channels: []
  };
  let services;
  let config;
  let loadPromise;
  let reloadTimer = 0;

  function locale() {
    return document.documentElement.dataset.lang || 'tr';
  }

  function localized(records) {
    const activeLocale = locale();
    return records.find(record => record.locale === activeLocale) ||
      records.find(record => record.locale === 'tr') ||
      records[0] ||
      null;
  }

  function setMultilineText(element, value) {
    if (!element) return;
    const lines = String(value || '').split(/\r?\n/);
    element.replaceChildren();
    lines.forEach((line, index) => {
      if (index) element.append(document.createElement('br'));
      element.append(document.createTextNode(line));
    });
  }

  function restoreHero() {
    const root = document.querySelector('.hero-copy');
    if (root) window.TurkuaI18n?.apply(root);
    const tracker = document.getElementById('tracker');
    tracker?.classList.remove('has-cms-hero-image');
    tracker?.style.removeProperty('--hero-cms-image');
  }

  function applyHero() {
    const record = localized(state.hero);
    if (!record) {
      restoreHero();
      return;
    }
    const activeLocale = locale();
    const root = document.querySelector('.hero-copy');
    const label = root?.querySelector(`.hero-label[data-locale="${activeLocale}"]`) ||
      root?.querySelector('.hero-label:not([hidden])');
    const title = root?.querySelector(`.hero-title[data-locale="${activeLocale}"]`) ||
      root?.querySelector('.hero-title:not([hidden])');
    const subtitle = root?.querySelector(`.hero-sub[data-locale="${activeLocale}"]`) ||
      root?.querySelector('.hero-sub:not([hidden])');
    if (record.eyebrow && label) label.textContent = record.eyebrow;
    if (record.title) setMultilineText(title, record.title);
    if ((record.subtitle || record.body) && subtitle) {
      subtitle.textContent = record.subtitle || record.body;
    }

    const imageUrl = window.Turkua.safeUrl(record.background?.public_url);
    const tracker = document.getElementById('tracker');
    tracker?.classList.toggle('has-cms-hero-image', Boolean(imageUrl));
    if (imageUrl) tracker?.style.setProperty('--hero-cms-image', `url("${imageUrl}")`);
    else tracker?.style.removeProperty('--hero-cms-image');
  }

  function contactHref(type, value) {
    const clean = String(value || '').trim();
    if (!clean) return '';
    if (type === 'email') return `mailto:${clean.replace(/[\r\n]/g, '')}`;
    if (type === 'phone' || type === 'whatsapp') {
      const number = clean.replace(/[^\d+]/g, '');
      if (!number) return '';
      return type === 'phone' ? `tel:${number}` : `https://wa.me/${number.replace(/\D/g, '')}`;
    }
    if (type === 'telegram') {
      if (/^https:\/\/t\.me\//i.test(clean)) return clean;
      const username = clean.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '');
      return username ? `https://t.me/${username}` : '';
    }
    return '';
  }

  function setContactLink(id, type, value) {
    const element = document.getElementById(id);
    if (!element) return false;
    const href = contactHref(type, value);
    element.hidden = !href;
    if (!href) {
      element.removeAttribute('href');
      element.textContent = '';
      return false;
    }
    element.href = href;
    element.textContent = value;
    return true;
  }

  function applyContact() {
    const record = localized(state.contacts);
    const container = document.getElementById('cmsContactInfo');
    if (!container) return;
    if (!record) {
      container.hidden = true;
      document.querySelector('.ad-modal-submit')?.removeAttribute('hidden');
      return;
    }
    const visible = [
      setContactLink('cmsContactEmail', 'email', record.email),
      setContactLink('cmsContactPhone', 'phone', record.phone),
      setContactLink('cmsContactWhatsapp', 'whatsapp', record.whatsapp),
      setContactLink('cmsContactTelegram', 'telegram', record.telegram)
    ].some(Boolean);
    const details = document.getElementById('cmsContactDetails');
    const detailText = [record.address, record.working_hours, record.response_time_text]
      .filter(Boolean)
      .join(' · ');
    if (details) {
      details.hidden = !detailText;
      details.textContent = detailText;
    }
    container.hidden = !visible && !detailText;
    const submit = document.querySelector('.ad-modal-submit');
    if (submit) submit.hidden = record.form_enabled === false;
  }

  function trackerData() {
    const fallback = window.WAR_DATA || {};
    const record = state.tracker;
    if (!record) return fallback;
    return {
      ...fallback,
      prob1d: Number(record.probability_1d),
      prob1m: Number(record.probability_1m),
      prob1y: Number(record.probability_1y),
      confidence: Number(record.confidence),
      trendPct: Number(record.trend_percent),
      statusSavas: record.war_status_key || fallback.statusSavas,
      statusMuzakere: record.negotiation_status_key || fallback.statusMuzakere,
      trend: record.trend_key || fallback.trend,
      reasoning: record.reasoning_key || fallback.reasoning,
      developments: Array.isArray(record.developments) ? record.developments : fallback.developments,
      newsItems: Array.isArray(record.news_items) ? record.news_items : fallback.newsItems,
      lastUpdate: record.observed_at || fallback.lastUpdate,
      gundemLastUpdate: record.observed_at || fallback.gundemLastUpdate
    };
  }

  function apply() {
    applyHero();
    applyContact();
    window.dispatchEvent(new CustomEvent('turkua:tracker-updated', {
      detail: { data: trackerData() }
    }));
    window.dispatchEvent(new CustomEvent('turkua:cms-updated'));
  }

  async function optionalQuery(resource, query) {
    try {
      const table = await services.database.table(resource);
      const { data, error } = await query(table);
      if (error) throw error;
      return data || [];
    } catch (error) {
      return null;
    }
  }

  async function load() {
    if (loadPromise) return loadPromise;
    loadPromise = (async() => {
      const [hero, tracker, contacts] = await Promise.all([
        optionalQuery('heroContent', table => table
          .select('*, background:media_assets(*)')
          .eq('content_key', 'main')
          .eq('is_active', true)
          .order('sort_order')),
        optionalQuery('trackerData', table => table
          .select('*')
          .eq('dataset_key', 'current')
          .eq('is_active', true)
          .order('observed_at', { ascending: false })
          .limit(1)),
        optionalQuery('contactSettings', table => table
          .select('*')
          .eq('setting_key', 'main')
          .eq('is_active', true)
          .order('sort_order'))
      ]);
      if (hero !== null) state.hero = hero;
      if (tracker !== null) state.tracker = tracker[0] || null;
      if (contacts !== null) state.contacts = contacts;
      apply();
      return true;
    })().finally(() => {
      loadPromise = null;
    });
    return loadPromise;
  }

  function scheduleLoad() {
    clearTimeout(reloadTimer);
    reloadTimer = window.setTimeout(() => load().catch(() => {}), 140);
  }

  async function subscribe() {
    for (const resource of ['heroContent', 'trackerData', 'contactSettings']) {
      try {
        state.channels.push(await services.realtime.subscribe({
          channel: `turkua-public-${resource}`,
          table: config.resources.tables[resource]
        }, scheduleLoad));
      } catch (error) {}
    }
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

  window.TurkuaCMS = {
    ready,
    load,
    apply,
    getTrackerData: trackerData,
    getContact: () => localized(state.contacts)
  };

  window.addEventListener('turkua:languagechange', apply);
  window.addEventListener('pagehide', () => clearTimeout(reloadTimer));
})();
