const test = require('node:test');
const assert = require('node:assert/strict');
const { availableWalletBalance } = require('../wallet-utils');
test('le solde du grand livre est déjà net des retraits en attente', () => assert.equal(availableWalletBalance(7000), 7000));
test('ne retourne jamais un solde disponible négatif', () => assert.equal(availableWalletBalance(-500), 0));
test('traite les valeurs nulles comme zéro', () => assert.equal(availableWalletBalance(null), 0));
