'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');

test('le serveur ne calcule plus de produit précédent obligatoire',()=>{
 assert.doesNotMatch(server,/previousSequentialOfferCode/);
 assert.doesNotMatch(server,/Vous devez d’abord souscrire/);
 assert.doesNotMatch(server,/Vous devez d’abord souscrire et payer/);
});
test('le catalogue membre ne verrouille plus les offres selon un achat précédent',()=>{
 assert.doesNotMatch(server,/sequence_unlocked|previous_offer_code|previous_offer_name/);
 assert.doesNotMatch(app,/sequenceLocked|sequence_unlocked|previous_offer_name|Produit précédent obligatoire/);
});
test('les contrôles indépendants de disponibilité, limite et solde sont conservés',()=>{
 assert.match(server,/purchase_enabled/);
 assert.match(server,/user_offer_quotas/);
 assert.match(server,/walletBalance\(c,u\.id\)/);
 assert.match(server,/stock_limit/);
});
