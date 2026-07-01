import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import * as cheerio from 'cheerio';
import { minify as minifyHtml } from 'html-minifier-terser';
import { transform } from 'lightningcss';
import { PurgeCSS } from 'purgecss';
import sharp from 'sharp';
import { minify as minifyJs } from 'terser';

const root = process.cwd();
const fromRoot = (...parts) => path.join(root, ...parts);

const componentNames = [
  'header', 'hero', 'ads', 'gundem', 'news', 'education', 'visa', 'trade',
  'money', 'shop', 'legal', 'sponsored', 'footer', 'contact', 'mobile-nav',
  'tracker'
];

const cssFiles = [
  'foundation.css', 'tracker.css', 'sections.css', 'shell.css', 'ads.css',
  'news.css', 'shop.css', 'legal.css', 'theme.css', 'polish.css',
  'responsive.css', 'mobile.css', 'accessibility.css'
];

const coreScripts = [
  'content.js', 'cms-service.js', 'hero-effects.js', 'tracker.js', 'navigation.js', 'ads.js',
  'section-observer.js'
];

const liveScripts = [
  'news-service.js', 'ad-service.js', 'gundem.js'
];

const serviceScripts = [
  'submissions.js', 'rates.js', 'shop.js'
];

const siteScripts = [...coreScripts, ...liveScripts, ...serviceScripts];

const runtimeHeader = `
(function() {
  const readyEvent = 'turkua:ready';
  const state = { ready: false };
  const scriptUrl = document.currentScript?.src;
  const scriptBase = scriptUrl
    ? new URL('.', scriptUrl)
    : new URL('./assets/js/', document.baseURI);
  const featureFiles = {
    live: new URL('live.min.js?v=20260701-28', scriptBase).href,
    services: new URL('services.min.js?v=20260701-28', scriptBase).href
  };
  const featurePromises = new Map();
  const htmlEscapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function loadFeature(name) {
    if (!featureFiles[name]) return Promise.reject(new Error('Unknown feature bundle.'));
    if (featurePromises.has(name)) return featurePromises.get(name);

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = featureFiles[name];
      script.async = true;
      script.dataset.turkuaFeature = name;
      script.onload = () => resolve(true);
      script.onerror = () => {
        featurePromises.delete(name);
        script.remove();
        reject(new Error('Feature bundle could not be loaded.'));
      };
      document.head.append(script);
    });
    featurePromises.set(name, promise);
    return promise;
  }

  function loadWhenNear(name, selectors, rootMargin) {
    const targets = selectors.map(selector => document.querySelector(selector)).filter(Boolean);
    if (!targets.length) return;
    if (!('IntersectionObserver' in window)) {
      loadFeature(name).catch(() => {});
      return;
    }

    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      loadFeature(name).catch(() => {});
    }, { rootMargin });
    targets.forEach(target => observer.observe(target));
  }

  function scheduleFeatures() {
    loadWhenNear('live', ['#gundem'], '420px 0px');
    loadWhenNear('services', ['#money', '#shop'], '900px 0px');
    const loadLive = () => loadFeature('live').catch(() => {});
    setTimeout(() => {
      if ('requestIdleCallback' in window) requestIdleCallback(loadLive, { timeout: 1200 });
      else loadLive();
    }, 1800);
  }

  window.Turkua = {
    escapeHtml(value) {
      return String(value ?? '').replace(/[&<>"']/g, character => htmlEscapes[character]);
    },
    safeUrl(value) {
      try {
        const input = String(value ?? '').trim();
        if (!input) return '';
        const reference = input.startsWith('/') && !input.startsWith('//')
          ? input.slice(1)
          : input;
        const url = new URL(reference, document.baseURI);
        const allowed = ['http:', 'https:'].includes(url.protocol)
          || (url.protocol === 'file:' && window.location.protocol === 'file:');
        return allowed ? url.href : '';
      } catch {
        return '';
      }
    },
    loadFeature,
    async runFeature(name, functionName, ...args) {
      await loadFeature(name);
      const callback = window[functionName];
      if (typeof callback !== 'function') throw new Error('Feature function is unavailable.');
      return callback(...args);
    },
    onReady(callback) {
      if (state.ready) {
        queueMicrotask(callback);
        return;
      }
      window.addEventListener(readyEvent, callback, { once: true });
    },
    start() {
      if (state.ready) return;
      state.ready = true;
      window.dispatchEvent(new Event(readyEvent));
      scheduleFeatures();
      if (window.location.hash) {
        requestAnimationFrame(() => {
          const target = document.querySelector(window.location.hash);
          if (target) target.scrollIntoView();
        });
      }
    }
  };
})();`;

