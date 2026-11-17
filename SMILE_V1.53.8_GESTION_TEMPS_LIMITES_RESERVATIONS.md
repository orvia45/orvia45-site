# SMILE v1.53.8 — Gestion des temps limités et réservations anticipées

- Ajout du menu administrateur principal « GESTION DES TEMPS LIMITÉS ».
- Création idempotente du produit brouillon « SM Durée limitée 27.9 » (code SM-LIMITED-279).
- Valeurs de démonstration modifiables : 9 jours, prix de référence 20 000 XOF, profit annoncé 90 200 XOF (total prévu 110 200 XOF), limite personnelle 2, stock 80 000, montants proposés 20 000 / 50 000 / 110 000 / 180 000 XOF, réservations restantes 3.
- Le produit est créé non publié, sans dates, et n’est donc pas visible aux membres. L’administrateur doit renseigner les dates de début et de fin avant lancement.
- Avant la date de début, le produit publié et programmé affiche un compte à rebours et le bouton « Réserver ». La réservation est payée intégralement immédiatement et activée à la date de mise en ligne.
- Une fois en ligne, le bouton affiche « Souscrire maintenant ».
- Les réservations payées sont suivies dans « Mes produits » comme « Réservé — activation à venir » jusqu’à la date programmée.
- Aucune annulation ni aucun remboursement n’est prévu. Les contrôles de solde, stock, limite personnelle et idempotence restent côté serveur dans une transaction PostgreSQL.
- Le visuel fixe existant « SMILE – Durée limitée » n’est pas remplacé. Les images propres à chaque produit restent modifiables par l’administrateur.

## Déploiement requis
Cette archive n’est pas déployée automatiquement. Il faut déployer les fichiers du projet sur l’hébergement et redémarrer le serveur pour que la migration crée le produit brouillon dans la base PostgreSQL. Avant toute vente réelle, valider les valeurs indicatives et les conditions commerciales/réglementaires.
