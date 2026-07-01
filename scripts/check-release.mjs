import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import * as cheerio from 'cheerio';

const root = process.cwd();
const dist = path.join(root, 'dist');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  }));
  return nested.flat();
}

function isExternal(reference) {
  return /^(?:[a-z]+:|\/\/|#)/i.test(reference);
}

function isRootRelative(reference) {
  return reference.startsWith('/') && !reference.startsWith('//');
}

function resolveReference(htmlFile, reference) {
  const clean = reference.split(/[?#]/)[0];
  if (!clean || isExternal(clean)) return null;
  if (clean === '/') return path.join(dist, 'index.html');
  if (clean.startsWith('/')) return path.join(dist, clean.slice(1));
  return path.resolve(path.dirname(htmlFile), clean);
}

const requiredFiles = [
  'index.html',
  'assets/css/style.min.css',
  'assets/js/site.min.js',
  'assets/js/live.min.js',
  'assets/js/services.min.js',
  'assets/js/supabase/index.js',
  'admin/index.html',
  'admin/login.html',
  'admin/dashboard.html',
  'admin/assets/css/admin.css',
  'admin/assets/js/admin-app.js',
  'manifest.json',
  'robots.txt',
  'sitemap.xml',
  'sw.js'
];

for (const file of requiredFiles) {
  assert(await exists(path.join(dist, file)), `Missing release file: ${file}`);
}

const releaseFiles = await walk(dist);
const relativeFiles = releaseFiles.map(file => path.relative(dist, file));
const forbiddenExtensions = /\.(?:sql|py|command|rtf|md|map)$/i;
assert(
  !relativeFiles.some(file => forbiddenExtensions.test(file)),
  'Development or private source files are present in dist/.'
);
assert(
  !relativeFiles.some(file => file.includes('components/') && file.startsWith('assets/')),
  'Public source components are present in dist/.'
);
assert(
  !relativeFiles.some(file => /(?:^|\/)(?:package|pnpm-lock|index\.template)/.test(file)),
  'Build metadata is present in dist/.'
);

const indexHtml = await readFile(path.join(dist, 'index.html'), 'utf8');
assert(!indexHtml.includes('data-component='), 'Public HTML contains unresolved components.');
assert(indexHtml.includes('rel="canonical"'), 'Canonical URL is missing.');
assert(indexHtml.includes('application/ld+json'), 'Schema.org data is missing.');
assert(indexHtml.includes('style.min.css'), 'Minified site CSS is not linked.');
assert(indexHtml.includes('site.min.js'), 'Minified site JavaScript is not linked.');
assert(!indexHtml.includes('shop-data.min.js'), 'Shop data must be loaded with the deferred services bundle.');

const htmlFiles = releaseFiles.filter(file => file.endsWith('.html'));
for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, 'utf8');
  const $ = cheerio.load(html);
  const ids = $('[id]').map((_, element) => $(element).attr('id')).get();
  assert(
    ids.length === new Set(ids).size,
    `${path.relative(dist, htmlFile)} contains duplicate element IDs.`
  );
  $('img').each((_, element) => {
    assert(
      $(element).attr('alt') != null,
      `${path.relative(dist, htmlFile)} contains an image without alt text.`
    );
  });
  $('button').each((_, element) => {
    assert(
      Boolean($(element).attr('type')),
      `${path.relative(dist, htmlFile)} contains a button without an explicit type.`
    );
  });
  $('[src], [href]').each((_, element) => {
    for (const attribute of ['src', 'href']) {
      const reference = $(element).attr(attribute);
      if (!reference) continue;
      assert(
        !isRootRelative(reference),
        `${path.relative(dist, htmlFile)} contains a root-relative path: ${reference}`
      );
      const target = resolveReference(htmlFile, reference);
      if (target) {
        const relativeTarget = path.relative(dist, target);
        if (!relativeFiles.includes(relativeTarget)) {
          failures.push(`${path.relative(dist, htmlFile)} references missing file: ${reference}`);
        }
      }
    }
  });
}

const manifest = JSON.parse(await readFile(path.join(dist, 'manifest.json'), 'utf8'));
for (const field of ['id', 'start_url', 'scope']) {
  assert(
    !isRootRelative(manifest[field] || ''),
    `Manifest ${field} must be base-path relative: ${manifest[field]}`
  );
}
for (const icon of manifest.icons || []) {
  assert(!isRootRelative(icon.src), `Manifest icon must be base-path relative: ${icon.src}`);
  const target = resolveReference(path.join(dist, 'manifest.json'), icon.src);
  assert(target && await exists(target), `Manifest icon is missing: ${icon.src}`);
}

const serviceWorker = await readFile(path.join(dist, 'sw.js'), 'utf8');
const assetBlock = serviceWorker.match(/const ASSETS = \[([\s\S]*?)\];/);
assert(Boolean(assetBlock), 'Service worker asset list is missing.');
if (assetBlock) {
  for (const match of assetBlock[1].matchAll(/'([^']+)'/g)) {
    assert(
      !isRootRelative(match[1]),
      `Service worker asset must be base-path relative: ${match[1]}`
    );
    const target = resolveReference(path.join(dist, 'sw.js'), match[1]);
    assert(target && await exists(target), `Service worker asset is missing: ${match[1]}`);
  }
}

const javascriptFiles = releaseFiles.filter(file => file.endsWith('.js'));
for (const javascriptFile of javascriptFiles) {
  const source = await readFile(javascriptFile, 'utf8');
  const importPatterns = [
    /\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  ];
  for (const pattern of importPatterns) {
    for (const match of source.matchAll(pattern)) {
      const reference = match[1];
      if (isExternal(reference)) continue;
      assert(
        !isRootRelative(reference),
        `${path.relative(dist, javascriptFile)} contains a root-relative import: ${reference}`
      );
      const target = resolveReference(javascriptFile, reference);
      assert(
        target && await exists(target),
        `${path.relative(dist, javascriptFile)} imports missing file: ${reference}`
      );
    }
  }
}

assert(
  !indexHtml.includes('"/assets/') && !indexHtml.includes('"/data.min.js'),
  'Public HTML contains a deployment-breaking root asset path.'
);
assert(
  !serviceWorker.includes("'/"),
  'Service worker contains a deployment-breaking root cache path.'
);

const cssFiles = releaseFiles.filter(file => file.endsWith('.css'));
for (const cssFile of cssFiles) {
  const css = await readFile(cssFile, 'utf8');
  assert(!/@import\b/.test(css), `${path.relative(dist, cssFile)} contains a render-blocking @import.`);
}

const textFiles = releaseFiles.filter(file => /\.(?:html|js|css|json|xml|txt)$/i.test(file));
for (const file of textFiles) {
  const text = await readFile(file, 'utf8');
  assert(!/\b(?:sb_secret_|service_role)\b/.test(text), `Secret-like value found in ${path.relative(dist, file)}.`);
  assert(!/\bconsole\.(?:log|warn|error|debug)\b/.test(text), `Console call found in ${path.relative(dist, file)}.`);
}

if (failures.length) {
  throw new Error(`Release validation failed:\n- ${failures.join('\n- ')}`);
}

const totalBytes = (await Promise.all(releaseFiles.map(file => stat(file)))).reduce(
  (total, info) => total + info.size,
  0
);
console.log(`Release validation passed: ${relativeFiles.length} files, ${(totalBytes / 1024).toFixed(1)} KB.`);
