import {
  getSupabaseStatus,
  supabaseConfig,
  supabaseReady,
  supabaseServices
} from '../../../assets/js/supabase/index.js';
import { createNewsManager } from './news-manager.js';
import { createAdsManager } from './ads-manager.js';
import { createApplicationsManager } from './applications-manager.js';
import {
  createContactManager,
  createHeroManager,
  createTrackerManager
} from './cms-content-managers.js';
import { createSponsorsManager } from './sponsors-manager.js';
import { createMediaManager } from './media-manager.js';

(function() {
  const SETTINGS_KEY = 'turkuaAdminSettings';
  const COMPONENT_ROOT = 'components/';
  const VIEW_ROOT = 'views/';

  const routes = {
    dashboard: { title: 'Dashboard', file: 'dashboard.html' },
    news: { title: 'Haber Yönetimi', file: 'news-manager.html' },
    hero: { title: 'Hero İçeriği', file: 'hero-manager.html' },
    tracker: { title: 'Savaş Takibi', file: 'tracker-manager.html' },
    contact: { title: 'İletişim Bilgileri', file: 'contact-manager.html' },
    media: { title: 'Medya Kütüphanesi', file: 'media-manager.html' },
    ads: { title: 'Reklam Yönetimi', file: 'ads-manager.html' },
    sponsors: { title: 'Sponsor Reklamlar', file: 'sponsors-manager.html' },
    applications: { title: 'Başvuru Yönetimi', file: 'applications-manager.html' },
    pages: { title: 'Sayfa Yönetimi', file: 'pages-manager.html' },
    translations: { title: 'Çeviri Yönetimi', file: 'translation-manager.html' },
    settings: { title: 'Ayarlar', file: 'settings.html' }
  };

  let toastTimer;
  let currentRoute = 'dashboard';
  let translationChannel = null;
  let activeManager = null;
  const translationState = {
    languages: [],
    records: [],
    filter: 'all',
    section: 'all'
  };

  async function fetchHtml(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Dosya yüklenemedi: ${path}`);
    return response.text();
  }

  async function mountSharedComponents() {
    const slots = Array.from(document.querySelectorAll('[data-admin-component]'));
    const entries = await Promise.all(slots.map(async slot => {
      const name = slot.dataset.adminComponent;
      return [slot, await fetchHtml(`${COMPONENT_ROOT}${name}.html`)];
    }));

    entries.forEach(([slot, html]) => {
      const template = document.createElement('template');
      template.innerHTML = html;
      slot.replaceWith(template.content.cloneNode(true));
    });
  }

  function routeFromHash() {
    const value = window.location.hash.replace('#', '');
    return routes[value] ? value : 'dashboard';
  }

  async function loadView(route, updateHash) {
    const config = routes[route] || routes.dashboard;
    const view = document.getElementById('adminView');
    view.innerHTML = '<div class="view-loading">Görünüm hazırlanıyor...</div>';

    try {
      view.innerHTML = await fetchHtml(`${VIEW_ROOT}${config.file}`);
      currentRoute = route;
      document.getElementById('viewTitle').textContent = config.title;
      document.title = `${config.title} - TürkUA Yönetim`;

      document.querySelectorAll('.sidebar-link').forEach(button => {
        button.classList.toggle('active', button.dataset.view === route);
      });

      if (updateHash && window.location.hash !== `#${route}`) {
        history.pushState(null, '', `#${route}`);
      }

      restoreViewState(route);
      await initializeRoute(route);
      renderBackendStatus();
      closeSidebar();
      view.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch (error) {
      view.innerHTML = '<div class="view-loading">Görünüm yüklenemedi.</div>';
      showToast('Görünüm yüklenemedi. Dosya yapısını kontrol edin.');
    }
  }

  function openSidebar() {
    document.getElementById('adminSidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('show');
  }

  function closeSidebar() {
    document.getElementById('adminSidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('show');
  }

  function showToast(text) {
    const toast = document.getElementById('adminToast');
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function restoreViewState(route) {
    if (route !== 'settings') return;

    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    } catch (error) {}
    if (!saved) return;

    const form = document.getElementById('settingsForm');
    Object.entries(saved).forEach(([name, value]) => {
      const field = form?.elements.namedItem(name);
      if (!field) return;
      if (field.type === 'checkbox') field.checked = Boolean(value);
      else field.value = value;
    });
  }

  function renderBackendStatus() {
    const status = getSupabaseStatus();
    const label = status.connected ? 'Supabase bağlı' : 'Supabase';
    const value = status.connected ? 'Hazır' : 'Bekliyor';

    document.getElementById('backendStatusDot')?.classList.toggle('warning', !status.connected);
    if (document.getElementById('backendStatusLabel')) {
      document.getElementById('backendStatusLabel').textContent = label;
    }
    if (document.getElementById('backendStatusValue')) {
      document.getElementById('backendStatusValue').textContent = value;
    }

    document.querySelectorAll('[data-backend-dot]').forEach(dot => {
      dot.classList.toggle('warning', !status.connected);
    });
    document.querySelectorAll('[data-backend-value]').forEach(item => {
      item.textContent = value;
    });

    const badge = document.getElementById('supabaseConnectionBadge');
    if (badge) {
      badge.textContent = status.connected ? 'Bağlı' : 'Bekliyor';
      badge.classList.toggle('published', status.connected);
      badge.classList.toggle('draft', !status.connected);
    }

    if (document.getElementById('supabaseProjectUrl')) {
      document.getElementById('supabaseProjectUrl').textContent =
        status.configured ? new URL(supabaseConfig.url).hostname : 'Yapılandırılmadı';
      document.getElementById('supabaseKeyType').textContent =
        status.configured ? 'Publishable key' : 'Publishable key bekleniyor';
      document.getElementById('supabaseSchema').textContent = supabaseConfig.schema;
      document.getElementById('supabaseRealtime').textContent =
        supabaseConfig.realtime.channelPrefix;
    }
  }

  function saveSettings() {
    const form = document.getElementById('settingsForm');
    if (!form) return;

    const settings = {};
    Array.from(form.elements).forEach(field => {
      if (!field.name) return;
      settings[field.name] = field.type === 'checkbox' ? field.checked : field.value;
    });

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      showToast('Ayarlar yerel olarak kaydedildi.');
    } catch (error) {
      showToast('Ayarlar kaydedilemedi.');
    }
  }

  function filterCurrentView(query) {
    const normalized = query.trim().toLocaleLowerCase('tr');
    const items = document.querySelectorAll('#adminView tbody tr, #adminView .ad-slot-card, #adminView .translation-row');

    items.forEach(item => {
      item.classList.toggle('is-hidden', Boolean(normalized) && !item.textContent.toLocaleLowerCase('tr').includes(normalized));
    });
  }

  function filterNews(status, button) {
    document.querySelectorAll('[data-filter-status]').forEach(item => item.classList.toggle('active', item === button));
    document.querySelectorAll('.manager-table tbody tr').forEach(row => {
      row.classList.toggle('is-hidden', status !== 'all' && row.dataset.status !== status);
    });
  }

  function translationRecord(contentKey, locale) {
    return translationState.records.find(record =>
      record.content_key === contentKey && record.locale === locale
    );
  }

  function translationGroups() {
    const groups = new Map();
    translationState.records.forEach(record => {
      if (!groups.has(record.content_key)) {
        groups.set(record.content_key, {
          contentKey: record.content_key,
          section: record.section,
          contentType: record.content_type
        });
      }
    });
    return [...groups.values()].sort((a, b) => a.contentKey.localeCompare(b.contentKey));
  }

  function recordStatus(group) {
    const records = translationState.languages.map(language =>
      translationRecord(group.contentKey, language.code)
    );
    if (records.some(record => !record || !record.value.trim())) return 'missing';
    if (records.some(record => record.status === 'review')) return 'review';
    return 'published';
  }

  function renderTranslationSummary() {
    const summary = document.getElementById('translationSummary');
    if (!summary) return;
    const groups = translationGroups();

    summary.replaceChildren(...translationState.languages.map(language => {
      const completed = groups.filter(group => translationRecord(group.contentKey, language.code)?.value.trim()).length;
      const percent = groups.length ? Math.round((completed / groups.length) * 100) : 0;
      const article = document.createElement('article');
      const name = document.createElement('span');
      const value = document.createElement('strong');
      const progress = document.createElement('div');
      const bar = document.createElement('i');
      const detail = document.createElement('small');
      name.textContent = language.native_name;
      value.textContent = `%${percent}`;
      progress.className = 'progress';
      bar.style.width = `${percent}%`;
      detail.textContent = `${completed} / ${groups.length} metin`;
      progress.append(bar);
      article.append(name, value, progress, detail);
      return article;
    }));
  }

  function renderTranslationSections() {
    const select = document.getElementById('translationSectionFilter');
    if (!select) return;
    const sections = [...new Set(translationState.records.map(record => record.section))].sort();
    select.replaceChildren();
    select.add(new Option('Tüm bölümler', 'all'));
    sections.forEach(section => select.add(new Option(section, section)));
    select.value = translationState.section;
  }

  function createTranslationRow(group) {
    const status = recordStatus(group);
    const row = document.createElement('div');
    row.className = 'translation-row';
    row.dataset.translationStatus = status;
    row.dataset.translationSection = group.section;
    row.dataset.contentKey = group.contentKey;

    const key = document.createElement('div');
    key.className = 'translation-key';
    const strong = document.createElement('strong');
    strong.textContent = group.contentKey;
    const badge = document.createElement('span');
    badge.className = `status-badge ${status === 'missing' ? 'draft' : status}`;
    badge.textContent = status === 'missing' ? 'Eksik' : status === 'review' ? 'Kontrol' : 'Tamamlandı';
    key.append(strong, badge);
    row.append(key);

    translationState.languages.forEach(language => {
      const record = translationRecord(group.contentKey, language.code);
      const label = document.createElement('label');
      const caption = document.createElement('span');
      caption.textContent = language.short_label || language.code.toUpperCase();
      const textarea = document.createElement('textarea');
      textarea.value = record?.value || '';
      textarea.dataset.locale = language.code;
      textarea.dataset.contentType = record?.content_type || group.contentType || 'html';
      textarea.dataset.status = record?.status || 'draft';
      textarea.dataset.section = record?.section || group.section;
      textarea.placeholder = 'Çeviri bekleniyor';
      textarea.addEventListener('input', () => row.classList.add('is-dirty'));
      label.append(caption, textarea);
      row.append(label);
    });
    return row;
  }

  function applyTranslationFilters() {
    document.querySelectorAll('#translationList .translation-row').forEach(row => {
      const statusMatches = translationState.filter === 'all' ||
        row.dataset.translationStatus === translationState.filter;
      const sectionMatches = translationState.section === 'all' ||
        row.dataset.translationSection === translationState.section;
      row.classList.toggle('is-hidden', !statusMatches || !sectionMatches);
    });
  }

  function renderTranslations() {
    const list = document.getElementById('translationList');
    if (!list) return;
    list.replaceChildren(...translationGroups().map(createTranslationRow));
    renderTranslationSummary();
    renderTranslationSections();
    applyTranslationFilters();
  }

  async function loadTranslations() {
    if (!getSupabaseStatus().connected) {
      document.getElementById('translationList').innerHTML =
        '<div class="view-loading">Supabase bağlantısı yapılandırıldığında çeviriler burada görünecek.</div>';
      return;
    }

    const [languagesTable, translationsTable] = await Promise.all([
      supabaseServices.database.table('languages'),
      supabaseServices.database.table('translations')
    ]);
    const [{ data: languages, error: languageError }, { data: records, error: translationError }] =
      await Promise.all([
        languagesTable.select('*').order('sort_order'),
        translationsTable.select('*').order('content_key')
      ]);
    if (languageError) throw languageError;
    if (translationError) throw translationError;
    translationState.languages = languages || [];
    translationState.records = records || [];
    renderTranslations();
  }

  async function saveTranslations() {
    if (!getSupabaseStatus().connected) {
      showToast('Supabase bağlantısı bekleniyor.');
      return;
    }
    const rows = [...document.querySelectorAll('#translationList .translation-row.is-dirty')];
    if (!rows.length) {
      showToast('Kaydedilecek değişiklik yok.');
      return;
    }

    const updates = rows.flatMap(row =>
      [...row.querySelectorAll('textarea')].map(textarea => ({
        content_key: row.dataset.contentKey,
        locale: textarea.dataset.locale,
        section: textarea.dataset.section,
        content_type: textarea.dataset.contentType,
        status: textarea.value.trim() ? 'published' : 'draft',
        value: textarea.value
      }))
    );
    const table = await supabaseServices.database.table('translations');
    const { error } = await table.upsert(updates, { onConflict: 'content_key,locale' });
    if (error) throw error;
    rows.forEach(row => row.classList.remove('is-dirty'));
    showToast('Çeviriler kaydedildi ve siteye canlı aktarıldı.');
    await loadTranslations();
  }

  async function addLanguage(form) {
    if (!getSupabaseStatus().connected) {
      showToast('Supabase bağlantısı bekleniyor.');
      return;
    }
    const values = Object.fromEntries(new FormData(form));
    const code = values.code.trim().toLocaleLowerCase('en');
    const table = await supabaseServices.database.table('languages');
    const { error } = await table.upsert({
      code,
      name: values.name.trim(),
      native_name: values.native_name.trim(),
      short_label: code.toUpperCase(),
      html_code: values.html_code.trim(),
      enabled: true,
      sort_order: (translationState.languages.length + 1) * 10
    }, { onConflict: 'code' });
    if (error) throw error;
    form.reset();
    showToast('Dil eklendi.');
    await loadTranslations();
  }

  async function initializeTranslations() {
    await loadTranslations();
    document.getElementById('translationSectionFilter')?.addEventListener('change', event => {
      translationState.section = event.target.value;
      applyTranslationFilters();
    });
    document.getElementById('languageForm')?.addEventListener('submit', event => {
      event.preventDefault();
      addLanguage(event.currentTarget).catch(() => showToast('Dil eklenemedi.'));
    });

    if (getSupabaseStatus().connected) {
      translationChannel = await supabaseServices.realtime.subscribe({
        channel: 'turkua-admin-translations',
        table: supabaseConfig.resources.tables.translations
      }, () => {
        if (currentRoute === 'translations') loadTranslations().catch(() => {});
      });
    }
  }

  async function initializeRoute(route) {
    if (activeManager) {
      await activeManager.destroy();
      activeManager = null;
    }
    if (translationChannel && route !== 'translations') {
      await supabaseServices.realtime.removeChannel(translationChannel);
      translationChannel = null;
    }
    if (route === 'translations') await initializeTranslations();
    const managerContext = {
      services: supabaseServices,
      config: supabaseConfig,
      isConnected: () => getSupabaseStatus().connected,
      showToast
    };
    if (route === 'news') {
      activeManager = createNewsManager(managerContext);
      await activeManager.mount();
    }
    if (route === 'ads') {
      activeManager = createAdsManager(managerContext);
      await activeManager.mount();
    }
    if (route === 'applications') {
      activeManager = createApplicationsManager(managerContext);
      await activeManager.mount();
    }
    if (route === 'hero') {
      activeManager = createHeroManager(managerContext);
      await activeManager.mount();
    }
    if (route === 'tracker') {
      activeManager = createTrackerManager(managerContext);
      await activeManager.mount();
    }
    if (route === 'contact') {
      activeManager = createContactManager(managerContext);
      await activeManager.mount();
    }
    if (route === 'sponsors') {
      activeManager = createSponsorsManager(managerContext);
      await activeManager.mount();
    }
    if (route === 'media') {
      activeManager = createMediaManager(managerContext);
      await activeManager.mount();
    }
  }

  async function handleAction(action) {
    const messages = {
      refresh: 'Panel verileri yenilendi.',
      'new-news': 'Yeni haber düzenleyici altyapısı hazır.',
      'new-ad': 'Yeni reklam formu altyapısı hazır.',
      edit: 'Düzenleme görünümü veri katmanına bağlanmaya hazır.',
      bulk: 'Toplu işlem altyapısı hazır.',
      save: 'Çeviri değişiklikleri yerel olarak kaydedildi.'
    };

    if (action === 'save-settings') {
      saveSettings();
      return;
    }
    if (action === 'save-translations') {
      try {
        await saveTranslations();
      } catch (error) {
        showToast('Çeviriler kaydedilemedi.');
      }
      return;
    }
    if (action === 'preview') {
      window.open('../index.html', '_blank', 'noopener');
      return;
    }
    showToast(messages[action] || 'İşlem tamamlandı.');
  }

  function bindEvents() {
    document.addEventListener('click', event => {
      const routeButton = event.target.closest('[data-view], [data-route]');
      if (routeButton) {
        const route = routeButton.dataset.view || routeButton.dataset.route;
        if (routes[route]) loadView(route, true);
        return;
      }

      const translationFilter = event.target.closest('[data-translation-filter]');
      if (translationFilter) {
        translationState.filter = translationFilter.dataset.translationFilter;
        document.querySelectorAll('[data-translation-filter]').forEach(button =>
          button.classList.toggle('active', button === translationFilter)
        );
        applyTranslationFilters();
        return;
      }

      const filterButton = event.target.closest('[data-filter-status]');
      if (filterButton) {
        filterNews(filterButton.dataset.filterStatus, filterButton);
        return;
      }

      const actionButton = event.target.closest('[data-action]');
      if (actionButton) handleAction(actionButton.dataset.action);
    });

    document.getElementById('mobileMenuButton').addEventListener('click', openSidebar);
    document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);
    document.getElementById('logoutButton').addEventListener('click', async () => {
      if (getSupabaseStatus().connected) {
        await supabaseServices.auth.signOut();
      }
      window.location.href = 'login.html';
    });
    document.getElementById('adminSearch').addEventListener('input', event => filterCurrentView(event.target.value));
    window.addEventListener('hashchange', () => loadView(routeFromHash(), false));
  }

  async function start() {
    try {
      await supabaseReady;
      const status = getSupabaseStatus();

      if (!status.connected) {
        window.location.replace('login.html');
        return;
      }
      const { data } = await supabaseServices.auth.getSession();
      if (!data.session) {
        window.location.replace('login.html');
        return;
      }

      await mountSharedComponents();
      bindEvents();
      await loadView(routeFromHash(), false);
    } catch (error) {
      document.getElementById('adminView').innerHTML = '<div class="view-loading">Panel başlatılamadı.</div>';
    }
  }

  start();
})();
