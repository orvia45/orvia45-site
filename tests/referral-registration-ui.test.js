'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
test('le code de parrainage est placé après le mot de passe et reste facultatif', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const form = html.match(/<form id="user-register-form"[\s\S]*?<\/form>/)?.[0] || '';
  assert.ok(form.indexOf('name="password"') < form.indexOf('name="ref"'));
  assert.match(form, /name="ref"[^>]*placeholder="Saisir le code de votre parrain"/);
  assert.doesNotMatch(form, /name="ref"[^>]*required/);
});
test('un code transmis par lien est prérempli et non modifiable', () => {
  const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(js, /new URLSearchParams\(location\.search\)\.get\('ref'\)/);
  assert.match(js, /field\.readOnly=true/);
  assert.match(js, /data\.ref=linked\|\|String\(data\.ref\|\|''\)\.trim\(\)/);
});
test('le serveur refuse un code de parrainage fourni mais invalide', () => {
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.match(server, /Code de parrainage invalide ou parrain indisponible/);
  assert.match(server, /sponsor=q\.rows\[0\]\.id/);
});
