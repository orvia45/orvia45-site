const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const server = fs.readFileSync('server.js', 'utf8');
const html = fs.readFileSync('admin.html', 'utf8');
const js = fs.readFileSync('admin.js', 'utf8');

test('le journal des activités est protégé par une session administrateur', () => {
  const route = server.match(/url\.pathname==='\/api\/admin\/audit-logs'[\s\S]{0,500}/)?.[0] || '';
  assert.match(route, /requireUser\(req,res,'admin'\)/);
});

test('le journal est filtrable, limité et trié du plus récent au plus ancien', () => {
  assert.match(server, /ORDER BY l\.created_at DESC,l\.id DESC LIMIT 500/);
  assert.match(server, /l\.action ILIKE/);
  assert.match(server, /l\.created_at >= \$2::date/);
});

test('l’interface propose un journal en lecture seule et un export CSV', () => {
  assert.match(html, /data-section="audit"/);
  assert.match(html, /data-panel="audit"/);
  assert.match(html, /audit-export/);
  assert.match(js, /orvia45-journal-activites\.csv/);
  assert.match(js, /td\.textContent=value/);
});
