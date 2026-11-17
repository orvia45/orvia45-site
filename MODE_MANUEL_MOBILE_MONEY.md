# Mode manuel Mobile Money — v1.40

- Les formulaires de dépôt Flooz et Mixx (TMoney) permettent de saisir montant, numéro émetteur et référence.
- Le dépôt reste en attente : seul l'administrateur peut le confirmer après vérification réelle du montant et de la référence. Le serveur crédite le portefeuille lors de cette validation.
- Les retraits Mixx (TMoney)/Flooz demandent montant, opérateur, numéro destinataire et PIN à six chiffres. Le montant est réservé dès la demande. L’administrateur doit d’abord approuver la demande, puis effectuer le transfert réel et confirmer sa référence pour passer au statut payé.
- L'administrateur effectue le transfert lui-même, puis confirme le paiement avec sa référence. En cas de rejet, le journal rembourse le portefeuille.
- Aucun appel API, paiement automatique ou décaissement automatique n'est intégré.
- `MOBILE_MONEY_ENABLED=true` par défaut : les formulaires de dépôt et retrait restent accessibles. Le mode manuel impose une vérification et une approbation administrative pour chaque opération. Aucun paiement automatique ou appel API n'est déclenché.
- PostgreSQL (`DATABASE_URL`) et les variables privées de sécurité doivent être configurés sur l'hébergement avant utilisation.

Ne jamais partager de PIN, mot de passe ou clé secrète. Effectuer les vérifications en environnement de test avant toute utilisation avec de l'argent réel.
