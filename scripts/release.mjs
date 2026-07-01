import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile
} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { minify as minifyHtml } from 'html-minifier-terser';
import { transform } from 'lightningcss';
import { PurgeCSS } from 'purgecss';
import { minify as minifyJs } from 'terser';

const root = process.cwd();
const dist = path.join(root, 'dist');
const fromRoot = (...parts) => path.join(root, ...parts);
const fromDist = (...parts) => path.join(dist, ...parts);

const publicFiles = [
  '.htaccess',
  'CNAME',
  'data.min.js',
  'index.html',
  'manifest.json',
  'robots.txt',
  'sitemap.xml',
  'sw.js'
];

const adminHtmlFiles = [
  'admin/index.html',
  'admin/login.html',
  'admin/dashboard.html'
];

async function ensureParent(file) {
  await mkdir(path.dirname(file), { recursive: true });
}

async function copy(relativePath) {
  const destination = fromDist(relativePath);
  await ensureParent(destination);
  await copyFile(fromRoot(relativePath), destination);
}

async function filesIn(directory, extension) {
  return (await readdir(fromRoot(directory)))
    .filter(file => !file.startsWith('.') && (!extension || file.endsWith(extension)))
    .map(file => `${directory}/${file}`);
}

async function writeMinifiedHtml(relativePath) {
  const source = await readFile(fromRoot(relativePath), 'utf8');
  const output = await minifyHtml(source, {
    collapseWhitespace: true,
    conservativeCollapse: true,
    removeComments: true,
    removeRedundantAttributes: false,
    minifyCSS: true,
    minifyJS: false
  });
  const destination = fromDist(relativePath);
  await ensureParent(destination);
  await writeFile(destination, `${output}\n`);
}

async function writeMinifiedModule(relativePath) {
  let source = await readFile(fromRoot(relativePath), 'utf8');
  if (relativePath === 'assets/js/supabase/config.js') {
    const url = process.env.SUPABASE_URL || '';
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';
    if (Boolean(url) !== Boolean(publishableKey)) {
      throw new Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be provided together.');
    }
    if (url && (!/^https:\/\/[^/]+$/i.test(url) || !/^sb_publishable_/i.test(publishableKey))) {
      throw new Error('Invalid public Supabase release configuration.');
    }
    source = source
      .replace("url: ''", `url: ${JSON.stringify(url)}`)
      .replace("publishableKey: ''", `publishableKey: ${JSON.stringify(publishableKey)}`);
  }
  const result = await minifyJs(source, {
    module: true,
    compress: { passes: 2, drop_console: true },
    mangle: false,
    format: { comments: false, ascii_only: false }
  });
  if (!result.code) throw new Error(`Could not minify ${relativePath}`);
  const destination = fromDist(relativePath);
  await ensureParent(destination);
  await writeFile(destination, `${result.code}\n`);
}

async function writeAdminCss(adminContentFiles) {
  const source = await readFile(fromRoot('admin/assets/css/admin.css'), 'utf8');
  const content = await Promise.all(adminContentFiles.map(async file => ({
    raw: await readFile(fromRoot(file), 'utf8'),
    extension: path.extname(file).slice(1)
  })));
  const [purged] = await new PurgeCSS().purge({
    content,
    css: [{ raw: source }],
    rejected: true,
    safelist: {
      standard: [
        /^(active|open|show|warning|published|draft|review)$/,
        /^(is-hidden|is-dirty|has-image|empty|passive|scheduled|expired)$/
      ]
    }
  });
  const result = transform({
    filename: 'admin.css',
    code: Buffer.from(purged.css),
    minify: true,
    sourceMap: false
  });
  const destination = fromDist('admin/assets/css/admin.css');
  await ensureParent(destination);
  await writeFile(destination, result.code);
  return purged.rejected.length;
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const [
  imageFiles,
  supabaseModules,
  adminComponents,
  adminViews,
  adminModules
] = await Promise.all([
  filesIn('assets/img'),
  filesIn('assets/js/supabase', '.js'),
  filesIn('admin/components', '.html'),
  filesIn('admin/views', '.html'),
  filesIn('admin/assets/js', '.js')
]);

await Promise.all([
  ...publicFiles.map(copy),
  copy('assets/css/style.min.css'),
  copy('assets/js/site.min.js'),
  copy('assets/js/live.min.js'),
  copy('assets/js/services.min.js'),
  ...imageFiles.map(copy),
  ...adminHtmlFiles.map(writeMinifiedHtml),
  ...adminComponents.map(writeMinifiedHtml),
  ...adminViews.map(writeMinifiedHtml),
  ...supabaseModules.map(writeMinifiedModule),
  ...adminModules.map(writeMinifiedModule)
]);

const removedAdminSelectors = await writeAdminCss([
  ...adminHtmlFiles,
  ...adminComponents,
  ...adminViews,
  ...adminModules
]);

console.log(`Production release created in dist/ (${removedAdminSelectors} unused admin CSS selectors removed).`);
