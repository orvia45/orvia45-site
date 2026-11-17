const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const schema = fs.readFileSync(path.join(root, 'schema.sql'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const adminJs = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');

test('Contrôle est protégé par un hash serveur et une session courte HttpOnly', () => {
  assert.match(server, /passwordHash\(process\.env\.CONTROL_ACCESS_PASSWORD\)/);
  assert.match(server, /HttpOnly; .*SameSite=Strict; Path=\/; Max-Age=1800/);
  assert.match(server, /requireControl\(req,res\)/);
});
test('les comptes spéciaux sont provisionnés depuis les variables privées', () => {
  assert.match(server, /SPECIAL_ACCOUNT_1_PASSWORD/);
  assert.match(server, /SPECIAL_ACCOUNT_2_PASSWORD/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS special_commission_accounts/);
});
test('les commissions spéciales sont limitées au premier dépôt et idempotentes', () => {
  assert.match(server, /special_first_deposit_claims/);
  assert.match(server, /Math\.floor\(Number\(dep\.amount_cfa\)\*0\.12\)/);
  assert.match(server, /special-commission:/);
  assert.match(schema, /UNIQUE\(special_account_id,deposit_id\)/);
  assert.match(schema, /depositor_user_id BIGINT PRIMARY KEY/);
});
test('l’interface Contrôle propose activation et historique', () => {
  assert.match(admin, /data-section="control"/);
  assert.match(admin, /id="control-unlock-form"/);
  assert.match(adminJs, /loadSpecialCommissions/);
  assert.match(adminJs, /Désactiver/);
});
