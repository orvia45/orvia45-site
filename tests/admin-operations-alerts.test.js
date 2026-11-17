const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const server = fs.readFileSync('server.js', 'utf8');
const html = fs.readFileSync('admin.html', 'utf8');
const js = fs.readFileSync('admin.js', 'utf8');

test('les alertes opérationnelles sont protégées par le rôle administrateur', () => {
  const start = server.indexOf("url.pathname==='/api/admin/operations-alerts'");
  const end = server.indexOf("url.pathname==='/api/admin/summary'", start);
  const route = server.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(route, /requireUser\(req,res,'admin'\)/);
  for (const table of ['deposits','withdrawals','investments','support_messages']) assert.ok(route.includes(table));
});

test('les alertes couvrent les quatre files et sont triées par date', () => {
  const route = server.slice(server.indexOf("url.pathname==='/api/admin/operations-alerts'"), server.indexOf("url.pathname==='/api/admin/summary'"));
  assert.match(route, /ORDER BY created_at DESC LIMIT 50/);
  assert.match(route, /support_messages m[\s\S]*is_read=false/);
  assert.match(route, /status='pending'/);
});

test('le tableau de bord présente et actualise les alertes', () => {
  assert.match(html, /id="operations-alerts-list"/);
  assert.match(js, /\/api\/admin\/operations-alerts/);
  assert.match(js, /setInterval\(\(\)=>\{if\(!\$\('#dashboard'\)\?\.hidden\)loadOperationsAlerts\(\)\},30000\)/);
});
