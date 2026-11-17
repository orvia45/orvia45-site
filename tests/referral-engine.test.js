const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateFirstDepositCommissions, canAwardFirstDeposit } = require('../referral-engine');

test('paie les trois niveaux aux taux convenus', () => {
  assert.deepEqual(calculateFirstDepositCommissions(10000, ['A','B','C']).map(x => [x.level,x.beneficiaryId,x.amount]), [[1,'A',1000],[2,'B',300],[3,'C',100]]);
});

test('si seul le niveau 1 existe, seul le niveau 1 reçoit 10%', () => {
  assert.deepEqual(calculateFirstDepositCommissions(10000, ['A']), [{level:1,beneficiaryId:'A',rate:0.10,amount:1000}]);
});

test('si le niveau 2 manque, le niveau 3 existant conserve son taux de niveau 3', () => {
  assert.deepEqual(calculateFirstDepositCommissions(10000, ['A',null,'C']).map(x => [x.level,x.beneficiaryId,x.amount]), [[1,'A',1000],[3,'C',100]]);
});

test('refuse les montants nuls ou négatifs', () => {
  assert.throws(() => calculateFirstDepositCommissions(0, ['A']), TypeError);
  assert.throws(() => calculateFirstDepositCommissions(-1, ['A']), TypeError);
});

test('une commission ne peut être déclenchée que si le premier dépôt validé n’est pas déjà traité', () => {
  assert.equal(canAwardFirstDeposit({firstValidatedDepositAt:null,firstDepositCommissionPaid:false}), true);
  assert.equal(canAwardFirstDeposit({firstValidatedDepositAt:'2026-01-01',firstDepositCommissionPaid:true}), false);
});


test('les commissions sont créées dans la validation admin du premier dépôt, jamais à l’achat produit', () => {
  const fs = require('node:fs');
  const server = fs.readFileSync(require.resolve('../server'), 'utf8');
  const approveAt = server.indexOf("url.pathname==='/api/admin/deposits/approve'");
  const purchaseAt = server.indexOf("url.pathname==='/api/investments'");
  assert.notEqual(approveAt, -1);
  assert.notEqual(purchaseAt, -1);
  assert.match(server.slice(approveAt), /INSERT INTO first_investments\(user_id,deposit_id,amount_cfa\)/);
  assert.match(server.slice(approveAt), /INSERT INTO referral_commissions/);
  assert.match(server.slice(approveAt), /ON CONFLICT\(referred_user_id,level\) DO NOTHING/);
  assert.doesNotMatch(server.slice(purchaseAt, approveAt), /INSERT INTO referral_commissions/);
});
