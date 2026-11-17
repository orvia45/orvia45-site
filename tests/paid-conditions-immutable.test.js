const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const schema = fs.readFileSync(path.join(root, 'schema.sql'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

test('chaque souscription payée enregistre un instantané complet des conditions', () => {
  assert.match(server, /conditionsSnapshot=\{[\s\S]*?durationLabel:[\s\S]*?displayValueCfa:[\s\S]*?paidAt:/);
  assert.match(server, /offer_conditions_snapshot,offer_name_snapshot,offer_code_snapshot,duration_label_snapshot,min_amount_cfa_snapshot,display_value_cfa_snapshot,offer_description_snapshot/);
});

test('PostgreSQL interdit la modification des conditions contractuelles figées', () => {
  assert.match(schema, /CREATE OR REPLACE FUNCTION protect_paid_investment_snapshot\(\)/);
  assert.match(schema, /NEW\.offer_conditions_snapshot IS DISTINCT FROM OLD\.offer_conditions_snapshot/);
  assert.match(schema, /NEW\.total_return_cfa IS DISTINCT FROM OLD\.total_return_cfa/);
  assert.match(schema, /NEW\.due_at IS DISTINCT FROM OLD\.due_at/);
  assert.match(schema, /BEFORE UPDATE OR DELETE ON investments/);
  assert.match(schema, /Une souscription payée avec conditions figées ne peut pas être supprimée/);
});

test('la modification des offres reste séparée des instantanés des souscriptions déjà payées', () => {
  assert.match(server, /INSERT INTO offer_conditions_audit\(offer_id,actor_id,old_conditions,new_conditions,reason\)/);
  assert.match(server, /INSERT INTO offer_stock_audit\(offer_id,actor_id,old_stock_limit,new_stock_limit,reason\)/);
  assert.match(server, /stock total \(/);
});
