'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('le lien court /admin et /admin/ sert la page d’administration', () => {
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  const admin = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
  assert.match(server, /if\(p==='\/admin'\|\|p==='\/admin\/'\)p='\/admin\.html'/);
  assert.match(admin, /id="login-form"/);
  assert.match(admin, /name="password" type="password"/);
});

test('le raccourci admin ne contourne pas l’authentification', () => {
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.match(server, /requireUser\(req,res,'admin'\)/);
  assert.match(server, /requestedSpace==='admin'&&u\.role!=='admin'/);
});
