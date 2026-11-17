'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('l’interface utilisateur propose connexion et inscription réelles', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(html, /id="user-login-form"/);
  assert.match(html, /id="user-register-form"/);
  assert.match(js, /\/api\/auth\/login/);
  assert.match(js, /\/api\/auth\/register/);
  assert.doesNotMatch(js, /createTemporaryGuest/);
});

test('le changement de mot de passe est vérifié côté serveur', () => {
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.match(server, /\/api\/auth\/change-password/);
  assert.match(server, /password_hash,password_salt FROM users WHERE id=\$1 FOR UPDATE/);
  assert.match(server, /user\.password_changed/);
});

test('le PIN de retrait est protégé côté serveur et les bénéficiaires sont isolés par utilisateur', () => {
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  const schema = fs.readFileSync(path.join(root, 'schema.sql'), 'utf8');
  assert.match(server, /\/api\/security\/withdrawal-pin/);
  assert.match(server, /passwordHash\(pin/);
  assert.match(server, /withdrawal_pin_hash/);
  assert.match(server, /WHERE id=\$1 AND user_id=\$2/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS wallet_beneficiaries/);
});

test('les publications sont administrées et seules les publications publiées sont visibles des utilisateurs', () => {
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  const schema = fs.readFileSync(path.join(root, 'schema.sql'), 'utf8');
  assert.match(server, /\/api\/admin\/publications/);
  assert.match(server, /WHERE status='published'/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS publications/);
});

test('aucune libération automatique des investissements ne tourne sans conditions contractuelles décidées', () => {
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.doesNotMatch(server, /setInterval\(\(\)=>releaseMaturedInvestments/);
  assert.doesNotMatch(server, /await releaseMaturedInvestments\(\)/);
});


test('les sessions administrateur et utilisateur sont indépendantes', () => {
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
  assert.match(server, /const ADMIN_COOKIE = 'smile_admin_session'/);
  assert.match(server, /requestedRole==='admin'\?\(cookies\[ADMIN_COOKIE\]\|\|cookies\[COOKIE\]\)/);
  assert.match(server, /createSession\(u\.id,u\.role,res\)/);
  assert.match(admin, /auth\/me\?space=admin/);
  assert.match(app, /auth\/me\?space=user/);
  assert.match(admin, /auth\/logout\?space=admin/);
  assert.match(app, /auth\/logout\?space=user/);
  assert.match(html, /href="\/" target="_blank"/);
});


test('les connexions sont strictement limitées à leur espace et ne redirigent pas un administrateur vers le portail utilisateur', () => {
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(server, /requestedSpace==='user'&&u\.role!=='user'/);
  assert.match(server, /requestedSpace==='admin'&&u\.role!=='admin'/);
  assert.doesNotMatch(app, /if\(d\.user\?\.role==='admin'\)\{location\.href='\/admin\.html'/);
  assert.match(app, /d\.user\?\.role!=='user'/);
});