async function buildHtml() {
  const [template, seedJson] = await Promise.all([
    readFile(fromRoot('index.template.html'), 'utf8'),
    readFile(fromRoot('assets/content/tr.seed.json'), 'utf8')
  ]);
  const seed = JSON.parse(seedJson);
  const components = new Map(await Promise.all(componentNames.map(async name => [
    name,
    await readFile(fromRoot('assets/components', `${name}.html`), 'utf8')
  ])));
  const $ = cheerio.load(template, { xml: false });

  while ($('[data-component]').length) {
    $('[data-component]').each((_, element) => {
      const name = $(element).attr('data-component');
      const markup = components.get(name);
      if (markup == null) throw new Error(`Unknown component: ${name}`);
      $(element).replaceWith(markup);
    });
  }

  $('[data-content-key]').each((_, element) => {
    const node = $(element);
    const locale = node.attr('data-locale');
    if (locale && locale !== 'tr') {
      node.attr('hidden', '');
      return;
    }
    const record = seed[node.attr('data-content-key')];
    if (!record) return;
    const attribute = node.attr('data-content-attr');
    if (attribute) node.attr(attribute, record.value);
    else if (record.type === 'html') node.html(record.value);
    else node.text(record.value);
  });

  $('button:not([type])').attr('type', 'button');
  $('img').each((_, element) => {
    const image = $(element);
    if (!image.attr('loading')) image.attr('loading', 'lazy');
    if (!image.attr('decoding')) image.attr('decoding', 'async');
  });
  $('input, textarea, select').each((_, element) => {
    const field = $(element);
    if (field.attr('aria-label') || field.attr('aria-labelledby')) return;
    const id = field.attr('id');
    if (id && $(`label[for="${id}"]`).length) return;
    const placeholder = field.attr('placeholder');
    if (placeholder) field.attr('aria-label', placeholder);
  });
  $('a[target="_blank"]').each((_, element) => {
    const link = $(element);
    const rel = new Set((link.attr('rel') || '').split(/\s+/).filter(Boolean));
    rel.add('noopener');
    rel.add('noreferrer');
    link.attr('rel', [...rel].join(' '));
  });

  const output = await minifyHtml($.html(), {
    collapseWhitespace: true,
    conservativeCollapse: true,
    removeComments: true,
    removeRedundantAttributes: false,
    sortAttributes: false,
    sortClassName: false,
    minifyCSS: false,
    minifyJS: false
  });
  await writeFile(fromRoot('index.html'), `${output}\n`);
}

async function buildCss() {
  const source = (await Promise.all(cssFiles.map(file =>
    readFile(fromRoot('assets/css', file), 'utf8')
  ))).join('\n');
  const contentFiles = [
    'index.template.html',
    ...componentNames.map(name => `assets/components/${name}.html`),
    ...siteScripts.map(file => `assets/js/${file}`),
    'assets/content/tr.seed.json',
    'data.js',
    'shop-data.js'
  ];
  const content = await Promise.all(contentFiles.map(async file => ({
    raw: await readFile(fromRoot(file), 'utf8'),
    extension: path.extname(file).slice(1)
  })));
  const [purged] = await new PurgeCSS().purge({
    content,
    css: [{ raw: source }],
    rejected: true,
    safelist: {
      standard: [
        /^(active|open|show|warning|positive|negative|neutral|featured|soon)$/,
        /^(has-photo|has-live-ad|is-hidden|parliamentary|diplomatic)$/,
        /^(military|humanitarian|economic|general|published|draft|review)$/,
        /^managed-/
      ],
      deep: [/^managed-/]
    }
  });
  const result = transform({
    filename: 'style.css',
    code: Buffer.from(purged.css),
    minify: true,
    sourceMap: false
  });
  await writeFile(fromRoot('assets/css/style.min.css'), result.code);
  return { removedSelectors: purged.rejected.length };
}

