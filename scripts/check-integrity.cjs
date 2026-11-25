const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
const assetsJs = fs.readFileSync(path.join(root, 'src/assets.js'), 'utf8');

const requiredScripts = [
  'assets.js', 'cloud-brain.js', 'cloud-social.js',
  'cloud-ecology.js', 'cloud-saves.js', 'app.js'
];
for (const script of requiredScripts) {
  const relative = `./src/${script}`;
  if (!html.includes(`src="${relative}"`)) throw new Error(`Missing script reference: ${relative}`);
  if (!fs.existsSync(path.join(root, 'src', script))) throw new Error(`Missing script file: ${script}`);
}

const references = new Set();
for (const match of html.matchAll(/(?:src|href)="\.\/assets\/([^\"]+)"/g)) references.add(match[1]);
for (const match of css.matchAll(/url\(['"]?\.\.\/assets\/([^)'\"]+)/g)) references.add(match[1]);
for (const match of assetsJs.matchAll(/\.\/assets\/([A-Za-z0-9._-]+\.webp)/g)) references.add(match[1]);
if (references.size === 0) throw new Error('No assets were referenced.');
for (const file of references) {
  if (!fs.existsSync(path.join(root, 'assets', file))) throw new Error(`Missing asset: ${file}`);
}
if (/data:image\/webp;base64,/.test(html + css + assetsJs)) {
  throw new Error('Source still contains embedded WebP data URIs; assets must have one source of truth.');
}
console.log(`Integrity check passed: ${requiredScripts.length} scripts, ${references.size} referenced assets.`);