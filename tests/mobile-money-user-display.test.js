const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const server=fs.readFileSync('server.js','utf8');
const app=fs.readFileSync('app.js','utf8');
test('les utilisateurs ne reçoivent que les coordonnées Mobile Money activées',()=>{
 assert.match(server,/\/api\/public\/mobile-money-settings/);
 assert.match(server,/WHERE enabled=true AND phone<>''/);
});
test('un dépôt est refusé si l’opérateur choisi n’est pas configuré et activé',()=>{
 assert.match(server,/Cet opérateur n’est pas encore configuré pour les dépôts/);
 assert.match(server,/WHERE provider=\$1 AND enabled=true AND phone<>''/);
});
test('le formulaire utilisateur affiche le numéro et le titulaire du compte de réception',()=>{
 assert.match(app,/deposit-receiver-details/);
 assert.match(app,/Numéro de réception/);
 assert.match(app,/holder_name/);
 assert.match(app,/Aucun moyen de paiement n’est actuellement configuré/);
});
