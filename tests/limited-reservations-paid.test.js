const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');

test('une réservation limitée exige un prix configuré et un stock de réservations restant', () => {
  assert.match(server, /reservationAmounts\.includes\(amount\)/);
  assert.match(server, /reservations_remaining\)<=0/);
});

test('la réservation est un achat intégral débité dans le grand livre et marqué non annulable/non remboursable', () => {
  assert.match(server, /limited_reservation_paid/);
  assert.match(server, /reservationPaidInFull:isLimited/);
  assert.match(server, /cancelable:false,refundable:false/);
  assert.match(server, /user_wallet_liability',debit:amount/);
});

test('le paiement incrémente le portefeuille produit et diminue le nombre de réservations restantes', () => {
  assert.match(server, /reservations_remaining=reservations_remaining-1,product_wallet_balance_cfa=product_wallet_balance_cfa\+\$2/);
});

test('le membre choisit un prix final et confirme explicitement le paiement définitif', () => {
  assert.match(app, /Montant réservé/);
  assert.match(app, /Confirmer la réservation/);
  assert.match(app, /aucune annulation ni aucun remboursement/i);
});

test('l’administration affiche le suivi des réservations payées et rappelle que les montants sont des prix définitifs', () => {
  assert.match(server, /AS paid_reservations/);
  assert.match(admin, /réservations payées/);
  assert.match(html, /Chaque montant proposé est le prix définitif payé intégralement|GESTION DES TEMPS LIMITÉS/);
});

test('aucun produit de démonstration n’est créé et l’ancien est neutralisé sans effacer son historique', () => {
  assert.doesNotMatch(server, /INSERT INTO investment_offers[\s\S]{0,700}SM-LIMITED-279/);
  assert.match(server, /UPDATE investment_offers SET active=false,published=false,purchase_enabled=false,removed=true[\s\S]*SM-LIMITED-279/);
  assert.doesNotMatch(html, /Produit exemple préparé|SM Durée limitée 27\.9|limited-edit-demo/);
  assert.match(html, /GESTION DES TEMPS LIMITÉS/);
});

test('la réservation anticipée active le produit à la date programmée', () => {
  assert.match(server, /activationAt:startAt\.toISOString\(\)/);
  assert.match(app, /Réservé — activation à venir/);
  assert.match(app, /Fin de l’offre dans/);
  assert.match(app, /Compte à rebours avant la mise en ligne/);
  assert.match(app, /data-limited-countdown=\"\$\{escapeIA\(o\.sale_start_at\|\|''\)\}\"/);
  assert.match(app, />Réserver</);
});

test('un produit limité en brouillon reste caché aux membres jusqu’à publication admin', () => {
  assert.match(server, /o\.category<>'limited' OR o\.published=true/);
  assert.match(server, /Programmez une date de mise en ligne et une date de fin valides/);
  assert.match(app, /limited:'SM Durée limitée'/);
});
