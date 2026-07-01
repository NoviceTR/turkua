import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import * as cheerio from 'cheerio';
import { transform } from 'lightningcss';
import ts from 'typescript';

const root = process.cwd();
const ignoredDirectories = new Set(['.git', 'dist', 'node_modules']);
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
  const nested = await Promise.all(entries
    .filter(entry => !ignoredDirectories.has(entry.name))
    .map(async entry => {
      const file = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(file) : [file];
    }));
  return nested.flat();
}

function isExternal(reference) {
  return /^(?:[a-z]+:|\/\/|#)/i.test(reference);
}

const files = await walk(root);
const sourceFiles = files.filter(file => /\.(?:css|html|js|json|md|mjs|py|sql|toml|ts|txt|xml)$/i.test(file));

for (const file of sourceFiles) {
  const text = await readFile(file, 'utf8');
  assert(
    !/^(?:<{7}|={7}|>{7})/m.test(text),
    `Merge conflict marker found in ${path.relative(root, file)}.`
  );
}

for (const file of files.filter(file => file.endsWith('.json'))) {
  try {
    JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    failures.push(`Invalid JSON in ${path.relative(root, file)}: ${error.message}`);
  }
}

for (const file of files.filter(file => file.endsWith('.css') && !file.endsWith('.min.css'))) {
  try {
    transform({
      filename: path.basename(file),
      code: Buffer.from(await readFile(file)),
      minify: false,
      sourceMap: false
    });
  } catch (error) {
    failures.push(`Invalid CSS in ${path.relative(root, file)}: ${error.message}`);
  }
}

for (const file of files.filter(file => file.endsWith('.ts'))) {
  const source = await readFile(file, 'utf8');
  const result = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022
    }
  });
  for (const diagnostic of result.diagnostics || []) {
    if (diagnostic.category !== ts.DiagnosticCategory.Error) continue;
    failures.push(
      `Invalid TypeScript in ${path.relative(root, file)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`
    );
  }
}

for (const file of files.filter(file => file.endsWith('.html'))) {
  const html = await readFile(file, 'utf8');
  const $ = cheerio.load(html);
  const ids = $('[id]').map((_, element) => $(element).attr('id')).get();
  assert(
    ids.length === new Set(ids).size,
    `${path.relative(root, file)} contains duplicate element IDs.`
  );

  $('[src], [href]').each((_, element) => {
    for (const attribute of ['src', 'href']) {
      const reference = $(element).attr(attribute);
      if (!reference || isExternal(reference)) continue;
      const clean = reference.split(/[?#]/)[0];
      if (!clean) continue;
      const target = clean.startsWith('/')
        ? path.join(root, clean.slice(1))
        : path.resolve(path.dirname(file), clean);
      if (!files.includes(target)) {
        failures.push(`${path.relative(root, file)} references missing file: ${reference}`);
      }
    }
  });
}

for (const required of [
  'README.md',
  'backend/supabase/functions/.env.example',
  'index.template.html',
  'scripts/build.mjs',
  'scripts/release.mjs'
]) {
  assert(await exists(path.join(root, required)), `Required source file is missing: ${required}`);
}

if (failures.length) {
  throw new Error(`Source validation failed:\n- ${failures.join('\n- ')}`);
}

console.log(`Source validation passed: ${files.length} files inspected.`);
