import { createMetric, escapeHtml, localDateTime } from './utils.js';
import {
  bindMediaDropZone,
  deleteManagedMediaByPath,
  uploadManagedMedia
} from './media-tools.js';

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'haber';
}

export function createNewsManager({ services, config, isConnected, showToast }) {
  const state = {
    languages: [],
    categories: [],
    records: [],
    selected: null,
    statusFilter: 'all',
    categoryFilter: 'all',
    channels: []
  };

  function categoryName(category) {
    return category?.localizations?.find(item => item.locale === 'tr')?.name || category?.code || '';
  }

  function newsTitle(item, locale = 'tr') {
    return item.localizations?.find(localization => localization.locale === locale)?.title ||
      item.localizations?.[0]?.title || '';
  }

  function statusOf(item) {
    const now = Date.now();
    if (item.status === 'draft') return 'draft';
    if (new Date(item.published_at).getTime() > now) return 'scheduled';
    return item.is_live ? 'live' : 'published';
  }

  function renderMetrics() {
    const target = document.getElementById('newsMetrics');
    if (!target) return;
    const published = state.records.filter(item => item.status === 'published').length;
    const live = state.records.filter(item => item.is_live && item.status === 'published').length;
    const featured = state.records.filter(item => item.is_featured).length;
    target.replaceChildren(
      createMetric('Toplam haber', state.records.length, 'Tüm kayıtlar'),
      createMetric('Yayında', published, 'Planlananlar dahil'),
      createMetric('Canlı', live, 'Canlı akış etiketi'),
      createMetric('Öne çıkan', featured, 'Vitrin haberleri')
    );
  }

  function renderCategories() {
    const editor = document.getElementById('newsCategory');
    const filter = document.getElementById('newsCategoryFilter');
    if (editor) {
      editor.replaceChildren(...state.categories.map(category =>
        new Option(categoryName(category), category.id)
      ));
    }
    if (filter) {
      filter.replaceChildren(new Option('Tüm kategoriler', 'all'), ...state.categories.map(category =>
        new Option(categoryName(category), category.id)
      ));
      filter.value = state.categoryFilter;
    }
  }

  function renderLocaleFields() {
    const target = document.getElementById('newsLocaleFields');
    if (!target) return;
    target.replaceChildren(...state.languages.map(language => {
      const localization = state.selected?.localizations?.find(item => item.locale === language.code);
      const section = document.createElement('section');
      section.className = 'locale-section';
      section.innerHTML = `
        <div class="locale-heading"><strong>${escapeHtml(language.native_name)}</strong><span>${escapeHtml(language.code.toUpperCase())}</span></div>
        <div class="form-grid">
          <label class="field full"><span>Başlık</span><input name="title__${escapeHtml(language.code)}" value="${escapeHtml(localization?.title)}"></label>
          <label class="field full"><span>Özet</span><textarea name="summary__${escapeHtml(language.code)}">${escapeHtml(localization?.summary)}</textarea></label>
          <label class="field full"><span>Haber metni</span><textarea class="body-editor" name="body__${escapeHtml(language.code)}">${escapeHtml(localization?.body)}</textarea></label>
        </div>`;
      return section;
    }));
  }

  function renderImagePreview(url) {
    const preview = document.getElementById('newsImagePreview');
    if (!preview) return;
    preview.classList.toggle('is-hidden', !url);
    preview.style.backgroundImage = url ? `url("${url}")` : '';
  }

  function renderTable() {
    const body = document.getElementById('newsTableBody');
    if (!body) return;
    const filtered = state.records.filter(item => {
      const statusMatches = state.statusFilter === 'all' ||
        (state.statusFilter === 'published' ? item.status === 'published' : statusOf(item) === state.statusFilter);
      const categoryMatches = state.categoryFilter === 'all' || item.category_id === state.categoryFilter;
      return statusMatches && categoryMatches;
    });

    if (!filtered.length) {
      body.innerHTML = '<tr><td colspan="6"><div class="view-loading">Bu filtrede haber bulunmuyor.</div></td></tr>';
      return;
    }

    body.replaceChildren(...filtered.map(item => {
      const row = document.createElement('tr');
      const status = statusOf(item);
      const badgeClass = status === 'draft' ? 'draft' : status === 'scheduled' ? 'review' : 'published';
      const badgeText = status === 'draft' ? 'Taslak' : status === 'scheduled' ? 'Planlandı' : status === 'live' ? 'Canlı' : 'Yayında';
      const traits = [item.is_featured ? 'Öne çıkan' : '', item.is_live ? 'Canlı' : ''].filter(Boolean).join(' · ') || '-';
      row.dataset.status = status;
      row.innerHTML = `
        <td><strong>${escapeHtml(newsTitle(item))}</strong><small>${escapeHtml(item.slug)}</small></td>
        <td>${escapeHtml(categoryName(item.category))}</td>
        <td>${escapeHtml(traits)}</td>
        <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
        <td>${new Date(item.published_at).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}</td>
        <td><button class="row-action" type="button" data-news-action="edit" data-news-id="${item.id}">Düzenle</button></td>`;
      return row;
    }));
  }

  function render() {
    renderMetrics();
    renderCategories();
    renderTable();
  }

  async function load() {
    if (!isConnected()) {
      document.getElementById('newsTableBody').innerHTML =
        '<tr><td colspan="6"><div class="view-loading">Supabase bağlantısı yapılandırıldığında haberler burada görünecek.</div></td></tr>';
      renderMetrics();
      return;
    }

    const [languagesTable, categoriesTable, newsTable] = await Promise.all([
      services.database.table('languages'),
      services.database.table('newsCategories'),
      services.database.table('news')
    ]);
    const [languagesResult, categoriesResult, newsResult] = await Promise.all([
      languagesTable.select('*').eq('enabled', true).order('sort_order'),
      categoriesTable.select('*, localizations:news_category_localizations(*)').eq('enabled', true).order('sort_order'),
      newsTable.select('*, category:news_categories(*, localizations:news_category_localizations(*)), localizations:news_localizations(*)').order('published_at', { ascending: false })
    ]);
    const error = languagesResult.error || categoriesResult.error || newsResult.error;
    if (error) throw error;
    state.languages = languagesResult.data || [];
    state.categories = categoriesResult.data || [];
    state.records = newsResult.data || [];
    render();
  }

  function openEditor(item = null) {
    state.selected = item;
    const form = document.getElementById('newsForm');
    form.reset();
    form.elements.id.value = item?.id || '';
    form.elements.image_path.value = item?.image_path || '';
    form.elements.image_url.value = item?.image_url || '';
    form.elements.category_id.value = item?.category_id || state.categories[0]?.id || '';
    form.elements.status.value = item?.status || 'draft';
    form.elements.published_at.value = localDateTime(item?.published_at || new Date());
    form.elements.source_url.value = item?.source_url || '';
    form.elements.is_featured.checked = Boolean(item?.is_featured);
    form.elements.is_live.checked = Boolean(item?.is_live);
    document.getElementById('newsEditorTitle').textContent = item ? 'Haberi düzenle' : 'Yeni haber';
    document.getElementById('deleteNewsButton').classList.toggle('is-hidden', !item);
    renderLocaleFields();
    renderImagePreview(item?.image_url);
    document.getElementById('newsEditor').classList.remove('is-hidden');
    document.getElementById('newsEditor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeEditor() {
    state.selected = null;
    document.getElementById('newsEditor')?.classList.add('is-hidden');
  }

  async function uploadImage(file, id, altText) {
    if (!file?.size) return null;
    return uploadManagedMedia({
      services,
      file,
      bucketName: 'media',
      folder: `news/${id}`,
      altText
    });
  }

  async function save(event) {
    event.preventDefault();
    if (!isConnected()) return showToast('Supabase bağlantısı bekleniyor.');
    const form = event.currentTarget;
    const id = form.elements.id.value || crypto.randomUUID();
    const titles = Object.fromEntries(state.languages.map(language => [
      language.code,
      form.elements[`title__${language.code}`]?.value.trim() || ''
    ]));
    const primaryTitle = titles.tr || Object.values(titles).find(Boolean);
    if (!primaryTitle) return showToast('En az bir dilde haber başlığı girin.');

    const oldImagePath = form.elements.image_path.value;
    let imagePath = oldImagePath || null;
    let imageUrl = form.elements.image_url.value || null;
    const uploaded = await uploadImage(form.elements.image.files[0], id, primaryTitle);
    if (uploaded) {
      imagePath = uploaded.object_path;
      imageUrl = uploaded.public_url;
    }

    const newsTable = await services.database.table('news');
    const slug = state.selected?.slug || `${slugify(primaryTitle)}-${id.slice(0, 8)}`;
    const payload = {
      id,
      slug,
      category_id: form.elements.category_id.value,
      status: form.elements.status.value,
      published_at: new Date(form.elements.published_at.value).toISOString(),
      source_url: form.elements.source_url.value.trim() || null,
      image_path: imagePath,
      image_url: imageUrl,
      is_featured: form.elements.is_featured.checked,
      is_live: form.elements.is_live.checked
    };
    const { error: newsError } = await newsTable.upsert(payload, { onConflict: 'id' });
    if (newsError) throw newsError;

    const localizationTable = await services.database.table('newsLocalizations');
    const localizations = state.languages.map(language => ({
      news_id: id,
      locale: language.code,
      title: titles[language.code],
      summary: form.elements[`summary__${language.code}`]?.value.trim() || '',
      body: form.elements[`body__${language.code}`]?.value.trim() || ''
    }));
    const { error: localizationError } = await localizationTable.upsert(localizations, {
      onConflict: 'news_id,locale'
    });
    if (localizationError) throw localizationError;
    if (uploaded && oldImagePath) {
      await deleteManagedMediaByPath(services, 'media', oldImagePath);
    }

    showToast('Haber kaydedildi ve yayın akışı güncellendi.');
    closeEditor();
    await load();
  }

  async function removeSelected() {
    if (!state.selected || !window.confirm('Bu haber kalıcı olarak silinsin mi?')) return;
    const table = await services.database.table('news');
    const { error } = await table.delete().eq('id', state.selected.id);
    if (error) throw error;
    if (state.selected.image_path) {
      await deleteManagedMediaByPath(services, 'media', state.selected.image_path);
    }
    showToast('Haber silindi.');
    closeEditor();
    await load();
  }

  async function subscribe() {
    if (!isConnected()) return;
    for (const resource of ['news', 'newsLocalizations']) {
      state.channels.push(await services.realtime.subscribe({
        channel: `turkua-admin-${resource}`,
        table: config.resources.tables[resource]
      }, () => load().catch(() => {})));
    }
  }

  function bind() {
    const root = document.querySelector('[data-view-root="news"]');
    root.addEventListener('click', event => {
      const action = event.target.closest('[data-news-action]');
      if (!action) return;
      if (action.dataset.newsAction === 'new') openEditor();
      if (action.dataset.newsAction === 'close') closeEditor();
      if (action.dataset.newsAction === 'edit') {
        openEditor(state.records.find(item => item.id === action.dataset.newsId));
      }
      if (action.dataset.newsAction === 'delete') {
        removeSelected().catch(() => showToast('Haber silinemedi.'));
      }
    });
    root.addEventListener('click', event => {
      const filter = event.target.closest('[data-news-filter]');
      if (!filter) return;
      state.statusFilter = filter.dataset.newsFilter;
      root.querySelectorAll('[data-news-filter]').forEach(button =>
        button.classList.toggle('active', button === filter)
      );
      renderTable();
    });
    document.getElementById('newsCategoryFilter').addEventListener('change', event => {
      state.categoryFilter = event.target.value;
      renderTable();
    });
    document.getElementById('newsForm').addEventListener('submit', event => {
      save(event).catch(() => showToast('Haber kaydedilemedi.'));
    });
    bindMediaDropZone({
      zone: document.getElementById('newsDropZone'),
      input: document.querySelector('#newsForm [name="image"]'),
      showToast,
      onFile: file => renderImagePreview(URL.createObjectURL(file))
    });
  }

  return {
    async mount() {
      bind();
      await load();
      await subscribe();
    },
    async destroy() {
      await Promise.all(state.channels.map(channel => services.realtime.removeChannel(channel)));
      state.channels = [];
    }
  };
}
