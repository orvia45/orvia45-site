const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
test('l’affiche rose Temps Limité est intégrée et incluse dans le cache hors ligne', () => {
  const image = path.join(root, 'smile-limited-banner.png');
  assert.ok(fs.existsSync(image));
  assert.ok(fs.statSync(image).size > 10000);
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(app, /smile-limited-banner\.png/);
  assert.match(app, /data-limited-countdown/);
  const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
  assert.match(css, /\.limited-product-image[^{]*\{[^}]*object-fit:contain/s);
  const sw = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
  assert.match(sw, /smile-shell-v1\.54\.10/);
  assert.match(sw, /smile-limited-banner\.png/);
});
