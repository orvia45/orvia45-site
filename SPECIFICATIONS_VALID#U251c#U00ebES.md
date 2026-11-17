# SMILE — décisions validées au 2 novembre 2026

Ce document rassemble les règles métier confirmées par le propriétaire du projet. Il sert de référence pour les prochaines étapes de développement. Il ne signifie pas que tous les parcours sont déjà programmés.

## 1. Plateformes et architecture cible

- Un site web et une application Android.
- Les deux interfaces utiliseront le même backend, la même base de données et les mêmes comptes utilisateurs.
- Espace administrateur distinct, prévu à l'adresse `admin.smile.tg` (domaine et sous-domaine non enregistrés/configurés à ce stade).
- Identifiant administrateur souhaité : `tiktokanglais1111@gmail.com`.
- Un seul administrateur principal ; pas d'inscription publique d'administrateur. Aucun mot de passe ne doit être communiqué dans le code ou dans une conversation : prévoir une procédure de création/réinitialisation sécurisée.

## 2. Portefeuille, dépôts et comptabilité

- Moyens de dépôt prévus : Flooz et Mixx (TMoney).
- Un dépôt apparaît d'abord « En attente ».
- L'administrateur valide ou refuse le dépôt après vérification de la réception réelle des fonds auprès du prestataire. Un reçu ou une capture d'écran seul ne constitue pas une preuve suffisante.
- Le portefeuille utilisateur conserve le montant déposé comme somme due à l'utilisateur tant qu'il n'est pas investi ou retiré.
- La comptabilité doit distinguer au minimum : soldes dus aux utilisateurs, montants affectés aux investissements et fonds/revenus propres de SMILE.
- Le tableau de bord administrateur doit afficher ces montants séparément, ainsi que les totaux des dépôts, retraits, investissements et commissions.

## 3. Investissements et retraits

- Un utilisateur doit avoir au moins un investissement validé pour pouvoir demander un retrait.
- Un investissement partiel suffit : le solde non investi peut faire l'objet d'une demande de retrait, selon les conditions applicables.
- La partie investie est indisponible au retrait tant que les conditions contractuelles de l'investissement ne permettent pas sa libération.
- La durée des investissements n'est pas décidée ; ne pas fixer de durée par défaut.
- Moyens de retrait prévus : Flooz et Mixx (TMoney).
- Chaque demande de retrait passe par le statut « En attente » et une décision manuelle de l'administrateur.
- Frais de retrait : 10 % du montant demandé. Afficher clairement les frais et le montant net avant confirmation. Exemple : demande de 10 000 F CFA, frais de 1 000 F CFA, montant net de 9 000 F CFA.
- Prévoir des protections contre les paiements en double et ne marquer un retrait payé qu'après confirmation fiable du prestataire.

## 4. Parrainage

- Lien personnel de parrainage et rattachement automatique du filleul lors de l'inscription.
- Trois niveaux ; nombre de filleuls directs non limité.
- Taux internes : niveau 1 = 10 %, niveau 2 = 3 %, niveau 3 = 1 %.
- Commission calculée uniquement sur le premier investissement validé du filleul, une seule fois.
- Un niveau absent ne reçoit rien et sa part n'est pas redistribuée.
- Les taux restent réservés à l'administration et ne sont pas affichés publiquement aux utilisateurs.

## 5. Comptes et sécurité

- L'administrateur peut suspendre et réactiver un compte.
- Un compte suspendu ne peut plus se connecter, déposer, investir ou demander un retrait jusqu'à sa réactivation.
- L'administrateur peut déclencher une procédure sécurisée de réinitialisation du mot de passe en cas d'oubli ; il ne voit jamais le mot de passe existant.
- Journaliser les actions administrateur sensibles (suspension, réactivation, validations, refus et réinitialisations).

## 6. Notifications et service client

