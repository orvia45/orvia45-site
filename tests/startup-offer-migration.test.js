const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');

test('les réglages initiaux des offres SMILE IA sont protégés par une migration unique', () => {
  assert.match(server, /smile-ia-initial-offer-defaults-v1/);
  assert.match(server, /INSERT INTO app_migrations\(migration_key\).*ON CONFLICT DO NOTHING RETURNING migration_key/s);
  assert.match(server, /if \(initialOfferDefaults\.rowCount\)\s*\{/);
  assert.match(server, /await offerDefaultsClient\.query\('COMMIT'\)/);
  assert.match(server, /await offerDefaultsClient\.query\('ROLLBACK'\)/);
  // Les UPDATE de valeur/publication ne doivent plus s'exécuter hors du garde de migration.
  const block = server.slice(server.indexOf("const initialOfferDefaults"), server.indexOf("await offerDefaultsClient.query('COMMIT')"));
  assert.equal((block.match(/UPDATE investment_offers SET/g) || []).length, 3);
});

test('le README ne présente plus les fonctions actuelles comme de simples démonstrations', () => {
  assert.match(readme, /État de la version 1\.52\.6/);
  assert.doesNotMatch(readme, /Les dépôts, retraits, achats, soldes et gains affichés restent des démonstrations/);
  assert.match(readme, /tests automatisés locaux ne remplacent pas une recette/);
});
