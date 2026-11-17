# ORVIA 45 — plateforme intégrée (base SMILE v1.54.8)

Cette nouvelle archive a été créée séparément des deux archives sources. Elle conserve les parcours et le moteur métier de SMILE v1.54.8 (comptes, offres, souscriptions, stock, limites personnelles, dépôts/retraits manuels Flooz/Mixx, parrainage, grand livre, notifications, support et administration). La couche visuelle ORVIA 45 applique la palette bleu nuit/or de l'archive ORVIA 45 et remplace les éléments principaux de marque dans les écrans d'accueil et d'administration.

## Démarrage
1. Node.js 18+ et PostgreSQL 14+.
2. Copier `.env.example` vers `.env` et renseigner `DATABASE_URL` et les variables administrateur documentées dans `README.md`.
3. `npm install` puis `npm start`.
4. Ouvrir `/` pour l'espace utilisateur et `/admin.html` pour l'administration.

## Vérifications
Lancer `npm test` pour exécuter la suite automatisée fournie par SMILE. Ces tests ne remplacent pas les essais d'intégration sur une base PostgreSQL de recette.

## État et limites importantes
- Les paiements Flooz/Mixx restent des demandes manuelles à vérifier et valider par l'administrateur. Aucun transfert opérateur automatique n'est intégré.
- Les variables d'environnement, TLS, sauvegardes PostgreSQL, stockage persistant des images et hébergement doivent être configurés avant production.
- Cette version est une première intégration : l'identité ORVIA (palette, en-têtes, marque) est appliquée, tandis que les écrans métier de SMILE sont conservés et restylés. La structure des écrans ORVIA d'origine n'a pas été fusionnée composant par composant.
- Ne pas utiliser pour collecter de l'argent réel avant validation juridique/réglementaire et recette complète.

## Origines
- Base fonctionnelle : `SMILE_v1.54.8_AFFICHAGE_UTILISATEUR.zip`.
- Identité visuelle et icônes : `ORVIA45_complet_v7.zip`.

## Mise à jour v2 — harmonisation visuelle
- Bannière VIP d'accueil recréée en CSS avec l'identité bleu nuit/or d'ORVIA 45 ; l'ancienne bannière marquée SMILE n'est plus affichée.
- Cartes « Temps limité », compte à rebours et boutons harmonisés avec la palette ORVIA 45.
- Libellés d'accueil, de compte et d'administration harmonisés sur ORVIA 45 ; les identifiants techniques historiques SMILE restent inchangés pour préserver les migrations et les relations de données.
- Retrait du texte institutionnel non vérifié hérité de SMILE afin de ne pas attribuer à ORVIA 45 des déclarations d'enregistrement, de trading ou de technologie qui n'ont pas été confirmées.
- La suite automatisée doit être exécutée avec `npm test` après chaque modification.


## Mise à jour v2.2 — conditions des souscriptions payées
- Les souscriptions payées conservent définitivement leur instantané contractuel.
- Un déclencheur PostgreSQL bloque les modifications des conditions, montants et échéances d'une souscription déjà figée, ainsi que sa suppression.
- Les nouvelles conditions d'une offre ne concernent que les souscriptions futures et le stock encore disponible ; les modifications restent consignées avec administrateur, date et motif.


## Accès administrateur depuis un appareil de confiance

Après une première connexion normale à l’administration, le bouton « Autoriser cet appareil » enregistre un jeton aléatoire côté serveur (seul son hash est conservé en base). Le navigateur reçoit un cookie HttpOnly, SameSite=Strict et Secure en production, valable 180 jours. Sur ce même navigateur, l’ouverture de /admin.html rétablit automatiquement une session administrateur sans ressaisie des identifiants. L’autorisation est liée au cookie de ce navigateur, pas à une preuve matérielle absolue de l’appareil. Le bouton « Retirer l’autorisation de cet appareil » révoque ce jeton. Une déconnexion explicite révoque également l’autorisation persistante. Une première connexion avec les identifiants reste nécessaire pour autoriser l’appareil.

## Restauration d'une sauvegarde dans une base de test isolée

La commande `npm run restore:test -- chemin/vers/sauvegarde.json` restaure un export JSON ORVIA45 uniquement dans une base PostgreSQL de test. Elle exige `RESTORE_DATABASE_URL`, `DATABASE_URL` (URL de production utilisée uniquement pour comparaison), `ORVIA45_RESTORE_MODE=isolated-test` et `ORVIA45_RESTORE_CONFIRM=I_UNDERSTAND_THIS_IS_TEST_ONLY`. Les deux URL doivent désigner des bases différentes. `RESTORE_PGSSL=true` active TLS avec vérification du certificat.

La cible doit être initialisée avec le schéma ORVIA45 compatible et toutes ses tables publiques doivent être vides. L'import s'exécute dans une transaction ; toute erreur entraîne un rollback. Les références étrangères non nullables sont ordonnées, les références nullables sont rétablies après insertion, et les séquences sont recalées. Les cycles non nullables, les clés primaires absentes, les tables manquantes et les schémas incompatibles provoquent un refus. La commande n'offre volontairement aucun mode de restauration en production.

Cette procédure ne restaure que les données présentes dans l'export JSON : elle ne restaure ni les fichiers téléversés ni les sessions exclues. Avant utilisation, effectuer un essai sur une base jetable et contrôler manuellement les soldes, écritures comptables, souscriptions, retraits et relations utilisateurs. Ne jamais définir `RESTORE_DATABASE_URL` sur la base de production.
