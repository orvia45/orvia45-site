const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const admin=fs.readFileSync(path.join(root,'admin.js'),'utf8');
const html=fs.readFileSync(path.join(root,'admin.html'),'utf8');
const schema=fs.readFileSync(path.join(root,'schema.sql'),'utf8');

test('chaque produit limité possède une date de fin de pré-réservation distincte de son ouverture publique',()=>{
 assert.match(schema,/ADD COLUMN IF NOT EXISTS reservation_end_at TIMESTAMPTZ/);
 assert.match(server,/ADD COLUMN IF NOT EXISTS reservation_end_at TIMESTAMPTZ/);
 assert.match(server,/reservation_end_at/);
});
test('les deux comptes à rebours sont rendus sur la même fiche produit, en haut puis en bas',()=>{
 assert.match(app,/Fin des pré-réservations dans/);
 assert.match(app,/Ouverture officielle des ventes dans/);
 assert.match(app,/o\.reservation_end_at/);
 assert.match(app,/data-limited-countdown=.*sale_start_at/);
});
test('l’administration configure les deux échéances et contrôle leur ordre',()=>{
 assert.match(html,/reservationEndAt/);
 assert.match(html,/saleStartAt/);
 assert.match(admin,/reservationEndAt/);
 assert.match(server,/reservationEnd&&saleStart&&reservationEnd>=saleStart/);
});
test('le serveur ferme les pré-réservations à leur échéance puis autorise les ventes publiques à la date d’ouverture',()=>{
 assert.match(server,/La période de pré-réservation est terminée/);
 assert.match(server,/isPreReservation/);
 assert.match(server,/limited_public_sale/);
 assert.match(server,/reservations_remaining=reservations_remaining-1/);
});
