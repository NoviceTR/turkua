(function() {
  const state = { records: [], channels: [] };
  let services;
  let config;
  let loadPromise;
  let reloadTimer = 0;

  function sortRecords(records) {
    return [...records].sort((left, right) => {
      if (left.is_live !== right.is_live) return left.is_live ? -1 : 1;
      if (left.is_featured !== right.is_featured) return left.is_featured ? -1 : 1;
      return new Date(right.published_at) - new Date(left.published_at);
    });
  }

  function getItems(locale = document.documentElement.dataset.lang || 'tr') {
    return state.records.map(record => {
      const localization = record.localizations?.find(item => item.locale === locale) ||
        record.localizations?.find(item => item.locale === 'tr') ||
        record.localizations?.[0] || {};
      const categoryName = record.category?.localizations?.find(item => item.locale === locale)?.name ||
        record.category?.code || 'general';
      return {
        id: record.id,
        category: record.category?.code || 'general',
        categoryName,
        title: localization.title || '',
        body: localization.summary || localization.body || '',
        fullBody: localization.body || '',
        pubDate: record.published_at,
        imageUrl: record.image_url,
        link: record.source_url,
        isFeatured: record.is_featured,
        isLive: record.is_live
      };
    });
  }

  async function load() {
    if (loadPromise) return loadPromise;
    loadPromise = (async() => {
      const table = await services.database.table('news');
      const { data, error } = await table
        .select('*, category:news_categories(*, localizations:news_category_localizations(*)), localizations:news_localizations(*)')
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      state.records = sortRecords(data || []);
      window.dispatchEvent(new CustomEvent('turkua:news-updated', {
        detail: { items: getItems() }
      }));
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
    for (const resource of ['news', 'newsLocalizations']) {
      state.channels.push(await services.realtime.subscribe({
        channel: `turkua-public-${resource}`,
        table: config.resources.tables[resource]
      }, scheduleLoad));
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

  window.TurkuaNews = {
    ready,
    load,
    getItems
  };
  window.addEventListener('pagehide', () => clearTimeout(reloadTimer));
})();
