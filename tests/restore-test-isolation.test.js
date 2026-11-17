const test = require('node:test');
const assert = require('node:assert/strict');
const { assertIsolatedTarget, databaseIdentity } = require('../scripts/prepare-restore-check');

test('la pré-vérification refuse tout mode autre que test isolé', () => {
  assert.throws(() => assertIsolatedTarget({ mode: 'production', confirmation: 'I_UNDERSTAND_THIS_IS_TEST_ONLY', targetUrl: 'postgres://u:p@test:5432/test', productionUrl: 'postgres://u:p@prod:5432/prod' }), /isolated-test/);
});
test('la pré-vérification exige une confirmation explicite', () => {
  assert.throws(() => assertIsolatedTarget({ mode: 'isolated-test', confirmation: 'yes', targetUrl: 'postgres://u:p@test:5432/test', productionUrl: 'postgres://u:p@prod:5432/prod' }), /confirmation explicite/);
});
test('la cible de restauration ne peut pas être la base de production', () => {
  assert.throws(() => assertIsolatedTarget({ mode: 'isolated-test', confirmation: 'I_UNDERSTAND_THIS_IS_TEST_ONLY', targetUrl: 'postgres://restore:secret@db.example:5432/orvia', productionUrl: 'postgres://prod:secret@db.example:5432/orvia' }), /base de production/);
});
test('la comparaison de cible ignore les identifiants mais compare hôte et base', () => {
  assert.equal(databaseIdentity('postgres://a:x@db.example:5432/orvia'), databaseIdentity('postgres://b:y@db.example:5432/orvia'));
  assert.notEqual(databaseIdentity('postgres://a:x@db.example:5432/orvia_test'), databaseIdentity('postgres://a:x@db.example:5432/orvia'));
});
test('le script annonce explicitement qu’il ne restaure aucune donnée', () => {
  const fs = require('node:fs'); const source = fs.readFileSync('scripts/prepare-restore-check.js', 'utf8');
  assert.match(source, /AUCUNE DONNÉE IMPORTÉE/);
  assert.match(source, /information_schema\.columns/);
  assert.match(source, /has_rows/);
});
