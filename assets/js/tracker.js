// TürkUA tracker and static news rendering.
function getWarData() {
  return window.TurkuaCMS?.getTrackerData() || window.WAR_DATA || {};
}

const trackerEscape = window.Turkua.escapeHtml;
const trackerNewsCategories = new Set([
  'military',
  'diplomatic',
  'economic',
  'humanitarian'
]);
const trackerElements = Object.fromEntries([
  'fill1d', 'fill1m', 'fill1y', 'num1d', 'num1m', 'num1y',
  'reason1d', 'reason1m', 'reason1y', 'statusSavas', 'statusMuzakere',
  'statusGun', 'confLabel', 'lastUpdateDisplay', 'devList', 'reasoningText',
  'trendFill', 'trendLabel', 'newsGrid', 'newsLastUpdate'
].map(id => [id, document.getElementById(id)]));
const trackerConfidenceDots = [...document.querySelectorAll('.conf-dot')];
const trackerNewsFilterButtons = [...document.querySelectorAll('.news-filter-btn')];

// setLang defined below at init block

// ── Tube color ──
function getProbColor(p) {
  if (p <= 10) return { b:'#00ff44', t:'#00ccff', g:'rgba(0,255,68,.6)' };
  if (p <= 25) return { b:'#aaff00', t:'#00ff88', g:'rgba(170,255,0,.5)' };
  if (p <= 50) return { b:'#ffcc00', t:'#ff8800', g:'rgba(255,200,0,.5)' };
  if (p <= 75) return { b:'#ff6600', t:'#ff3300', g:'rgba(255,100,0,.5)' };
  return { b:'#ff2442', t:'#ff0088', g:'rgba(255,36,66,.6)' };
}

// ── War duration (auto-calculated) ──
function getWarDuration(lang) {
  const start = new Date('2022-02-24T00:00:00');
  const now   = new Date();
  const diffMs  = now - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const years   = Math.floor(diffDays / 365);
  const days    = diffDays % 365;

  const plural = value => value === 1 ? 'one' : (value >= 2 && value <= 4 ? 'few' : 'many');
  const yearUnit = window.TurkuaI18n?.t(`tracker.duration.year.${plural(years)}`, lang);
  const dayUnit = window.TurkuaI18n?.t(`tracker.duration.day.${plural(days)}`, lang);
  return `${years} ${yearUnit} ${days} ${dayUnit}`;
}

// ── Render ──
function t(field, lang) {
  if (!field) return '';
  if (typeof field === 'object') return field[lang] || field.tr || '';
  return window.TurkuaI18n?.t(field, lang) || '';
}


// ── News Section ──
let _newsFilter = 'all';

function filterNews(cat) {
  _newsFilter = cat;
  trackerNewsFilterButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === cat);
  });
  renderNews();
}

