(function() {
  const state = {
    campaigns: [],
    originalHandlers: new Map(),
    channels: [],
    visibilityObservers: new Map(),
    popupTimer: 0
  };
  let services;
  let config;
  let loadPromise;
  let reloadTimer = 0;

  function activeBySlot() {
    return new Map(state.campaigns.map(campaign => [campaign.slot.code, campaign]));
  }

  async function recordEvent(campaignId, eventType) {
    if (String(campaignId).startsWith('sponsor:')) return;
    try {
      await services.database.rpc('record_ad_event', {
        p_ad_id: campaignId,
        p_event: eventType
      });
    } catch (error) {}
  }

  function recordImpression(campaign) {
    const key = `turkua-ad-impression:${campaign.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch (error) {}
    recordEvent(campaign.id, 'impression');
  }

  function recordWhenVisible(element, campaign) {
    if (!('IntersectionObserver' in window)) {
      recordImpression(campaign);
      return;
    }
    state.visibilityObservers.get(element)?.disconnect();
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.35)) return;
      observer.disconnect();
      state.visibilityObservers.delete(element);
      recordImpression(campaign);
    }, { threshold: [0.35] });
    state.visibilityObservers.set(element, observer);
    observer.observe(element);
  }

  function clickCampaign(campaign) {
    recordEvent(campaign.id, 'click');
    if (campaign.target_url) window.open(campaign.target_url, '_blank', 'noopener');
  }

  function clearManagedSlot(element) {
    state.visibilityObservers.get(element)?.disconnect();
    state.visibilityObservers.delete(element);
    element.querySelector('.managed-ad-media')?.remove();
    element.classList.remove('has-managed-ad');
    element.style.removeProperty('--managed-ad-image');
    delete element.dataset.adRenderedId;
    const original = state.originalHandlers.get(element);
    if (original !== undefined) {
      if (original) element.setAttribute('onclick', original);
      else element.removeAttribute('onclick');
    }
  }

  function renderExistingSlot(element, campaign) {
    if (!state.originalHandlers.has(element)) {
      state.originalHandlers.set(element, element.getAttribute('onclick'));
    }
    clearManagedSlot(element);
    if (!campaign) return;

    element.removeAttribute('onclick');
    element.classList.add('has-managed-ad');
    element.dataset.adRenderedId = campaign.id;
    const media = document.createElement(campaign.target_url ? 'button' : 'div');
    media.className = 'managed-ad-media';
    if (media.tagName === 'BUTTON') media.type = 'button';
    media.setAttribute('aria-label', campaign.alt_text || campaign.headline || campaign.name);
    const imageUrl = window.Turkua.safeUrl(campaign.image_url);
    if (imageUrl) {
      const image = document.createElement('img');
      image.src = imageUrl;
      image.alt = campaign.alt_text || campaign.headline || campaign.name;
      image.width = campaign.slot?.width || 600;
      image.height = campaign.slot?.height || 300;
      image.loading = campaign.slot?.code === 'top' ? 'eager' : 'lazy';
      image.decoding = 'async';
      if (campaign.slot?.code === 'top') image.fetchPriority = 'high';
      media.append(image);
    }
    if (campaign.headline) {
      const title = document.createElement('span');
      title.textContent = campaign.headline;
      media.append(title);
    }
    if (campaign.target_url) media.addEventListener('click', () => clickCampaign(campaign));
    element.prepend(media);
    recordWhenVisible(element, campaign);
  }

  function removeDynamicSlots() {
    ['turkuaAdSidebar', 'turkuaAdPopup'].forEach(id => {
      const element = document.getElementById(id);
      if (!element) return;
      state.visibilityObservers.get(element)?.disconnect();
      state.visibilityObservers.delete(element);
      element.remove();
    });
  }

  function createDynamicAd(campaign, kind) {
    const wrapper = document.createElement(kind === 'popup' ? 'div' : 'aside');
    wrapper.id = kind === 'popup' ? 'turkuaAdPopup' : 'turkuaAdSidebar';
    wrapper.className = `managed-${kind}-ad`;
    const panel = document.createElement('div');
    panel.className = 'managed-dynamic-ad-panel';
    const imageUrl = window.Turkua.safeUrl(campaign.image_url);
    if (imageUrl) {
      const image = document.createElement('img');
      image.src = imageUrl;
      image.alt = campaign.alt_text || campaign.headline || campaign.name;
      image.width = campaign.slot?.width || 600;
      image.height = campaign.slot?.height || 500;
      image.loading = 'lazy';
      image.decoding = 'async';
      panel.append(image);
    }
    if (campaign.headline) {
      const title = document.createElement('strong');
      title.textContent = campaign.headline;
      panel.append(title);
    }
    if (campaign.target_url) {
      panel.tabIndex = 0;
      panel.setAttribute('role', 'link');
      panel.addEventListener('click', () => clickCampaign(campaign));
      panel.addEventListener('keydown', event => {
        if (event.key === 'Enter') clickCampaign(campaign);
      });
    }
    if (kind === 'popup') {
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'managed-ad-close';
      close.setAttribute('aria-label', 'Kapat');
      close.textContent = '×';
      close.addEventListener('click', event => {
        event.stopPropagation();
        wrapper.remove();
      });
      panel.append(close);
    }
    wrapper.append(panel);
    document.body.append(wrapper);
    recordWhenVisible(wrapper, campaign);
  }

  function render() {
    clearTimeout(state.popupTimer);
    state.popupTimer = 0;
    const campaigns = activeBySlot();
    document.querySelectorAll('[data-ad-slot]').forEach(element => {
      renderExistingSlot(element, campaigns.get(element.dataset.adSlot));
    });
    removeDynamicSlots();
    const sidebar = campaigns.get('sidebar');
    if (sidebar && window.matchMedia('(min-width: 1101px)').matches) {
      createDynamicAd(sidebar, 'sidebar');
    }
    const popup = campaigns.get('popup');
    if (popup) {
      const key = `turkua-ad-popup:${popup.id}`;
      let shown = false;
      try { shown = sessionStorage.getItem(key) === '1'; } catch (error) {}
      if (!shown) {
        state.popupTimer = window.setTimeout(() => {
          if (!state.campaigns.some(campaign => campaign.id === popup.id)) return;
          createDynamicAd(popup, 'popup');
          try { sessionStorage.setItem(key, '1'); } catch (error) {}
        }, 900);
      }
    }
  }

  async function load() {
    if (loadPromise) return loadPromise;
    loadPromise = (async() => {
      const now = new Date().toISOString();
      const table = await services.database.table('ads');
      const { data, error } = await table
        .select('*, slot:ad_slots(*)')
        .eq('is_active', true)
        .lte('starts_at', now)
        .gt('ends_at', now);
      if (error) throw error;
      let sponsors = [];
      try {
        const [sponsorTable, slotTable] = await Promise.all([
          services.database.table('sponsoredAds'),
          services.database.table('adSlots')
        ]);
        const [sponsorResult, slotResult] = await Promise.all([
          sponsorTable
            .select('*, media:media_assets(*)')
            .eq('locale', document.documentElement.dataset.lang || 'tr')
            .eq('is_active', true)
            .lte('start_date', now)
            .gt('end_date', now)
            .order('sort_order'),
          slotTable.select('*').eq('enabled', true)
        ]);
        if (sponsorResult.error) throw sponsorResult.error;
        if (slotResult.error) throw slotResult.error;
        const slots = new Map((slotResult.data || []).map(slot => [slot.code, slot]));
        sponsors = (sponsorResult.data || [])
          .filter(item => slots.has(item.slot_code))
          .map(item => ({
            id: `sponsor:${item.id}`,
            name: item.advertiser_name,
            headline: item.title,
            image_url: item.media?.public_url || '',
            alt_text: item.media?.alt_text || item.title,
            target_url: item.target_url,
            starts_at: item.start_date,
            ends_at: item.end_date,
            slot: slots.get(item.slot_code)
          }));
      } catch (sponsorError) {}
      state.campaigns = [...(data || []), ...sponsors];
      render();
      window.dispatchEvent(new CustomEvent('turkua:ads-updated'));
    })().finally(() => {
      loadPromise = null;
    });
    return loadPromise;
  }

  function scheduleLoad() {
    if (!services) return;
    clearTimeout(reloadTimer);
    reloadTimer = window.setTimeout(() => load().catch(() => {}), 140);
  }

  async function subscribe() {
    for (const resource of ['ads', 'sponsoredAds']) {
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

  window.TurkuaAds = { ready, load };
  window.addEventListener('turkua:languagechange', scheduleLoad);
  window.addEventListener('pagehide', event => {
    clearTimeout(reloadTimer);
    clearTimeout(state.popupTimer);
    if (event.persisted) return;
    state.visibilityObservers.forEach(observer => observer.disconnect());
    state.visibilityObservers.clear();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) render();
  });
})();
