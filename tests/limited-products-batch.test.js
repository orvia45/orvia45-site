const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
test('les trois nouvelles offres Temps Limité sont créées une seule fois en brouillon', () => {
  assert.match(server, /smile-limited-30-130-190-v1/);
  for (const code of ['SM-LIMITED-30D','SM-LIMITED-130D','SM-LIMITED-190D']) assert.ok(server.includes(code));
  assert.match(server, /'30 jours',270000/);
  assert.match(server, /'130 jours',720000/);
  assert.match(server, /'190 jours',1120000/);
  assert.match(server, /VALUES\(\$1,\$2,[\s\S]*?'limited',[\s\S]*?20000,\$4,1,true,200,false,false,false,NULL,NULL,'\[20000,50000,110000,180000\]'::jsonb,0,3/);
});