async function minifyJavaScript(source, filename) {
  const result = await minifyJs(source, {
    compress: { passes: 2, drop_console: true },
    mangle: true,
    format: { comments: false, ascii_only: false }
  });
  if (!result.code) throw new Error(`Could not minify ${filename}`);
  return result.code;
}

async function buildJavaScript() {
  const coreSource = [
    runtimeHeader,
    ...(await Promise.all(coreScripts.map(file =>
      readFile(fromRoot('assets/js', file), 'utf8')
    ))),
    'window.Turkua.start();'
  ].join('\n');
  const liveSource = (await Promise.all(liveScripts.map(file =>
    readFile(fromRoot('assets/js', file), 'utf8')
  ))).join('\n');
  const serviceSource = [
    await readFile(fromRoot('shop-data.js'), 'utf8'),
    ...(await Promise.all(serviceScripts.map(file =>
      readFile(fromRoot('assets/js', file), 'utf8')
    )))
  ].join('\n');
  const [site, live, services, data] = await Promise.all([
    minifyJavaScript(coreSource, 'site.min.js'),
    minifyJavaScript(liveSource, 'live.min.js'),
    minifyJavaScript(serviceSource, 'services.min.js'),
    readFile(fromRoot('data.js'), 'utf8').then(value => minifyJavaScript(value, 'data.min.js')),
  ]);
  await Promise.all([
    writeFile(fromRoot('assets/js/site.min.js'), site),
    writeFile(fromRoot('assets/js/live.min.js'), live),
    writeFile(fromRoot('assets/js/services.min.js'), services),
    writeFile(fromRoot('data.min.js'), data)
  ]);
}

function iconSvg(size) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="88" fill="#07090f"/>
    <rect x="54" y="54" width="24" height="404" fill="#e30a17"/>
    <rect x="434" y="54" width="24" height="202" fill="#005bbb"/>
    <rect x="434" y="256" width="24" height="202" fill="#ffd500"/>
    <text x="256" y="328" text-anchor="middle" fill="#f3f7fb" font-family="Arial, sans-serif" font-size="210" font-weight="800">T</text>
  </svg>`);
}

async function buildImages() {
  await mkdir(fromRoot('assets/img'), { recursive: true });
  const socialSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#07090f"/>
    <rect x="0" y="0" width="24" height="630" fill="#e30a17"/>
    <rect x="1176" y="0" width="24" height="315" fill="#005bbb"/>
    <rect x="1176" y="315" width="24" height="315" fill="#ffd500"/>
    <text x="90" y="275" fill="#f3f7fb" font-family="Arial, sans-serif" font-size="136" font-weight="800">TürkUA</text>
    <text x="96" y="365" fill="#6bc7ff" font-family="Arial, sans-serif" font-size="38" font-weight="600">TÜRKİYE &amp; UKRAYNA BİLGİ MERKEZİ</text>
    <text x="96" y="445" fill="#c7d1df" font-family="Arial, sans-serif" font-size="30">Gündem · Eğitim · Vize · Ticaret · Para Transferi</text>
  </svg>`);
  await Promise.all([
    sharp(iconSvg(192)).png({ compressionLevel: 9 }).toFile(fromRoot('assets/img/icon-192.png')),
    sharp(iconSvg(512)).png({ compressionLevel: 9 }).toFile(fromRoot('assets/img/icon-512.png')),
    sharp(socialSvg).jpeg({ quality: 86, mozjpeg: true }).toFile(fromRoot('assets/img/social-card.jpg'))
  ]);
}

const [, cssReport] = await Promise.all([
  buildHtml(),
  buildCss(),
  buildJavaScript(),
  buildImages()
]);

const sizes = await Promise.all([
  'index.html',
  'assets/css/style.min.css',
  'assets/js/site.min.js',
  'assets/js/live.min.js',
  'assets/js/services.min.js',
  'assets/img/social-card.jpg'
].map(async file => [file, (await readFile(fromRoot(file))).byteLength]));

console.log([
  ...sizes.map(([file, bytes]) => `${file}: ${(bytes / 1024).toFixed(1)} KB`),
  `Unused CSS selectors removed: ${cssReport.removedSelectors}`
].join('\n'));
