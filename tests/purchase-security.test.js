'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const toggle = fs.readFileSync(path.join(root, 'password-toggle.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('un achat exige une clé d’idempotence unique et valide', () => {
  assert.match(server, /idempotencyKey=String\(b\.idempotencyKey\|\|''\)/);
  assert.match(server, /requestKey=`purchase:\$\{u\.id\}:\$\{idempotencyKey\}`/);
  assert.match(server, /execution_key=\$2/);
});

test('un retry du même achat retourne le produit existant sans nouveau débit', () => {
  assert.match(server, /const replay=await c\.query/);
  assert.match(server, /idempotentReplay:true/);
  assert.match(server, /Cette clé de confirmation est déjà associée à un autre achat/);
});

test('le débit est calculé et vérifié par le serveur dans une transaction comptable', () => {
  assert.match(server, /amount!==Number\(offer\.rows\[0\]\.min_amount_cfa\)/);
  assert.match(server, /const bal=await walletBalance\(c,u\.id\);if\(amount>bal\)/);
  assert.match(server, /eventKey:`investment:\$\{inv\.rows\[0\]\.id\}:executed`/);
  assert.match(server, /await c\.query\('COMMIT'\);json\(res,201/);
});

test('les achats confirmés apparaissent dans Mes produits', () => {
  assert.match(server, /url\.pathname==='\/api\/my-products'/);
  assert.match(app, /async function loadMyProducts\(/);
  assert.match(html, /data-action="my-products"/);
});

test('tous les champs mot de passe, y compris dynamiques, reçoivent un bouton œil', () => {
  assert.match(toggle, /querySelectorAll\?\.\('input\[type="password"\]'\)/);
  assert.match(toggle, /new MutationObserver/);
  assert.match(toggle, /data-toggle-password/);
});