function renderNews() {
  const lang = document.documentElement.getAttribute('data-lang') || 'tr';
  const grid = trackerElements.newsGrid;
  if (!grid) return;
  const data = getWarData();
  const items = (data.newsItems || []).filter(n =>
    _newsFilter === 'all' || n.category === _newsFilter
  );
  grid.innerHTML = items.map(n => {
    const category = trackerNewsCategories.has(n.category) ? n.category : 'general';
    const catLabel = trackerEscape(t(`tracker.category.${category}`, lang));
    const impactVal = Number(n.impact) || 0;
    const impactCls = impactVal > 0 ? 'pos' : (impactVal < 0 ? 'neg' : 'neu');
    const impactTxt = impactVal > 0 ? '+' + impactVal + '%' : (impactVal < 0 ? impactVal + '%' : '—');
    return `<div class="news-card ${category}">
      <div class="news-card-top">
        <span class="news-cat">${catLabel}</span>
        <span class="news-date">${trackerEscape(t(n.date, lang))}</span>
      </div>
      <div class="news-title">${trackerEscape(t(n.title, lang))}</div>
      <div class="news-body">${trackerEscape(t(n.body, lang))}</div>
      <span class="news-impact ${impactCls}">${impactTxt} <span style="font-size:8px;opacity:.7">${trackerEscape(t('tracker.impact.label', lang))}</span></span>
    </div>`;
  }).join('');
  if (items.length === 0) {
    grid.innerHTML = `<div style="color:var(--text-muted);font-size:13px;padding:20px 0;">${t('tracker.news.empty', lang)}</div>`;
  }
  const newsUpEl = trackerElements.newsLastUpdate;
  if (newsUpEl && data.lastUpdate) {
    const dt = new Date(data.lastUpdate);
    const locale = lang === 'ua' ? 'uk-UA' : 'tr-TR';
    const label = t('tracker.updated.short', lang);
    newsUpEl.textContent = label + dt.toLocaleString(locale, {day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit'});
  }
}

function setCardProb(fillId, numId, labelId, prob, labelText) {
  const c = getProbColor(prob);
  const fill = trackerElements[fillId];
  if (fill) {
    fill.style.height = prob + '%';
    fill.style.background = `linear-gradient(to top, ${c.b}, ${c.t})`;
    fill.style.boxShadow = `0 0 16px ${c.g}`;
  }
  const num = trackerElements[numId];
  if (num) {
    num.textContent = prob + '%';
    num.style.color = c.b;
    num.style.textShadow = `0 0 16px ${c.g}, 0 0 32px ${c.g}`;
  }
  const lbl = trackerElements[labelId];
  if (lbl) lbl.textContent = labelText || '—';
}

function render() {
  const lang = document.documentElement.getAttribute('data-lang') || 'tr';
  const d = getWarData();

  // 3 time-frame tubes
  setCardProb('fill1d','num1d','reason1d', d.prob1d || 0, t(d.label1d, lang));
  setCardProb('fill1m','num1m','reason1m', d.prob1m || 0, t(d.label1m, lang));
  setCardProb('fill1y','num1y','reason1y', d.prob1y || 0, t(d.label1y, lang));

  // Status bar
  trackerElements.statusSavas.textContent = t(d.statusSavas, lang) || '—';
  trackerElements.statusMuzakere.textContent = t(d.statusMuzakere, lang) || '—';
  trackerElements.statusGun.textContent = getWarDuration(lang);

  trackerConfidenceDots.forEach((dot, i) =>
    dot.classList.toggle('active', i < d.confidence));
  trackerElements.confLabel.textContent = (d.confidence || 0) + ' / 5';

  const dt = new Date(d.lastUpdate);
  const locale   = lang === 'ua' ? 'uk-UA' : 'tr-TR';
  const prefix = t('tracker.updated.long', lang);
  trackerElements.lastUpdateDisplay.textContent =
    prefix + dt.toLocaleString(locale,
      {year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit'});

  trackerElements.devList.innerHTML = (d.developments || []).map(dev => {
    const type = ['positive', 'negative', 'neutral'].includes(dev.type) ? dev.type : 'neutral';
    const impact = Number(dev.impact) || 0;
    const sign = impact > 0 ? '+' : '';
    return `<div class="dev-item ${type}">
      <div class="dev-impact">${sign}${impact}%</div>
      <div class="dev-content">
        <div class="dev-date">${trackerEscape(t(dev.date, lang))}</div>
        <div class="dev-text">${trackerEscape(t(dev.text, lang))}</div>
      </div>
    </div>`;
  }).join('');

  trackerElements.reasoningText.textContent = t(d.reasoning, lang);
  renderNews();
  trackerElements.trendFill.style.width = (d.trendPct || 30) + '%';
  trackerElements.trendLabel.textContent = t(d.trend, lang);
}

// ── Lang switcher – re-render on change ──
// ── Init – auto-detect browser language ──
window.Turkua.onReady(() => {
  const saved = localStorage.getItem('turkua-lang');
  if (saved) {
    window.setLang(saved);
  } else {
    const bl = (navigator.language || navigator.userLanguage || 'tr').toLowerCase();
    window.setLang(bl.startsWith('uk') ? 'ua' : 'tr');
  }
});

window.addEventListener('turkua:languagechange', render);
window.addEventListener('turkua:tracker-updated', render);

Object.assign(window, {
  filterNews,
  render
});
