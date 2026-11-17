const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const server = fs.readFileSync('server.js','utf8');
const app = fs.readFileSync('app.js','utf8');
const env = fs.readFileSync('.env.example','utf8');
test('les paiements Mobile Money sont activés par défaut en mode manuel sans API de paiement',()=>{
 assert.match(server,/process\.env\.MOBILE_MONEY_ENABLED !== 'false'/);
 assert.match(env,/MOBILE_MONEY_ENABLED=true/);
 assert.match(server,/Aucun appel API ni transfert automatique/);
});
test('les membres ont un formulaire de dépôt manuel avec référence et opérateur',()=>{
 assert.match(app,/manual-deposit-form/); assert.match(app,/\/api\/deposits/);
 assert.match(app,/name="reference"/); assert.match(app,/value="flooz"/); assert.match(app,/value="tmoney"/);
});
test('les membres ont un formulaire de retrait manuel protégé par PIN',()=>{
 assert.match(app,/manual-withdraw-form/); assert.match(app,/\/api\/withdrawals/); assert.match(app,/name="pin"/);
});
test('le serveur exige une confirmation réelle avant de créditer un dépôt',()=>{
 assert.match(server,/b\.confirmedReceived!==true/); assert.match(server,/verification_method='manual'/);
});
test('les retraits exigent une approbation admin distincte avant confirmation du transfert',()=>{
 assert.match(server,/api\/admin\/withdrawals\/approve/);
 assert.match(server,/status='approved'/);
 assert.match(server,/status='paid'/);
 assert.match(server,/withdrawal_rejected/);
 assert.match(server,/reference\.length<3/);
});
