# ORVIA 45 — plateforme intégrée

Version de travail 2.0.0. Cette archive indépendante reprend les fonctionnalités métier de SMILE v1.54.8 et applique l'identité visuelle d'ORVIA 45.

## Contenu
- Espace utilisateur : inscription/connexion, portefeuille, offres, souscriptions, historique, parrainage, publications, support et paramètres.
- Espace administrateur : comptes, offres, stocks et limites personnelles, dépôts/retraits, comptabilité, notifications, support, recherche générale et journal d'audit.
- Identité visuelle : logo ORVIA 45, bleu nuit et or, interfaces utilisateur et administrateur harmonisées.
- PWA : installation depuis un navigateur compatible et cache hors ligne des ressources statiques.

## Démarrage
1. Installer Node.js 18+ et PostgreSQL 14+.
2. Créer une base PostgreSQL dédiée.
3. Copier `.env.example` vers `.env` et configurer `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` et les autres secrets nécessaires.
4. Exécuter `npm install`.
5. Charger les variables d'environnement puis lancer `npm start`.
6. Ouvrir `/` pour l'espace utilisateur et `/admin.html` pour l'administration. Vérifier `/api/health`.

Ne jamais inscrire les secrets dans les fichiers du projet ni les partager dans une conversation.

## Vérifications locales
```bash
node --check app.js
node --check admin.js
node --check server.js
node --check service-worker.js
npm test
```

## Limites avant production
- Flooz et Mixx (TMoney) restent en mode manuel : un administrateur vérifie et valide les dépôts, puis confirme manuellement les retraits. Aucun transfert API automatique n'est inclus.
- Une base PostgreSQL de recette doit être utilisée pour tester les parcours complets, les transactions concurrentes et les migrations.
- Configurer HTTPS, sauvegardes, supervision, stockage persistant des images et secrets de production.
- Faire valider les aspects juridiques, réglementaires et contractuels avant toute collecte d'argent réel.
- Les tests automatisés ne remplacent pas une recette fonctionnelle complète sur l'hébergement cible.

## Architecture et provenance
- `server.js`, `schema.sql` et les règles métier : base fonctionnelle issue de SMILE v1.54.8.
- `index.html`, `admin.html`, `style.css`, `admin.css` et les icônes ORVIA 45 : adaptation de l'interface ORVIA 45.
- `orvia45-theme.css` : couche de cohérence visuelle commune.
- `HISTORIQUE_SMILE.md` : documentation historique du projet source, conservée pour référence.
- `README_ORVIA45_INTEGRATION.md` et `CHANGELOG_ORVIA45_v2.md` : décisions d'intégration et changements de cette version.

La structure complète des écrans ORVIA 45 d'origine n'a pas encore été fusionnée composant par composant. Cette version est une intégration fonctionnelle et visuelle progressive, pas une certification de mise en production.


### Version 2.1 — navigation du compte
Le compte utilisateur présente maintenant les accès IA, SUPER IA, Temps limité, Revenu quotidien et Produit d’équipe dans une grille responsive. Chaque accès ouvre la catégorie d’offres correspondante. Le menu d’administration nomme explicitement la rubrique « Gestion des offres ».


### Version 2.2 — conditions contractuelles
Les souscriptions payées enregistrent un instantané des conditions et un déclencheur PostgreSQL interdit ensuite toute modification ou suppression de cet instantané. Les administrateurs peuvent modifier les conditions de l'offre pour les souscriptions futures et le stock restant ; chaque modification est historisée avec sa date, son auteur et son motif.
