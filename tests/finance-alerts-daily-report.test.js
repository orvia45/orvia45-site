const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const server=fs.readFileSync('server.js','utf8');
const admin=fs.readFileSync('admin.js','utf8');
const html=fs.readFileSync('admin.html','utf8');
const css=fs.readFileSync('admin.css','utf8');
test('les alertes financières sont réservées à un administrateur connecté',()=>{
 assert.match(server,/url\.pathname==='\/api\/admin\/finance-alerts'/);
 assert.match(server,/requireUser\(req,res,'admin'\)/);
 assert.match(server,/duplicate_reference/);
 assert.match(server,/stale_pending/);
 assert.match(server,/unverified_approved_deposit/);
});
test('le rapport journalier valide la période et limite sa durée',()=>{
 assert.match(server,/url\.pathname==='\/api\/admin\/report\/daily'/);
 assert.match(server,/Choisissez une période valide de 1 à 367 jours/);
 assert.match(server,/generate_series\(\$1::date,\$2::date,interval '1 day'\)/);
});
test('l’administration affiche les alertes et le détail journalier exportable',()=>{
 assert.match(html,/id="finance-alert-list"/);
 assert.match(html,/id="daily-report-rows"/);
 assert.match(html,/id="export-daily-report"/);
 assert.match(admin,/loadFinanceAlerts\(\)/);
 assert.match(admin,/runDailyReport\(\)/);
 assert.match(admin,/orvia45-rapport-journalier/);
 assert.match(css,/\.finance-alert-row/);
});
test('le CSV est produit uniquement après chargement des données',()=>{
 assert.match(admin,/disabled=!latestDailyReport\.length/);
 assert.match(admin,/text\/csv;charset=utf-8/);
});

test('le rapport de parrainage détaille les filleuls et les commissions par niveau avec filtre de période',()=>{
 assert.match(server,/url\.pathname==='\/api\/admin\/referral-report'/);
 assert.match(server,/requireUser\(req,res,'admin'\)/);
 assert.match(server,/level1_cfa/); assert.match(server,/level2_cfa/); assert.match(server,/level3_cfa/);
 assert.match(html,/id="referral-report-rows"/); assert.match(admin,/loadReferralReport\(\)/);
});
test('le rapport de performance compare les offres et expose les indicateurs utiles',()=>{
 assert.match(server,/url\.pathname==='\/api\/admin\/offer-performance'/);
 assert.match(server,/average_ticket_cfa/); assert.match(server,/returns_cfa/);
 assert.match(html,/id="offer-performance-rows"/); assert.match(admin,/loadOfferPerformance\(\)/);
});
test('les deux rapports disposent de filtres de dates, KPI et exports CSV',()=>{
 assert.match(html,/id="referral-report-from"/); assert.match(html,/id="offer-performance-from"/);
 assert.match(admin,/orvia45-rapport-parrainage\.csv/); assert.match(admin,/orvia45-performance-offres\.csv/);
 assert.match(admin,/csvDownload\(/);
});
