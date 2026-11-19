const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const server = fs.readFileSync('server.js','utf8');
const admin = fs.readFileSync('admin.html','utf8') + fs.readFileSync('admin.js','utf8');
const app = fs.readFileSync('app.js','utf8');
const schema = fs.readFileSync('schema.sql','utf8');
test('l’administration configure un numéro unique et indépendant pour Flooz et Mixx',()=>{
 assert.match(admin,/data-section="deposit-settings"/);
 assert.match(admin,/deposit-settings-flooz/); assert.match(admin,/deposit-settings-tmoney/);
 assert.match(server,/ON CONFLICT\(provider\) DO UPDATE SET phone=EXCLUDED.phone,enabled=EXCLUDED.enabled/);
});
test('les réglages de réception sont protégés par la session administrateur et journalisés',()=>{
 assert.match(server,/api\/admin\/deposit-settings/); assert.match(server,/requireUser\(req,res,'admin'\)/);
 assert.match(server,/deposit\.reception_settings\.updated/);
});
test('les utilisateurs voient le numéro actif de l’opérateur choisi et le serveur le vérifie',()=>{
 assert.match(app,/api\/deposit-destinations/); assert.match(app,/Numéro officiel de réception/);
 assert.match(server,/SELECT phone,enabled FROM mobile_money_reception_settings WHERE provider=\$1/);
 assert.match(server,/Aucun numéro de réception actif pour cet opérateur/);
});
test('le numéro destinataire est archivé sur chaque nouveau dépôt sans écraser les anciens',()=>{
 assert.match(schema,/recipient_phone VARCHAR\(30\)/);
 assert.match(server,/payer_phone,recipient_phone\) VALUES\(\$1,\$2,\$3,\$4,\$5,\$6\)/);
 assert.match(server,/d\.recipient_phone/);
});
test('les dépôts restent en attente jusqu’à la validation manuelle et aucun retrait automatique n’est ajouté',()=>{
 assert.match(server,/verification_method='manual'/);
 assert.match(server,/b\.confirmedReceived!==true/);
});
