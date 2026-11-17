const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const server = fs.readFileSync('server.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');

test('le compteur de réponses non lues du service client est réservé à la session utilisateur', () => {
  assert.match(server, /\/api\/support\/unread-count'[\s\S]{0,300}requireUser\(req,res,'user'\)/);
  assert.match(server, /sender_role='admin' AND is_read=false/);
});

test('le compte utilisateur affiche un badge accessible pour les réponses du service client', () => {
  assert.match(html, /id="user-support-unread-badge"[^>]*hidden/);
  assert.match(css, /\.user-support-unread-badge/);
});

test('les réponses du service client se mettent à jour automatiquement quand la conversation est ouverte', () => {
  assert.match(app, /refreshUserSupportUnreadBadge\(\)/);
  assert.match(app, /loadUserSupport\(\)\}\},20000\)/);
  assert.match(app, /host\.dataset\.messageIds/);
});
