const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const root=__dirname+'/..';
test('les offres peuvent recevoir un nom de rubrique personnalisé enregistré en base',()=>{const server=fs.readFileSync(root+'/server.js','utf8');const admin=fs.readFileSync(root+'/admin.html','utf8');const js=fs.readFileSync(root+'/admin.js','utf8');assert.match(server,/ADD COLUMN IF NOT EXISTS rubric_name VARCHAR\(60\)/);assert.match(server,/rubric_name,duration_label/);assert.match(server,/rubric_name=\$5/);assert.match(admin,/name=\"rubricName\" maxlength=\"60\"/);assert.match(js,/rubricName:f\.elements\.rubricName\.value/)});
test('les utilisateurs voient des onglets séparés pour chaque rubrique personnalisée',()=>{const app=fs.readFileSync(root+'/app.js','utf8');assert.match(app,/function offerRubricKey/);assert.match(app,/renderOfferRubricTabs/);assert.match(app,/offerRubricKey\(o\)===iaCategory/)});
