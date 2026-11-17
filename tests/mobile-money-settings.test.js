const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const server=fs.readFileSync('server.js','utf8');
const admin=fs.readFileSync('admin.html','utf8');
const js=fs.readFileSync('admin.js','utf8');
test('les coordonnées Flooz et Mixx sont persistées côté serveur et réservées à l’administrateur',()=>{
 assert.match(server,/CREATE TABLE IF NOT EXISTS mobile_money_settings/);
 assert.match(server,/\/api\/admin\/mobile-money-settings/);
 assert.match(server,/requireUser\(req,res,'admin'\)/);
 assert.match(server,/enabled&&!phone/);
});
test('l’administration permet de renseigner séparément les deux numéros et titulaires',()=>{
 assert.match(admin,/mobile-money-settings-form/);
 assert.match(admin,/floozPhone/);
 assert.match(admin,/tmoneyPhone/);
 assert.match(js,/loadMobileMoneySettings/);
 assert.match(js,/mobile-money-settings-form/);
});
