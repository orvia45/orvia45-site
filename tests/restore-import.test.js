const test = require('node:test');
const assert = require('node:assert/strict');
const { quoteIdent, orderTables } = require('../scripts/run-isolated-restore');

test('la restauration ne permet que des identifiants SQL simples', () => {
  assert.equal(quoteIdent('users'), '"users"');
  assert.throws(() => quoteIdent('users; DROP TABLE users'), /non autorisé/);
});
test('les tables référencées non nullables sont restaurées avant leurs dépendantes', () => {
  const result = orderTables(['investments', 'users', 'offers'], [
    { table_name: 'investments', foreign_table_name: 'users', nullable: false },
    { table_name: 'investments', foreign_table_name: 'offers', nullable: false }
  ]);
  assert.ok(result.indexOf('users') < result.indexOf('investments'));
  assert.ok(result.indexOf('offers') < result.indexOf('investments'));
});
test('les références nullables sont différées et les cycles non nullables sont refusés', () => {
  assert.deepEqual(orderTables(['users'], [{ table_name: 'users', foreign_table_name: 'users', column_name: 'sponsor_id', nullable: true }]), ['users']);
  assert.throws(() => orderTables(['users'], [{ table_name: 'users', foreign_table_name: 'users', column_name: 'parent_id', nullable: false }]), /circulaire non nullable/);
});
test('les dépendances croisées non nullables sont refusées', () => {
  assert.throws(() => orderTables(['a', 'b'], [
    { table_name: 'a', foreign_table_name: 'b', nullable: false },
    { table_name: 'b', foreign_table_name: 'a', nullable: false }
  ]), /circulaires non nullables/);
});

test('la restauration compare le nombre de lignes de chaque table avant validation', () => {
  const { assertRestoredCounts } = require('../scripts/run-isolated-restore');
  const tables = [{ name: 'users', row_count: 2 }, { name: 'investments', row_count: 3 }];
  assert.equal(assertRestoredCounts(tables, new Map([['users', 2], ['investments', 3]])), 5);
  assert.throws(() => assertRestoredCounts(tables, new Map([['users', 1], ['investments', 3]])), /users: attendu 2, obtenu 1/);
});
