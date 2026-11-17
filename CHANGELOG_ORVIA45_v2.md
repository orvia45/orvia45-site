# ORVIA 45 + SMILE — Version 2

## Changements
- Bannière VIP de l'accueil remplacée par une bannière ORVIA 45 bleu nuit et or.
- Présentation des offres à durée limitée harmonisée avec la palette ORVIA 45 : en-tête, compte à rebours, montants et bouton d'action.
- Retrait de l'ancienne image de bannière SMILE de l'écran d'accueil.
- Libellés visibles utilisateur et administration harmonisés sur ORVIA 45.
- Texte institutionnel hérité non vérifié retiré du code actif.
- Identifiants de base de données, codes d'offres et noms techniques SMILE conservés pour éviter de casser les données et les migrations historiques.

## Vérification
- `node --check app.js`
- `node --check admin.js`
- `node --check server.js`
- `npm test`

Les tests automatisés valident les règles métier et les contrôles de régression du code. Ils ne remplacent pas une recette complète avec PostgreSQL, des comptes de test et les opérateurs Mobile Money.


## Version 2.1 — compte utilisateur et navigation admin
- Ajout des raccourcis du compte utilisateur : IA (première tuile), SUPER IA, Temps limité, Revenu quotidien et Produit d’équipe.
- Chaque raccourci ouvre la catégorie correspondante dans les offres publiées.
- La tuile sélectionnée est mise en évidence en bleu et le style s’adapte aux petits écrans.
- L’entrée du menu administrateur est désormais nommée explicitement « Gestion des offres ».
- Cache de l’application incrémenté pour forcer le rechargement des nouveaux fichiers côté navigateur.
- Aucun écran ni contrôle de vérification d’identité n’a été ajouté.

### Vérification complémentaire
- 93 tests automatisés réussis sur 93.
- Vérifications de syntaxe Node.js réussies pour app.js, admin.js et server.js.


## Version 2.2 — protection des conditions payées
- Ajout d'un verrou PostgreSQL sur les souscriptions ayant un instantané contractuel : les conditions, montants, échéances et identifiants d'offre ne peuvent plus être modifiés après paiement.
- Suppression des souscriptions payées avec instantané également bloquée au niveau de la base.
- Les modifications futures d'une offre restent possibles pour le stock encore disponible et continuent d'être historisées avec l'administrateur, la date et le motif.
- Ajout de tests automatisés ciblant l'instantané et sa protection SQL.

## Amélioration du service client utilisateur
- Ajout d'un compteur de réponses administrateur non lues dans la tuile Service client du compte utilisateur.
- Actualisation automatique du compteur toutes les 20 secondes pendant une session connectée.
- Actualisation automatique de la conversation toutes les 20 secondes lorsqu'elle est ouverte, sans reconstruire inutilement les messages inchangés.
- Conservation de la position de lecture lorsque l'utilisateur est déjà proche du bas de la conversation.
- Nouvel endpoint `/api/support/unread-count`, protégé par la session utilisateur et limité aux réponses administrateur non lues.
- Tests automatisés dédiés ajoutés.

## Journal des activités administratives
- Ajout d'un écran « Journal des activités » dans l'administration.
- Consultation en lecture seule des événements issus du journal d'audit existant, avec date, acteur, action, type d'entité et référence.
- Recherche par action, administrateur, e-mail, type ou référence, et filtres de dates.
- Résultats limités à 500 événements et triés du plus récent au plus ancien.
- Export CSV des résultats filtrés pour archivage et contrôle.
- Endpoint réservé à une session administrateur ; aucune donnée de mot de passe, PIN ou secret n'est exposée.
- Trois tests de régression ajoutés.

### Vérification
- `node --check server.js`
- `node --check admin.js`
- `npm test` : 119 tests réussis, 0 échec.

## Dossier détaillé des utilisateurs — 17 novembre 2026
- Ajout d'une fiche détaillée accessible depuis chaque compte dans l'administration.
- Consultation des dépôts, retraits, souscriptions et commissions de parrainage (100 derniers éléments par catégorie).
- Affichage du solde portefeuille issu du grand livre comptable, des totaux financiers et des informations de parrainage.
- Route de détail réservée à une session administrateur et limitée aux comptes ayant le rôle utilisateur.
- Aucun hash de mot de passe ni PIN n'est exposé dans la réponse.
- Mise en page adaptative mobile et commande pour ouvrir/masquer le dossier.
- Vérifications : 124 tests automatisés réussis.

## 17 novembre 2026 — Alertes financières et rapports journaliers
- Ajout d'un endpoint d'alertes financières réservé à l'administration : références de paiement dupliquées, opérations en attente depuis plus de 24 heures et dépôts validés sans indicateur de vérification.
- Ajout d'un rapport journalier sur une période limitée à 367 jours, avec dépôts validés, retraits payés, investissements et commissions.
- Ajout d'un tableau de détail quotidien et d'un export CSV compatible tableur dans Comptabilité & rapports.
- Ajout de tests automatisés dédiés aux autorisations, contrôles de période et exports.


## Lot de pilotage complémentaire — 17 novembre 2026
- Ajout d’un rapport administrateur du réseau de parrainage : parrains, filleuls, nombre et montant des commissions ventilés par niveau, avec filtres de dates.
- Ajout d’un rapport de performance par offre : souscriptions validées/en attente/libérées, montants investis, retours libérés et ticket moyen.
- Ajout de synthèses KPI pour les deux rapports.
- Ajout de l’export CSV du rapport de parrainage.
- Ajout de l’export CSV du rapport de performance des offres.
- Les deux rapports sont protégés par l’authentification administrateur et utilisent les données déjà enregistrées, sans modifier le grand livre ni recalculer les commissions.

## Rubriques personnalisées des offres
- Ajout d'un nom de rubrique libre (60 caractères maximum) dans le formulaire administrateur des offres.
- Les offres portant le même nom personnalisé sont regroupées sous un onglet commun dans l'espace utilisateur ; des noms différents créent des rubriques distinctes à l'intérieur de leur catégorie fonctionnelle.
- Le champ est facultatif : les offres existantes conservent automatiquement leurs rubriques historiques.
- La migration ajoute une colonne sans modifier ni supprimer les souscriptions ou leurs conditions enregistrées.


## Mise à jour — pré-réservations et ouverture publique en deux temps

- Ajout du champ `reservation_end_at`, distinct de `sale_start_at` et `sale_end_at`.
- Chaque fiche produit à temps limité affiche deux comptes à rebours simultanément : fin des pré-réservations en haut, ouverture officielle des ventes en bas.
- Les pré-réservations sont payées immédiatement, limitées par le nombre de places configuré et activées à l'ouverture officielle.
- À la fin des pré-réservations, les réservations sont bloquées côté serveur ; à l'ouverture officielle, les achats normaux deviennent accessibles sans être bloqués par le quota de pré-réservations.
- Les dates sont configurables depuis le formulaire administrateur. L'ordre fin des pré-réservations < ouverture officielle est contrôlé.
- Les autres modules et historiques existants sont conservés.

### Vérification des sauvegardes avant restauration
- Ajout de `npm run backup:validate -- fichier.json` pour vérifier le format, le SHA-256, les noms uniques des tables et les nombres de lignes.
- La commande est strictement non destructive : elle ne se connecte pas à la base et ne restaure aucune donnée.
- Ajout de tests couvrant sauvegarde valide, altération, nom de table invalide et incohérence du nombre de lignes.
