const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .filter((source) => source.trim());

if (scripts.length === 0) {
  throw new Error('No inline JavaScript was found in index.html.');
}

const tempDir = path.join(root, '.eslint-tmp');
fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });

try {
  const targets = ['eslint.config.js', 'scripts/lint.cjs'];
  scripts.forEach((source, index) => {
    const filename = `inline-${index + 1}.js`;
    fs.writeFileSync(path.join(tempDir, filename), source, 'utf8');
    targets.push(path.posix.join('.eslint-tmp', filename));
  });

  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  execFileSync(command, [
    '--yes',
    'eslint@9.39.1',
    '--config',
    'eslint.config.js',
    ...targets
  ], { cwd: root, stdio: 'inherit' });
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
