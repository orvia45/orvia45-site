const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('CRYPTO et SUPER CRYPTO sont affichés dans les accès utilisateur et administration', () => {
  const user = read('index.html');
  const admin = read('admin.html');
  const adminJs = read('admin.js');
  const appJs = read('app.js');
  assert.match(user, /data-tab="rewards"[^>]*>[\s\S]*?CRYPTO/);
  assert.match(user, /data-ia-category="ia">CRYPTO/);
  assert.match(user, /<span>CRYPTO<\/span>/);
  assert.match(admin, /data-section="offers"[^>]*>[\s\S]*?CRYPTO/);
  assert.match(admin, /<option value="ia">CRYPTO<\/option>/);
  assert.match(adminJs, /ia:'CRYPTO'/);
  assert.match(appJs, /ia:'CRYPTO'/);
});

test('la présentation institutionnelle et le lien d’accès libre ne sont plus affichés aux utilisateurs', () => {
  const user = read('index.html');
  assert.doesNotMatch(user, /Accès libre\s*[–-]\s*Consulter les produits/);
  assert.doesNotMatch(user, /corporate-announcement-card/);
  assert.doesNotMatch(user, /open-corporate-announcement/);
  assert.match(user, /id="publications"[\s\S]*Actualités SMILE/);
});
