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
  assert.match(user, /id="publications"[\s\S]*Actualités ORVIA 45/);
});

test('l’accueil, les cartes Temps limité et les libellés visibles utilisent l’identité ORVIA 45', () => {
  const user = read('index.html');
  const app = read('app.js');
  const theme = read('orvia45-theme.css');
  const admin = read('admin.html');
  assert.match(user, /class="orvia-vip-promo"/);
  assert.doesNotMatch(user, /uploads\/smile-vip-banner\.png/);
  assert.doesNotMatch(user, /Actualités SMILE/);
  assert.match(app, /PROGRAMME ORVIA 45/);
  assert.match(app, /limited-orvia-art/);
  assert.match(theme, /limited-product-card[\s\S]*#d7b66f/);
  assert.match(admin, /<div class="mark">O<\/div>/);
});


test('le compte utilisateur propose IA en premier, avec des tuiles actives et les catégories reliées aux offres', () => {
  const user = read('index.html');
  const app = read('app.js');
  const css = read('style.css');
  const account = user.slice(user.indexOf('id="account"'), user.indexOf('</section>', user.indexOf('id="account"')));
  assert.match(account, /data-open-category="ia"[\s\S]*?>[\s\S]*?<span>IA<\/span>/);
  assert.match(account, /data-open-category="super"[\s\S]*?<span>SUPER IA<\/span>/);
  assert.match(account, /data-open-category="limited"/);
  assert.match(account, /data-open-category="daily"/);
  assert.match(account, /data-open-category="team"/);
  assert.match(app, /const base=categoryButton\.dataset\.openCategory/);
  assert.match(app, /offerRubricKey/);
  assert.match(app, /classList\.toggle\("active",x===categoryButton\)/);
  assert.match(css, /account-grid \.account-option\.active[\s\S]*#1675d1/);
  assert.doesNotMatch(user, /vérification d'identité|verification d'identite/i);
});

test('la rubrique de gestion des offres est explicitement nommée dans le menu administrateur', () => {
  const admin = read('admin.html');
  assert.match(admin, /data-section="offers"><span>◇<\/span> Gestion des offres/);
  assert.match(admin, /data-panel="offers"/);
});
