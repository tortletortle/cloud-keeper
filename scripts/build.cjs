const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
fs.rmSync(output, {recursive: true, force: true});
fs.mkdirSync(output, {recursive: true});
for (const entry of ['index.html', 'src', 'assets']) {
    fs.cpSync(path.join(root, entry), path.join(output, entry), {recursive: true});
}
const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
require('./check-integrity.cjs');
const required = [
    './src/assets.js', './src/cloud-brain.js', './src/cloud-social.js',
    './src/cloud-ecology.js', './src/cloud-saves.js', './src/app.js'
];
for (const file of required) {
    if (!html.includes(`src="${file}"`)) throw new Error(`Build entry missing: ${file}`);
    if (!fs.existsSync(path.join(output, file))) throw new Error(`Build file missing: ${file}`);
}
const refs = [...html.matchAll(/(?:src|href)="\.\/assets\/([^\"]+)"/g)].map(match => match[1]);
for (const file of refs) {
    if (!fs.existsSync(path.join(output, 'assets', file))) throw new Error(`Asset missing: ${file}`);
}
console.log(`Build verified: ${output}`);
console.log(`Assets: ${fs.readdirSync(path.join(output, 'assets')).length}`);