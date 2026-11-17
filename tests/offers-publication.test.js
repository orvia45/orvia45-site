const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

test('une nouvelle offre est créée en brouillon', () => {
  assert.match(server, /image_url,published,sale_start_at,sale_end_at,reservation_end_at,reservation_amounts_cfa[\s\S]*?false[\s\S]*?RETURNING \*/);
});

test('le catalogue utilisateur affiche les offres actives même en attente de publication', () => {
  assert.match(server, /LEFT JOIN user_offer_quotas q/);
  assert.match(server, /WHERE o\.active=true AND o\.removed=false[\s\S]*?sale_end_at IS NULL OR o\.sale_end_at>now\(\)/);
  assert.match(server, /published=true/);
});

test('une souscription exige une offre active et publiée', () => {
  assert.match(server, /WHERE id=\$1 AND active=true AND published=true AND removed=false FOR UPDATE/);
});

test('l’administration propose les quatre actions de gestion des offres', () => {
  for (const label of ['Masquer','Afficher','Retirer','Republier']) assert.match(admin, new RegExp(label));
  for (const action of ['hide','show','remove','republish']) assert.match(server, new RegExp(action));
});

test('les offres de la vidéo sont préchargées comme brouillons', () => {
  const schema = fs.readFileSync(path.join(root, 'schema.sql'), 'utf8');
  const codes = [...schema.matchAll(/\('(SMILE-IA-[0-9]+|SMILE-SUPER-IA-[0-9]+)'/g)].map(m => m[1]);
  assert.equal(codes.length, 22);
  assert.match(schema, /SMILE-IA-01[\s\S]*?true/);
  assert.match(schema, /SMILE-SUPER-IA-09[\s\S]*?false/);
});

test('l’administration dispose d’un formulaire de création et de publication des annonces', () => {
  const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
  const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(html, /data-panel="publications"/);
  assert.match(html, /id="publication-form"/);
  assert.match(admin, /loadAdminPublications/);
  assert.match(admin, /\/api\/admin\/publications/);
});

test('les quatre dernières offres IA sont préparées en attente et les achats restent bloqués côté serveur', () => {
  assert.match(server, /SMILE-IA-10','SMILE-IA-11','SMILE-IA-12','SMILE-IA-13/);
  assert.match(app, /data-pending-product/);
  assert.match(app, /Ce produit n’est pas encore en ligne/);
  assert.match(server, /WHERE id=\$1 AND active=true AND published=true AND removed=false FOR UPDATE/);
});

test('les images des cartes produits utilisent la palette or', () => {
  const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
  assert.match(css, /#d8b65b/);
  assert.match(css, /#c7a24a/);
});

test('l’administration permet de prévisualiser le compte utilisateur sans inscription', () => {
  const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
  const preview = fs.readFileSync(path.join(root, 'preview.html'), 'utf8');
  assert.match(html, /id="preview-user-space"/);
  assert.match(admin, /window\.open\(url,'smile-user-preview'/);
  assert.match(preview, /Consultation libre sans inscription/);
  assert.match(preview, /disabled/);
  assert.match(preview, /Produits publiés par ORVIA 45/);
});

test('les produits en attente sont modifiables depuis la liste admin', () => {
  assert.match(admin, /edit\.addEventListener\('click',\(\)=>fillOfferForm\(o\)\)/);
  assert.match(admin, /Modifier/);
});

test('les 10 produits SUPER IA VIP ont chacun une illustration dorée distincte et restent en brouillon', () => {
  assert.match(server, /super-ai-vip-gold-art-v1/);
  assert.match(server, /SMILE VIP 1\.0/);
  assert.match(server, /SMILE VIP 10\.0/);
  const urls = [...server.matchAll(/'\/uploads\/offers\/([a-f0-9-]+\.jpg)'/g)].map(m => m[1]);
  assert.equal(new Set(urls).size >= 10, true);
  assert.match(server, /image_url=EXCLUDED\.image_url,active=true,published=false/);
});

test('les images VIP n’affichent pas les montants ou taux et sont personnalisables dans l’administration', () => {
  const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
  assert.match(html, /Illustration du produit \(image sans montant ni taux\)/);
  assert.match(html, /Chaque VIP possède son dessin doré, modifiable ici avant publication/);
  assert.match(admin, /api\/admin\/offers\/image/);
  assert.match(css, /smileGoldGlow/);
});


test('les modes de démonstration et comptes invités ne sont pas exposés dans les interfaces', () => {
  const adminHtml = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
  const adminJs = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.doesNotMatch(adminHtml, /démonstration|admin-preview/i);
  assert.doesNotMatch(adminJs, /Aperçu — démonstration|admin-preview|preview=true/i);
  assert.doesNotMatch(index, /version de démonstration/i);
  assert.doesNotMatch(server, /api\/auth\/guest|SMILE_GUEST_ACCESS/);
});

test('l’historique public ne contient pas de retraits fictifs de secours', () => {
  const records = fs.readFileSync(path.join(root, 'home-records.js'), 'utf8');
  assert.doesNotMatch(records, /demoRecords|Exemples de démonstration|Exemples fictifs/);
  assert.match(records, /Les retraits confirmés apparaîtront ici/);
});


test('masquer conserve la visibilité mais bloque les achats avec le message demandé', () => {
  assert.match(server, /hide:\{published:true,purchase_enabled:false,removed:false\}/);
  assert.match(server, /error:'Bientôt disponible'/);
  assert.match(app, /Bientôt disponible/);
});

test('retirer masque l’offre sans supprimer ses données et republier la réactive', () => {
  assert.match(server, /remove:\{published:false,purchase_enabled:false,removed:true\}/);
  assert.match(server, /republish:\{published:true,purchase_enabled:true,removed:false\}/);
  assert.match(server, /ADD COLUMN IF NOT EXISTS removed BOOLEAN/);
});

test('les produits à temps limité ont des dates, des options de réservation et un solde administrables', () => {
  for (const field of ['sale_start_at','sale_end_at','reservation_amounts_cfa','product_wallet_balance_cfa','reservations_remaining']) assert.match(server, new RegExp('ADD COLUMN IF NOT EXISTS '+field));
  for (const field of ['reservationEndAt','saleStartAt','saleEndAt','reservationAmounts','productWalletBalance','reservationsRemaining']) assert.match(admin, new RegExp(field));
  assert.match(server, /activationAt:startAt/);
  assert.match(server, /Cette offre à temps limité est terminée/);
});

test('le compte utilisateur affiche un compte à rebours pour les offres programmées et leur fin', () => {
  assert.match(app, /data-limited-countdown/);
  assert.match(app, /o\.reservation_end_at/);
  assert.match(app, /Ouverture officielle des ventes dans/);
  assert.match(app, /Fin des pré-réservations dans/);
});
