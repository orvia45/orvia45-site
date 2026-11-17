# SMILE — Gestion manuelle des dépôts et retraits

## Dépôts : validation par l'administrateur
1. Le membre soumet une demande avec montant, opérateur, téléphone et référence.
2. La demande apparaît dans Administration > Finance > Dépôts à traiter.
3. L'administrateur vérifie la réception réelle dans son compte marchand ou auprès de l'opérateur.
4. Il confirme la référence et le montant exacts, puis valide.
5. Le portefeuille est crédité dans une transaction comptable unique. Le premier dépôt validé déclenche les commissions de parrainage prévues, une seule fois.
6. Un dépôt refusé ne crédite jamais le portefeuille.

## Retraits : paiement manuel puis confirmation
1. Le membre soumet une demande de retrait avec son PIN et son bénéficiaire Mobile Money.
2. La demande apparaît dans Administration > Finance > Demandes de retrait.
3. Le montant demandé est réservé/déduit du solde disponible et inscrit au grand livre.
4. L'administrateur effectue lui-même le transfert Mobile Money.
5. Après le transfert réel, il saisit la référence et clique sur « Confirmer le paiement effectué ».
6. En cas de refus, le montant réservé est recrédité au membre.

## Sécurité et précautions
- Les actions d'administration sont protégées par authentification et contrôles côté serveur.
- Les opérations déjà traitées ne peuvent pas être confirmées une seconde fois.
- Les références de paiement sont uniques.
- Vérifier la réception réelle avant de valider un dépôt et effectuer réellement le transfert avant de marquer un retrait comme payé.
- Conserver les justificatifs de chaque opération.
- Les paiements Mobile Money sont activés par défaut (`MOBILE_MONEY_ENABLED=true`) pour que les formulaires Mixx (TMoney) et Flooz restent accessibles. Cette activation ne valide aucune opération : chaque dépôt et chaque retrait exige une décision administrative. Aucun transfert automatique ni appel API de paiement n'est effectué.

## Mise en service
1. Déployer les fichiers sur le serveur Node.js et PostgreSQL de SMILE (GitHub Pages seul ne peut pas exécuter l'API).
2. Configurer `DATABASE_URL`, les secrets administrateur et les autres variables privées sur l'hébergeur.
3. Appliquer le schéma PostgreSQL prévu par le projet.
4. Tester avec des comptes et de petits montants en environnement de test, puis vérifier le grand livre et l'historique.
5. Configurer les numéros marchands et instructions Mixx (TMoney)/Flooz dans l'administration avant les opérations réelles; les demandes restent soumises à vérification et approbation administrative.

Cette archive contient les écrans et routes de validation manuelle. Elle ne constitue pas une preuve de connexion à un compte marchand réel et les transferts ne sont pas envoyés automatiquement.
