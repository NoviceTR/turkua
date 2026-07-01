// ══ UKRAYNA GÜNDEMİ — CANLI HABERLER ══════════════════════════
// Kaynaklar: Ukrinform (genel + siyaset) + WAR_DATA.gundemNews (ajan ekler)
(function() {
  const RSS_SOURCES = [
    'https://www.ukrinform.net/rss/block-lastnews',
    'https://www.ukrinform.net/rss/block-politics'
  ];
  const CACHE_KEY = 'turkua_gundem_v2';
  const CACHE_TTL = 6 * 60 * 60 * 1000;
  const RETRY_DELAY = 30 * 60 * 1000;
  const escapeHtml = window.Turkua.escapeHtml;
  const safeUrl = window.Turkua.safeUrl;
  let lastRssItems = [];
  let refreshTimer = 0;
  let nextRefreshAt = 0;
  let inFlight = null;
  let renderFrame = 0;
  const elements = {
    featured: document.getElementById('gundemFeatured'),
    grid: document.getElementById('gundemGrid'),
    loading: document.getElementById('gundemLoading'),
    error: document.getElementById('gundemError'),
    ticker: document.getElementById('tickerInner'),
    updated: document.getElementById('gundemUpdateInfo')
  };

  function detectCat(title, desc) {
    const t = (title + ' ' + (desc||'')).toLowerCase();
    if (/rada|parliament|verkhovna|law|legislation|deputy|vote|bill|мп|закон|рада|парламент/i.test(t)) return 'parliamentary';
    if (/peace|ceasefire|negotiat|diplomat|summit|minister|sanction|deal|talk|мир|перемир/i.test(t)) return 'diplomatic';
    if (/aid|humanitarian|refugee|civilian|evacuat|hospital|food|child|гуманітар|біженц/i.test(t)) return 'humanitarian';
    if (/economy|gdp|budget|trade|energy|grain|market|reconstruct|економ|бюджет/i.test(t)) return 'economic';
    return 'general';
  }

  const CAT_STYLE = {
    parliamentary: 'background:rgba(160,0,255,.15);color:#cc88ff;border:1px solid rgba(160,0,255,.3);',
    diplomatic:    'background:rgba(0,100,255,.2);color:#5bbfff;border:1px solid rgba(0,100,255,.3);',
    military:      'background:rgba(255,36,66,.15);color:#ff6080;border:1px solid rgba(255,36,66,.3);',
    humanitarian:  'background:rgba(0,200,100,.15);color:#40e090;border:1px solid rgba(0,200,100,.3);',
    economic:      'background:rgba(255,180,0,.15);color:#ffcc40;border:1px solid rgba(255,180,0,.3);',
    general:       'background:rgba(150,150,255,.1);color:#aab0ff;border:1px solid rgba(150,150,255,.2);'
  };

  function getLang() { return document.documentElement.getAttribute('data-lang') || 'tr'; }
  function text(key, lang = getLang()) { return window.TurkuaI18n?.t(key, lang) || ''; }

  function fmtDate(str, lang) {
    try {
      const d = new Date(str);
      return d.toLocaleDateString(lang==='ua'?'uk-UA':'tr-TR',{day:'numeric',month:'long'}) +
             ' ' + d.toLocaleTimeString(lang==='ua'?'uk-UA':'tr-TR',{hour:'2-digit',minute:'2-digit'});
    } catch(e) { return str||''; }
  }

  function shortText(raw, max) {
    const t = sanitizeNewsText(raw);
    return t.length > max ? t.substring(0, max).replace(/\s\S*$/,'')+'…' : t;
  }

  function sanitizeNewsText(raw) {
    return (raw || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/https?:\/\/\S+/gi, ' ')
      .replace(/[“”"«»][^“”"«»]{20,}[“”"«»]/g, ' ')
      .replace(/\b(advertisement|sponsored|promo|promotion|partner content|buy now|subscribe|newsletter|cookie|privacy policy)\b/gi, ' ')
      .replace(/\b(reklam|sponsorlu|tanıtım|kampanya|satın al|abonelik|çerez|gizlilik politikası)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isAllowedNewsItem(it) {
    const title = sanitizeNewsText(it && it.title);
    const body = sanitizeNewsText(it && it.description);
    const combined = (title + ' ' + body).toLowerCase();
    if (!title || title.length < 18) return false;
    if (/(advertisement|sponsored|promo|promotion|partner content|commercial offer|newsletter|subscribe|reklam|sponsorlu|tanıtım|kampanya|abonelik)/i.test(combined)) return false;
    if ((combined.match(/\b[A-Z][A-Z0-9&.-]{2,}\b/g) || []).length > 5) return false;
    return true;
  }

  function buildCard(it, featured, lang) {
    const detectedCategory = it._cat || detectCat(it.title||'', it.description||'');
    const cat = Object.hasOwn(CAT_STYLE, detectedCategory) ? detectedCategory : 'general';
    const style = CAT_STYLE[cat] || CAT_STYLE.general;
    const catTxt = escapeHtml(it._catLabel || text(`gundem.category.${cat}`, lang));
    const title = escapeHtml(sanitizeNewsText(lang==='ua' && it._title_ua ? it._title_ua : (it._title_tr||it.title||'')));
    const body = escapeHtml(lang==='ua' && it._body_ua ? it._body_ua : (it._body_tr||shortText(it.description, featured?130:90)));
    const dateStr = escapeHtml(lang==='ua' && it._date_ua ? it._date_ua : (it._date_tr||fmtDate(it.pubDate||'', lang)));
    const image = it._imageUrl ? `<img class="gundem-card-image" src="${safeUrl(it._imageUrl)}" alt="" width="800" height="450" loading="lazy" decoding="async">` : '';
    const live = it._isLive ? `<span class="gundem-item-live">${text('gundem.span.002', lang)}</span>` : '';
    const link = safeUrl(it.link);
    return `<div class="gundem-card${featured?' featured':''}">
      ${image}
      <div class="gundem-card-top">
        <span class="gundem-cat ${cat}" style="${style}">${catTxt}</span>${live}
        <span class="gundem-card-date">${dateStr}</span>
      </div>
      <div class="gundem-card-title" style="font-size:${featured?'16px':'13px'};">${title}</div>
      <div class="gundem-card-body" style="font-size:${featured?'12px':'11px'};">${body}</div>
      ${link ? `<a class="gundem-card-link" href="${link}" target="_blank" rel="noopener">↗</a>` : ''}
    </div>`;
  }

  function buildTickerHTML(items) {
    const lang = getLang();
    const half = items.slice(0,18).map(it => {
      const detectedCategory = it._cat || detectCat(it.title||'', it.description||'');
      const cat = Object.hasOwn(CAT_STYLE, detectedCategory) ? detectedCategory : 'general';
      const catTxt = escapeHtml(text(`gundem.category.${cat}`, lang));
      const style = CAT_STYLE[cat] || CAT_STYLE.general;
      const title = escapeHtml(sanitizeNewsText(lang==='ua' && it._title_ua ? it._title_ua : (it._title_tr||it.title||'')));
      return `<span class="ticker-item">` +
        `<span class="ticker-item-cat ${cat}" style="${style}">${catTxt}</span>` +
        `<span>${title.substring(0,85)}${title.length>85?'…':''}</span>` +
        `</span><span class="ticker-item-sep">◆</span>`;
    }).join('');
    return half + half;
  }

  function getManagedItems(lang) {
    return (window.TurkuaNews?.getItems(lang) || []).map(item => ({
      _cat: item.category,
      _catLabel: item.categoryName,
      _title_tr: item.title,
      _title_ua: item.title,
      _body_tr: item.body,
      _body_ua: item.body,
      _date_tr: fmtDate(item.pubDate, lang),
      _date_ua: fmtDate(item.pubDate, lang),
      _imageUrl: item.imageUrl,
      _isLive: item.isLive,
      _isFeatured: item.isFeatured,
      link: item.link || '',
      title: item.title,
      pubDate: item.pubDate
    }));
  }

  function renderGundem(rssItems) {
    const lang = getLang();
    lastRssItems = rssItems || [];
    const managedItems = getManagedItems(lang);
    const items = [...managedItems, ...lastRssItems].slice(0,20);
    const explicitlyFeatured = items.filter(item => item._isFeatured);
    const featuredItems = [
      ...explicitlyFeatured,
      ...items.filter(item => !explicitlyFeatured.includes(item))
    ].slice(0, 2);
    const featuredSet = new Set(featuredItems);
    const remainingItems = items.filter(item => !featuredSet.has(item));
    const displayItems = [...featuredItems, ...remainingItems];
    if (elements.featured) {
      elements.featured.innerHTML = featuredItems.map(it=>buildCard(it,true,lang)).join('');
      elements.featured.style.display='';
    }
    if (elements.grid) {
      elements.grid.innerHTML = remainingItems.slice(0,10).map(it=>buildCard(it,false,lang)).join('');
      elements.grid.style.display='';
    }
    if (elements.loading) elements.loading.style.display = 'none';
    if (elements.error) elements.error.style.display = 'none';
    if (elements.ticker) elements.ticker.innerHTML = buildTickerHTML(displayItems);
    if (elements.updated) {
      const d = new Date();
      elements.updated.textContent = text('gundem.updated.prefix', lang) +
        d.toLocaleTimeString(lang==='ua'?'uk-UA':'tr-TR',{hour:'2-digit',minute:'2-digit'});
    }
  }

  function scheduleRender() {
    if (renderFrame) return;
    renderFrame = requestAnimationFrame(() => {
      renderFrame = 0;
      renderGundem(lastRssItems);
    });
  }

  function showLoadError() {
    if (elements.loading) elements.loading.style.display = 'none';
    if (elements.error) elements.error.style.display = '';
  }

  function scheduleRefresh(delay) {
    clearTimeout(refreshTimer);
    nextRefreshAt = Date.now() + Math.max(0, delay);
    if (document.hidden) return;
    refreshTimer = window.setTimeout(() => window.fetchGundem(true), Math.max(0, delay));
  }

  async function fetchOne(url) {
    const api = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(url) + '&count=12';
    const response = await fetch(api);
    if (!response.ok) throw new Error(`RSS request failed: ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data?.items)) throw new Error('RSS response is invalid.');
    return data.items;
  }

  async function loadGundem(force) {
    // 1. ÖNCE: WAR_DATA'daki haberleri hemen göster (RSS bekleme yok)
    const agentItems = getManagedItems(getLang());
    if (agentItems.length > 0) {
      renderGundem([]); // agentItems getAgentItems() içinden gelir
    }

    // 2. Önbellekte taze veri varsa RSS'e gitme
    let staleItems = [];
    if (!force) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const c = JSON.parse(cached);
          if (Array.isArray(c.items) && c.items.length) {
            staleItems = c.items;
            renderGundem(staleItems);
          }
          if (staleItems.length && Date.now() - c.ts < CACHE_TTL) {
            scheduleRefresh(CACHE_TTL - (Date.now() - c.ts));
            return;
          }
        }
      } catch(e) {}
    }

    // 3. RSS'ten yeni veri çekmeyi dene (arka planda)
    try {
      const results = await Promise.allSettled(RSS_SOURCES.map(fetchOne));
      const seen = new Set();
      const merged = results
        .filter(r => r.status==='fulfilled')
        .flatMap(r => r.value)
        .filter(isAllowedNewsItem)
        .filter(it => { const key = sanitizeNewsText(it.title); if(seen.has(key)) return false; seen.add(key); return true; })
        .sort((a,b) => new Date(b.pubDate||0) - new Date(a.pubDate||0))
        .slice(0, 20);
      if (merged.length) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items: merged }));
        renderGundem(merged); // WAR_DATA + RSS birleşik göster
        scheduleRefresh(CACHE_TTL);
        return;
      }
      if (agentItems.length === 0 && staleItems.length === 0) {
        showLoadError();
      }
      scheduleRefresh(RETRY_DELAY);
    } catch(e) {
      // RSS başarısız — WAR_DATA haberleri zaten gösteriliyor, hata mesajı yok
      if (agentItems.length === 0) {
        showLoadError();
      }
      scheduleRefresh(RETRY_DELAY);
    }
  }

  window.fetchGundem = function(force = false) {
    if (inFlight) return inFlight;
    inFlight = loadGundem(force).finally(() => {
      inFlight = null;
    });
    return inFlight;
  };

  window.Turkua.onReady(() => window.fetchGundem(false));
  window.addEventListener('turkua:news-updated', scheduleRender);
  window.addEventListener('turkua:languagechange', scheduleRender);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(refreshTimer);
      refreshTimer = 0;
      return;
    }
    if (!nextRefreshAt || Date.now() >= nextRefreshAt) window.fetchGundem(true);
    else scheduleRefresh(nextRefreshAt - Date.now());
  });
  window.addEventListener('pagehide', () => {
    clearTimeout(refreshTimer);
    if (renderFrame) cancelAnimationFrame(renderFrame);
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    if (!nextRefreshAt || Date.now() >= nextRefreshAt) window.fetchGundem(true);
    else scheduleRefresh(nextRefreshAt - Date.now());
  });
})();
