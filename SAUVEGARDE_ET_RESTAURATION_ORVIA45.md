# Sauvegarde et restauration ORVIA45

## 1. Export manuel depuis l'administration

Dans **Journal des activités → Sauvegarde des données**, un administrateur connecté peut télécharger un export JSON cohérent des lignes des tables PostgreSQL du schéma `public`. Les sessions (`sessions`, `special_control_sessions`, `trusted_admin_devices`) sont exclues. Le fichier contient une empreinte SHA-256 et peut contenir des données personnelles, financières et des empreintes de mots de passe : conservez-le dans un espace privé à accès restreint.

Cet export est **un export logique de données uniquement** (export de données uniquement). Il ne contient ni définitions du schéma SQL, ni fichiers du dossier `uploads`. Il ne doit pas être considéré comme une image complète restaurable sur une base vide.

## 2. Sauvegarde automatique vers un stockage objet S3 compatible

Le dépôt contient maintenant `scripts/backup-to-s3.js`. Ce script crée un instantané PostgreSQL cohérent en lecture seule, puis envoie le fichier JSON directement vers un stockage objet S3 compatible via HTTPS et signature AWS Signature Version 4. Aucun fichier de sauvegarde n'est conservé sur le disque éphémère de l'application.

### Variables secrètes à configurer dans Render

Dans les variables d'environnement du service Cron (ne jamais inscrire ces valeurs dans le code ou dans une conversation) :

- `DATABASE_URL` : URL de la base PostgreSQL ORVIA45.
- `S3_ENDPOINT` : URL HTTPS du fournisseur de stockage objet.
- `S3_BUCKET` : nom du bucket privé.
- `S3_REGION` : région S3 du bucket (facultatif, valeur par défaut `us-east-1`).
- `S3_ACCESS_KEY_ID` : identifiant de clé ayant uniquement le droit d'écrire dans le bucket dédié.
- `S3_SECRET_ACCESS_KEY` : secret correspondant.
- `S3_PREFIX` : préfixe de rangement (facultatif, valeur par défaut `orvia45/backups`).
- `PGSSL` : mettre `true` si la connexion PostgreSQL exige SSL avec certificat vérifié.

### Création du Cron Job Render

1. Créer un **nouveau Cron Job** Render à partir du même dépôt Git que l'application.
2. Choisir la même branche que le service Web et la commande de build `npm install`.
3. Définir la commande : `npm run backup:s3`.
4. Choisir une fréquence quotidienne, par exemple `0 2 * * *` (02:00 UTC).
5. Ajouter au Cron Job les variables ci-dessus depuis l'interface Render, en réutilisant la connexion PostgreSQL et les secrets du fournisseur de stockage.
6. Lancer une exécution manuelle et vérifier dans les logs le message `Sauvegarde ORVIA45 envoyée` ainsi que la présence de l'objet dans le bucket.
7. Configurer côté fournisseur une politique de rétention (par exemple 30 à 90 jours) et, si possible, le versioning et le chiffrement du bucket.

Le code est prêt à être exécuté, mais **aucune sauvegarde distante n'est active tant que le Cron Job et les variables secrètes ne sont pas configurés et qu'une exécution réussie n'a pas été vérifiée**. Le script actuel sauvegarde les données PostgreSQL, pas le schéma ni le dossier `uploads`.

## 3. Restauration

Aucune restauration destructive n'est exposée dans l'interface. Avant d'en développer une, il faut définir une sauvegarde complète incluant schéma et fichiers téléversés, vérifier l'intégrité de l'archive, restaurer dans une base séparée de test, puis prévoir une confirmation explicite et une sauvegarde préalable de la base cible. Ne restaurez jamais un fichier JSON arbitraire directement en production.

## 4. Vérification d'un export avant toute restauration

Avant d'utiliser un export manuel, téléchargez-le dans un environnement de confiance et exécutez :

```bash
npm run backup:validate -- chemin/vers/orvia45-data-backup.json
```

Le validateur contrôle le format ORVIA45, l'empreinte SHA-256, l'unicité et la syntaxe des noms de tables ainsi que le nombre de lignes. Il ne se connecte pas à PostgreSQL et ne restaure ni ne modifie aucune donnée. Une validation réussie ne garantit pas la compatibilité du schéma cible. La restauration reste volontairement désactivée tant qu'un processus complet incluant schéma, fichiers téléversés, sauvegarde préalable de la cible et test sur une base isolée n'est pas disponible.

## Préparation d'une restauration en environnement de test

La commande `npm run restore:prepare-test -- chemin/vers/sauvegarde.json` effectue une pré-vérification uniquement. Elle exige `RESTORE_DATABASE_URL`, `DATABASE_URL`, `ORVIA45_RESTORE_MODE=isolated-test` et `ORVIA45_RESTORE_CONFIRM=I_UNDERSTAND_THIS_IS_TEST_ONLY`. La cible doit être une base distincte de la production, avec le schéma compatible et les tables concernées vides. Elle vérifie le format, l'empreinte, les tables, les colonnes et l'état vide. **Elle n'importe aucune donnée et ne modifie aucune table.** Une véritable procédure d'import doit être conçue et testée séparément avant toute activation.

## Contrôle après restauration isolée

La commande `npm run restore:test -- chemin/vers/sauvegarde.json` peut importer un export de données dans une base PostgreSQL dédiée au test, distincte de la production et entièrement vide. Avant le `COMMIT`, le script recompte les lignes de chaque table importée et compare ces nombres au manifeste de sauvegarde. Il refuse également de valider la transaction si des contraintes de clés étrangères de la cible sont déclarées non validées. Toute erreur provoque un `ROLLBACK`. Ce mécanisme ne remplace pas la vérification métier manuelle des soldes, souscriptions, retraits, commissions et comptes après import. L'export demeure limité aux données : le schéma et les fichiers téléversés doivent être restaurés séparément.