- Notifications uniquement à l'intérieur du site et de l'application SMILE (pas d'e-mail ni de SMS pour le moment).
- Prévoir un centre de notifications et un historique.
- Événements : dépôt accepté/refusé, retrait accepté/refusé, investissement validé, commission reçue, compte suspendu/réactivé.
- Les utilisateurs pourront envoyer un message au service client directement depuis SMILE. Le traitement des messages devra être accessible dans l'espace d'administration.
- Le numéro de téléphone du service client ne doit pas être affiché dans l'interface ; les coordonnées de support seront précisées ultérieurement.

## 7. Points non décidés / prérequis avant argent réel

- Durée et conditions contractuelles des investissements : à définir plus tard.
- Frais éventuels autres que les 10 % de retrait : non décidés.
- Coordonnées du service client : à fournir plus tard.
- Prestataire technique agréé pour les encaissements et décaissements Flooz/Mixx (TMoney) : à sélectionner et contractualiser.
- Vérifier le cadre légal et réglementaire applicable au Togo/UMOA, les obligations KYC/LCB-FT, la protection des données et les documents contractuels avant tout lancement avec argent réel.
- Tant que les autorisations, contrats de paiement et contrôles ne sont pas en place, les fonctions d'argent réel doivent rester désactivées. Ne pas promettre de rendement garanti.

## 8. État de cette livraison

Cette archive contient le socle technique antérieur et le présent relevé de décisions. Les règles de ce document sont des exigences à développer et tester ; elles ne sont pas toutes implémentées dans l'application actuelle. Les parcours complets d'investissement, de retrait, de notifications, de support et d'administration restent à construire et à vérifier.

## 9. Comptabilité intégrée — version 1.7

- Grand livre en partie double : chaque opération comptabilisée produit une écriture équilibrée et identifiée par une clé d'idempotence unique.
- Dépôt validé : débit de l'encaisse SMILE et crédit du portefeuille dû à l'utilisateur.
- Investissement validé : débit du portefeuille disponible et crédit des fonds investis (toujours dus à l'utilisateur et bloqués jusqu'à libération explicite).
- Commission de parrainage du premier investissement : débit des charges de commissions et crédit du portefeuille du parrain.
- Retrait payé : débit du portefeuille du montant brut, crédit de l'encaisse du montant net payé et crédit des frais de retrait (10 %).
- Une demande de retrait en attente réserve le montant pour empêcher une seconde demande ou un investissement concurrent. Elle n'est comptabilisée comme sortie de trésorerie qu'après paiement confirmé par l'administrateur avec référence prestataire.
- Le tableau de bord calcule l'encaisse, les portefeuilles dus, les fonds investis, les retraits en attente/payés, les frais et les fonds nets SMILE à partir du grand livre. Les anciennes lignes de dépôts approuvés et commissions existantes sont reprises de manière idempotente lors de l'initialisation.
- Les durées d'investissement restent indéfinies : aucun déblocage automatique n'est programmé. La libération des fonds investis nécessite une décision métier et contractuelle ultérieure.
- La comptabilité n'est fiable que pour les opérations enregistrées dans ce système et les soldes d'ouverture rapprochés avec les relevés réels. Les encaissements/décaissements Flooz/Mixx (TMoney) et les rapprochements bancaires ne sont pas encore connectés à un prestataire.


## Quotas personnels par offre — règle ajoutée le 02/11/2026
- Chaque utilisateur reçoit, pour chaque offre, un quota total attribué par l'administration.
- Le compte utilisateur affiche le nombre de souscriptions restantes à côté de l'offre (ex. 1/2).
- Une souscription confirmée exécute automatiquement l'investissement, débite le portefeuille, crédite les fonds investis au grand livre et réduit le quota d'une unité.
- Lorsque le compteur atteint zéro, l'API refuse toute nouvelle souscription pour cette offre; les autres offres restent indépendantes.
- L'administration attribue/modifie le quota depuis Comptes & parrainage avec l'identifiant public SMILE. Une limite ne peut pas être réduite sous le nombre de souscriptions déjà consommées.
- Les modifications de quota et les investissements sont protégés par transactions SQL et verrous pour éviter les dépassements concurrents.
- Les offres de démonstration existantes sont préchargées dans la table investment_offers; aucun paiement réel n'est activé par cette modification.


## Module d’administration des offres — version 1.10
- L’administrateur peut créer et modifier les offres depuis son espace, sans intervention dans le code.
- Champs gérés : code unique, nom, description, durée, montant unique fixe par souscription, montant total à recevoir, quota initial automatique et statut actif/suspendu.
- Le quota initial est attribué une seule fois par utilisateur et par offre lors du premier chargement des offres. Une modification ultérieure du quota par défaut ne modifie pas les quotas déjà attribués.
- Chaque souscription confirmée consomme une unité du quota ; à zéro, l’API refuse toute nouvelle souscription.
- La validation des montants minimum et maximum est effectuée côté serveur.
