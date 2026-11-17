const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
test('les offres Temps limité utilisent le thème ORVIA 45 et le cache hors ligne ORVIA', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(app, /limited-orvia-art/);
  assert.doesNotMatch(app, /smile-limited-banner\.png/);
  assert.match(app, /data-limited-countdown/);
  const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
  assert.match(css, /\.limited-product-image[^{]*\{[^}]*object-fit:contain/s);
  const sw = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
  assert.match(sw, /orvia45-shell-v5/);
  assert.match(sw, /icons\/orvia45-512\.png/);
  assert.doesNotMatch(sw, /smile-vip-banner|smile-limited-banner/);
});
