const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const app = fs.readFileSync('app.js', 'utf8');
const server = fs.readFileSync('server.js', 'utf8');

test('SMILE VIP 1.0 est prioritaire dans la catégorie SUPER CRYPTO', () => {
  assert.match(app, /iaCategory!=='super'/);
  assert.match(app, /SMILE\\s\+VIP\\s\*1\\\.0/);
});

test('le texte de personnalisation dorée est retiré de la description affichée sans retirer le titre Produit SUPER IA VIP', () => {
  assert.match(app, /illustration dorée personnalisable depuis l’administration/);
  assert.match(server, /regexp_replace\(COALESCE\(o\.description/);
  assert.match(server, /Produit SUPER IA VIP/);
});

test('le compte utilisateur affiche immédiatement les sections avant le chargement des données secondaires', () => {
  assert.match(app, /renderProducts\(\);loadIAProducts\(\);const \[balanceResult,teamResult\]/);
});

test('les comptes spéciaux voient dépôts, investissements et retraits dans l’historique général, sans commissions de parrainage', () => {
  const start = server.indexOf("if(req.method==='GET' && url.pathname==='/api/financial-history')");
  const end = server.indexOf("if(req.method==='GET' && url.pathname==='/api/my-products')", start);
  const route = server.slice(start, end);
  assert.match(route, /FROM withdrawals WHERE user_id=\$1/);
  assert.match(route, /FROM deposits WHERE user_id=\$1/);
  assert.match(route, /FROM investments WHERE user_id=\$1/);
  assert.match(route, /FROM referral_commissions WHERE beneficiary_id=\$1 AND NOT EXISTS\(SELECT 1 FROM special_commission_accounts sc WHERE sc.user_id=\$1\)/);
});


test('la modification globale du quota cible tous les comptes existants et conserve les quotas consommés', () => {
  assert.ok(server.includes("url.pathname==='/api/admin/quotas/global'"), 'route globale présente');
  assert.match(server, /CROSS JOIN investment_offers o/);
  assert.match(server, /WHERE u\.role='user'/);
  assert.match(server, /q\.total_limit-q\.remaining/);
  assert.match(server, /default_user_limit=\$1/);
  assert.match(server, /user_offer_quota_audit/);
});

test('le formulaire admin exige une confirmation et un motif pour la modification globale', () => {
  const adminHtml = fs.readFileSync('admin.html', 'utf8');
  const adminJs = fs.readFileSync('admin.js', 'utf8');
  assert.match(adminHtml, /id="global-quota-form"/);
  assert.match(adminHtml, /toutes les offres ORVIA 45/);
  assert.match(adminHtml, /name="confirmGlobal"[^>]*required/);
  assert.match(adminHtml, /name="reason" maxlength="300" minlength="3" required/);
  assert.match(adminJs, /Confirmer la mise à jour de la limite personnelle pour TOUS les utilisateurs, anciens et nouveaux, sur TOUTES les offres ORVIA 45/);
});

test('Mixx (TMoney) est le libellé visible sans changer la clé historique tmoney', () => {
  assert.match(app, /value="tmoney">Mixx \(TMoney\)/);
  assert.match(app, /provider==='tmoney'\?'Mixx \(TMoney\)'/);
  assert.match(server, /!\['flooz','tmoney'\]\.includes\(provider\)/);
});


test('la modification individuelle du quota calcule aussi les souscriptions déjà utilisées si aucun quota personnalisé n’existe encore', () => {
  const routeStart = server.indexOf('const quotaMatch=url.pathname.match');
  const routeEnd = server.indexOf("if(req.method==='GET' && url.pathname==='/api/admin/quota-audit')", routeStart);
  const route = server.slice(routeStart, routeEnd);
  assert.match(route, /SELECT count\(\*\)::int AS n FROM investments WHERE user_id=\$1 AND offer_id=\$2/);
  assert.match(route, /remaining:limit-used/);
});

test('le formulaire individuel affiche le quota restant retourné et demande au membre d’actualiser son compte', () => {
  const adminJs = fs.readFileSync('admin.js', 'utf8');
  assert.match(adminJs, /result\.remaining/);
  assert.match(adminJs, /actualiser son compte/);
});

test('les quotas utilisateur se rafraîchissent automatiquement au retour sur la page et toutes les 30 secondes', () => {
  assert.match(app, /async function refreshVisibleQuotas\(\)/);
  assert.match(app, /document\.addEventListener\('visibilitychange'/);
  assert.match(app, /window\.addEventListener\('focus',refreshVisibleQuotas\)/);
  assert.match(app, /setInterval\(refreshVisibleQuotas,30000\)/);
  assert.match(app, /Promise\.all\(\[renderProducts\(\),loadIAProducts\(\)\]\)/);
});


test('le compte utilisateur affiche « Limite personnelle » partout à la place de « Quota »', () => {
  assert.match(app, /Limite personnelle :/);
  assert.doesNotMatch(app, /Quota personnel :|<p>Quota :/);
});

test('l’initialisation des limites personnelles déduit les souscriptions déjà approuvées ou libérées', () => {
  assert.match(server, /INSERT INTO user_offer_quotas\(user_id,offer_id,total_limit,remaining\)[\s\S]*?count\(\*\)::int FROM investments i WHERE i\.user_id=\$1 AND i\.offer_id=o\.id AND i\.status IN \('approved','released'\)/);
});

test('la modification individuelle conserve au minimum les souscriptions réellement approuvées même si une ancienne limite est incohérente', () => {
  const routeStart = server.indexOf('const quotaMatch=url.pathname.match');
  const routeEnd = server.indexOf("if(req.method==='GET' && url.pathname==='/api/admin/quota-audit')", routeStart);
  const route = server.slice(routeStart, routeEnd);
  assert.match(route, /Math\.max\(0,oldLimit-Number\(prior\.rows\[0\]\.remaining\),investmentUsed\)/);
  assert.match(route, /if\(limit<used\)/);
});


test('la modification de la limite par défaut d’une offre met à jour les limites non personnalisées des membres', () => {
  const start = server.indexOf("if(offerMatch && req.method==='PUT')");
  const end = server.indexOf("if(req.method==='PUT' && url.pathname==='/api/admin/quotas/global')", start);
  const route = server.slice(start, end);
  assert.match(route, /UPDATE user_offer_quotas q SET total_limit=GREATEST\(\$2,used\.used_count\),remaining=GREATEST\(0,\$2-used\.used_count\)/);
  assert.match(route, /q\.assigned_by IS NULL/);
  assert.match(route, /status IN \('approved','released'\)/);
});


test('l’administration utilise le libellé Limite personnelle dans la gestion individuelle et globale', () => {
  const adminHtml = fs.readFileSync('admin.html', 'utf8');
  const adminJs = fs.readFileSync('admin.js', 'utf8');
  assert.match(adminHtml, /Gestion des limites personnelles/);
  assert.match(adminHtml, /Nouvelle limite personnelle totale/);
  assert.match(adminHtml, /Enregistrer la limite personnelle/);
  assert.match(adminHtml, /Modifier la limite personnelle de tous les utilisateurs/);
  assert.match(adminJs, /Limite personnelle enregistrée/);
  assert.match(adminJs, /limite personnelle \$\{o\.default_user_limit\}/);
});
