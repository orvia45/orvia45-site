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
