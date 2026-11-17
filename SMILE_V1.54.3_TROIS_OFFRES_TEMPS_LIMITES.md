# SMILE v1.54.3 — Trois nouvelles offres Temps Limité

Cette version ajoute, par migration idempotente au démarrage du serveur, trois offres dans la catégorie `limited` :
- SM-LIMITED-30D — SM Durée limitée 30 jours — montant de base 20 000 XOF — profit attendu indicatif 270 000 XOF ;
- SM-LIMITED-130D — SM Durée limitée 130 jours — montant de base 20 000 XOF — profit attendu indicatif 720 000 XOF ;
- SM-LIMITED-190D — SM Durée limitée 190 jours — montant de base 20 000 XOF — profit attendu indicatif 1 120 000 XOF.

Chaque offre est créée active mais non publiée, achats désactivés, sans dates de vente définies, avec limite personnelle 1, stock 200, choix de réservation 20 000 / 50 000 / 110 000 / 180 000 XOF, portefeuille produit initial à 0 et 3 réservations restantes. Elles doivent être vérifiées, programmées et lancées par l'administrateur avant d'être visibles aux membres.

Le montant total prévu stocké (`display_value_cfa`) est le montant de base plus le profit attendu, car l'interface calcule le profit comme différence entre cette valeur et le montant investi. Les profits sont affichés comme indicatifs et ne constituent pas une garantie.

La migration `smile-limited-30-130-190-v1` empêche la création en double lors des redémarrages. Aucune donnée membre ou historique existant n'est supprimé.
