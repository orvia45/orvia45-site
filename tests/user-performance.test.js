const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const server = fs.readFileSync('server.js', 'utf8');
const html = fs.readFileSync('admin.html', 'utf8');
const js = fs.readFileSync('admin.js', 'utf8');

test('le rapport de performance utilisateur est réservé à un administrateur', () => {
  const route = server.slice(server.indexOf("url.pathname==='/api/admin/user-performance'"), server.indexOf("url.pathname==='/api/admin/offer-performance'"));
  assert.match(route, /requireUser\(req,res,'admin'\)/);
  assert.match(route, /LIMIT 500/);
});

test('le rapport détaille les opérations financières réelles et les filtres de période', () => {
  const route = server.slice(server.indexOf("url.pathname==='/api/admin/user-performance'"), server.indexOf("url.pathname==='/api/admin/offer-performance'"));
  for (const field of ['deposit_total_cfa','invested_cfa','withdrawal_paid_cfa','commissions_cfa','referred_count','last_activity']) assert.ok(route.includes(field), `champ absent: ${field}`);
  assert.match(route, /created_at >= \$1::date/);
  assert.match(route, /created_at < \$2::date\+1/);
});

test('l’administration affiche le tableau des performances et permet son export CSV', () => {
  assert.match(html, /Performance des utilisateurs/);
  assert.match(html, /id="user-performance-rows"/);
  assert.match(js, /\/api\/admin\/user-performance/);
  assert.match(js, /orvia45-performance-utilisateurs\.csv/);
});
