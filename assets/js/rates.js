// Live exchange rates with a single visibility-aware refresh timer.
(function() {
  const CACHE_KEY = 'turkua_rates';
  const CACHE_TTL = 6 * 60 * 60 * 1000;
  const RETRY_DELAY = 30 * 60 * 1000;
  const rateElements = {
    tryUah: document.getElementById('rate-TRY-UAH'),
    uahTry: document.getElementById('rate-UAH-TRY'),
    uahUsd: document.getElementById('rate-UAH-USD'),
    status: document.getElementById('rateStatus')
  };

  let refreshTimer = 0;
  let nextRefreshAt = 0;
  let inFlight = null;
  let latestRates = null;

  const text = key => window.TurkuaI18n?.t(key) || '';

  function setRateUI(rates) {
    if (!rates) return;
    latestRates = rates;
    const fmt = (value, decimals) => value != null ? value.toFixed(decimals) : '—';
    if (rateElements.tryUah) rateElements.tryUah.textContent = `1 TL = ${fmt(rates.tryUah, 4)} ₴`;
    if (rateElements.uahTry) rateElements.uahTry.textContent = `1 ₴ = ${fmt(rates.uahTry, 4)} ₺`;
    const usdUah = rates.uahUsd ? 1 / rates.uahUsd : null;
    if (rateElements.uahUsd) rateElements.uahUsd.textContent = `1 $ = ${fmt(usdUah, 2)} ₴`;
    if (rateElements.status) {
      const date = new Date(rates.fetchedAt);
      const lang = document.documentElement.getAttribute('data-lang') || 'tr';
      rateElements.status.textContent =
        `${date.toLocaleTimeString(lang === 'ua' ? 'uk-UA' : 'tr-TR', { hour: '2-digit', minute: '2-digit' })} ${text('rates.updated')}`;
    }
  }

  function scheduleRefresh(delay) {
    clearTimeout(refreshTimer);
    nextRefreshAt = Date.now() + Math.max(0, delay);
    if (document.hidden) return;
    refreshTimer = window.setTimeout(fetchRates, Math.max(0, delay));
  }

  async function fetchRates() {
    if (inFlight) return inFlight;
    inFlight = (async() => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/UAH');
        if (!response.ok) throw new Error(`Rate request failed: ${response.status}`);
        const data = await response.json();
        if (!data || data.result !== 'success') throw new Error('Rate API unavailable.');
        const uahTry = data.rates.TRY;
        const rates = {
          tryUah: uahTry ? 1 / uahTry : null,
          uahTry,
          uahUsd: data.rates.USD,
          fetchedAt: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
        setRateUI(rates);
        scheduleRefresh(CACHE_TTL);
      } catch (error) {
        if (rateElements.status) rateElements.status.textContent = text('rates.unavailable');
        scheduleRefresh(RETRY_DELAY);
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  }

  function loadRates() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached?.fetchedAt) {
        setRateUI(cached);
        const remaining = CACHE_TTL - (Date.now() - cached.fetchedAt);
        if (remaining > 0) {
          scheduleRefresh(remaining);
          return;
        }
      }
    } catch (error) {}
    fetchRates();
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      clearTimeout(refreshTimer);
      refreshTimer = 0;
      return;
    }
    if (!nextRefreshAt || Date.now() >= nextRefreshAt) fetchRates();
    else scheduleRefresh(nextRefreshAt - Date.now());
  }

  window.Turkua.onReady(loadRates);
  window.addEventListener('turkua:languagechange', () => setRateUI(latestRates));
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', () => clearTimeout(refreshTimer));
  window.addEventListener('pageshow', event => {
    if (event.persisted) handleVisibilityChange();
  });
})();
