## Produits SM Durée limitée — v1.53.6

La gestion des offres prend en charge les champs de programmation des produits « Temps limité » : début/fin de vente, choix de montants de réservation, solde du portefeuille produit et réservations restantes. Les utilisateurs voient un compte à rebours avant l’ouverture puis avant la fin. À expiration, le produit disparaît automatiquement du catalogue et l’API refuse les achats. Le retrait manuel du catalogue utilisateur conserve les historiques et les transactions existantes.

**Réservations payées (v1.53.7) :** le montant choisi est le prix définitif du produit. Le serveur contrôle la disponibilité, le stock, la limite personnelle, le compteur de réservations et le solde, puis débite le portefeuille SMILE une seule fois dans une transaction atomique. La réservation est enregistrée comme achat intégralement payé, sans solde restant, annulation ni remboursement. Le compteur restant diminue et le portefeuille du produit est augmenté. Les montants alternatifs calculent le total prévu proportionnellement au montant de référence configuré.

# SMILE — audit et corrections de sécurité financière v1.52.7

Le projet conserve son interface web actuelle et ajoute un premier socle serveur pour préparer la vraie plateforme.

## Application installable Android et iPhone (PWA) — v1.53.5

Le site peut être installé depuis un navigateur compatible grâce au manifeste `manifest.webmanifest` et au service worker `service-worker.js`. Il réutilise la même interface, la même API et les mêmes comptes que le site web. Il ne s’agit pas d’un APK Android natif ni d’une application iOS publiée sur les boutiques. L’installation exige un hébergement HTTPS.

- Android : Chrome → menu → « Installer l’application » ou « Ajouter à l’écran d’accueil ».
- iPhone/iPad : Safari → Partager → « Sur l’écran d’accueil ».
- Les ressources statiques de l’interface peuvent être conservées pour accélérer l’ouverture; toutes les routes `/api/` restent hors cache. Les fonctions nécessitant un compte et les opérations financières demandent une connexion Internet.
- Le projet natif Android/iOS et les publications Play Store/App Store restent des livrables séparés.

## Démarrage local

1. Installer Node.js 18 ou plus et PostgreSQL 14 ou plus.
2. Créer une base et un utilisateur PostgreSQL dédiés à SMILE.
3. Copier `.env.example` vers `.env` et renseigner `DATABASE_URL`. Les identifiants administrateur seront définis ultérieurement dans l’environnement serveur sécurisé (`ADMIN_EMAIL`, `ADMIN_PASSWORD` et `ADMIN_NAME`) ; ne pas les inscrire dans le dépôt ni les envoyer dans une conversation.
4. Installer les dépendances avec `npm install`.
5. Charger les variables d'environnement (par exemple avec `set -a; . ./.env; set +a` sous Linux/macOS), puis lancer `npm start`.
6. Ouvrir `http://localhost:3000` pour le site et `http://localhost:3000/admin.html` pour l’espace administrateur. L’API de santé est disponible sur `/api/health`.

Le serveur crée les tables de base au démarrage et crée le premier compte administrateur si l'adresse `ADMIN_EMAIL` n'existe pas.

## API préparée

- `POST /api/auth/register` — crée un compte et rattache le parrain existant transmis dans `ref`.
- `POST /api/auth/login` et `POST /api/auth/logout` — authentification et fermeture de session.
- `GET /api/auth/me` — état de la session.
- `GET /api/team` — lien de parrainage et nombre de membres par niveau (3 niveaux).
- `GET /api/admin/summary` — résumé réservé à l'administrateur (utilisateurs, dépôts validés/en attente et commissions).
- `POST /api/admin/deposits/approve` — validation administrative uniquement après confirmation vérifiée du paiement par le prestataire.

Les mots de passe sont dérivés avec scrypt; les jetons de session sont aléatoires, stockés sous forme de hash et placés dans un cookie HttpOnly SameSite=Lax. En production, le site doit impérativement être servi en HTTPS (`NODE_ENV=production`).

## État de la version 1.52.6 — historique du périmètre et limites vérifiables

## Version 1.52.8 — espace VIP utilisateur

Ajout de l’affichage des objectifs confirmés VIP5 à VIP10, des rémunérations mensuelles et journalières annoncées, des cartes VIP défilantes et du raccourci Espace VIP accessible depuis l’accueil. Les seuils d’équipe VIP9 et VIP10 restent explicitement à confirmer. L’activation des niveaux reste bloquée tant que les conditions et validations côté serveur ne sont pas implémentées. Les avantages détaillés nécessitent le référentiel complet validé.

## État de la version 1.52.7 — périmètre et limites vérifiables

Cette version contient une application web reliée à une API Node.js et à PostgreSQL. Les fonctions décrites dans les sections ci-dessous existent dans le code, mais leur disponibilité en production dépend de la configuration et des essais sur l'instance hébergée. Les tests automatisés locaux ne remplacent pas une recette sur la base PostgreSQL de production.

### Fonctions présentes dans le code

- Authentification séparée des espaces utilisateur et administrateur, sessions persistées et mots de passe dérivés avec scrypt.
- Gestion des offres, publication, stock et limites personnelles par membre.
- Achats contrôlés côté serveur : chaque offre publiée et disponible peut être achetée indépendamment, sans obligation de souscrire aux offres précédentes; les écritures financières restent transactionnelles.
- Dépôts Mixx (TMoney) et Flooz soumis à vérification manuelle et approbation administrative avant crédit.
- Retraits soumis à approbation administrative; le paiement n'est enregistré comme effectué qu'après confirmation manuelle et référence de transfert.
- Grand livre en partie double, historique, notifications internes, journal d'audit et messagerie du service client.

### Limites et éléments à configurer avant production

- Aucun appel API ni webhook opérateur Flooz/Mixx (TMoney) n'est intégré : les opérations Mobile Money sont manuelles.
- Les coordonnées marchandes doivent être renseignées et vérifiées par l'administrateur; aucune coordonnée n'est fournie par défaut.
- Les paramètres PostgreSQL, TLS, sauvegardes, supervision, stockage persistant des images et secrets Render doivent être configurés et testés.
- Les parcours complets doivent être testés sur une base PostgreSQL de recette, puis sur l'hébergement cible avec des comptes de test et sans argent réel.
- La conformité juridique, réglementaire, contractuelle et la communication des éventuels rendements doivent être validées par des professionnels compétents avant toute collecte de fonds ou lancement public.

**Ne pas considérer la plateforme comme autorisée à collecter de l'argent réel sur la seule base des tests automatisés.** La version ne déclenche aucun transfert Mobile Money automatique et n'approuve pas automatiquement les dépôts ou retraits.

## Décisions métier supplémentaires

Les règles confirmées pour les dépôts, retraits (frais de 10 %), suspension/réactivation des comptes, notifications internes, support client et séparation comptable sont consignées dans `SPECIFICATIONS_VALIDÉES.md`. Ce document distingue les décisions validées des fonctions qui restent à développer.

## Parrainage convenu

- Lien personnel et rattachement au moment de l'inscription.
- Trois niveaux, nombre de filleuls directs non limité.
- Taux internes: 10 %, 3 %, 1 % sur le premier investissement validé uniquement.
- Un niveau absent n'est pas payé et sa part n'est pas redistribuée.
- Les taux restent réservés à l'administration.
- Le moteur de calcul et ses tests sont fournis dans `referral-engine.js` et `tests/`.

## Comptabilité (version 1.7)
Le schéma crée un grand livre en partie double (`journal_transactions`, `journal_lines`) et les tables `investments` et `withdrawals`. Les dépôts approuvés créditent le portefeuille seulement après confirmation du paiement. Les investissements sont débités du portefeuille et suivis comme fonds investis. Les commissions de premier investissement sont créditées au portefeuille du parrain. Un retrait n'est comptabilisé comme payé qu'après confirmation manuelle et référence du prestataire; les frais sont calculés à 10 % du montant demandé.

Le tableau de bord admin présente les totaux calculés depuis le grand livre. Avant tout usage réel, configurer PostgreSQL, rapprocher les soldes d'ouverture avec les comptes de paiement, et intégrer un prestataire Flooz/Mixx (TMoney). Aucun solde initial ou mouvement externe n'est inventé. Les fonds investis ne sont pas automatiquement libérés puisque la durée n'a pas été décidée.


### Quotas d’investissement par utilisateur
Les quotas par offre sont attribués dans l’administration, rubrique « Comptes & parrainage ». Renseigner l’identifiant public SMILE, sélectionner une offre et fixer le nombre total de souscriptions. Le compte utilisateur affiche le compteur restant. Chaque souscription confirmée est exécutée automatiquement et décrémente le quota; à zéro, l’API bloque cette offre pour cet utilisateur. Les autres offres restent accessibles selon leurs quotas.


### Administration des offres
Depuis le menu « Offres d’investissement », l’administrateur peut créer et modifier les offres. Le quota défini est un quota par défaut, attribué automatiquement une seule fois à chaque utilisateur lors de son premier accès à l’offre. Les quotas déjà attribués restent inchangés lorsqu’un administrateur modifie le quota par défaut.


### Dépôts utilisateurs
Le formulaire utilisateur enregistre une demande Flooz ou TMoney avec montant, numéro payeur et référence de transaction. Les demandes restent en attente : seul un administrateur peut les valider après vérification réelle du paiement. Le portefeuille est crédité au moment de cette validation. Aucune API opérateur Mobile Money n'est intégrée : le traitement reste manuel.

## Version 1.13 — historique financier utilisateur
- Ajout de `GET /api/financial-history`, limité à l'utilisateur connecté, qui regroupe ses dépôts, retraits, investissements et commissions reçues (100 opérations récentes maximum).
- Remplacement du contenu provisoire « Historique financier » par une liste datée avec type, statut, montant, méthode et référence disponible.
- Pour les retraits, affichage séparé des frais et du montant net.
- Les écritures du grand livre restent inchangées : l'historique lit les opérations existantes sans modifier les soldes.


## Demandes de retrait (v1.14)

Le formulaire utilisateur permet de demander un retrait Flooz ou TMoney à partir de 500 FCFA. Un investissement approuvé ou libéré est requis. Les frais sont calculés à 10 % du montant demandé; le montant net est affiché avant l'envoi. Les demandes en attente réservent le montant demandé afin d'éviter une double utilisation du solde.

Dans l'administration > Gestion financière, l'administrateur peut confirmer un paiement après son exécution réelle, en saisissant la référence opérateur, ou rejeter la demande avec un motif. Le paiement confirmé débite le portefeuille et écrit les frais et le décaissement dans le grand livre. Cette version ne déclenche pas elle-même un transfert Flooz/Mixx (TMoney): le paiement reste manuel et doit être effectué dans le canal opérateur avant confirmation.

## Images et stock des offres
Depuis Administration → Offres d’investissement, l’administrateur peut téléverser une image PNG/JPEG/WebP (5 Mo maximum), définir un stock général ou laisser le champ vide pour un stock illimité, et conserver le quota individuel par utilisateur. Le stock consommé est calculé à partir des investissements validés/exécutés; l’API verrouille l’offre pendant chaque souscription afin d’éviter de dépasser le stock en cas de demandes simultanées. Les changements de stock sont inscrits dans `offer_stock_audit`. Appliquer `schema.sql` au déploiement avant d’activer cette version. Les images sont enregistrées dans `uploads/offers`; ce répertoire doit être conservé dans un stockage persistant et sauvegardé.


### Suivi des investissements et dates indicatives (v1.20–v1.35)
Les souscriptions conservent le montant investi, le montant total prévu et la durée affichée dans les conditions de l’offre. Une date calculée peut être conservée à titre indicatif. Depuis la v1.35, aucun traitement ne libère automatiquement les fonds : la libération attend une procédure contractuelle et réglementaire approuvée. Le crédit du portefeuille n’est jamais un paiement Mobile Money.

## Version 1.21 — Service client et notifications
- Messagerie interne utilisateur ↔ administrateur, avec historique des échanges et réponses depuis l’administration.
- Notifications internes consultables dans l’espace utilisateur et historique consultable depuis l’administration.
- L’administrateur peut envoyer une notification ciblée à partir de l’identifiant public SMILE de l’utilisateur.
- Les réponses du service client créent automatiquement une notification dans le compte utilisateur.
- Aucun envoi par SMS ou e-mail n’est effectué.
- Appliquer `schema.sql` à la base PostgreSQL avant le déploiement pour créer la table `support_messages`.
- Vérifications réalisées : contrôles syntaxiques Node.js et suite de tests existante. Aucune intégration PostgreSQL réelle ni test multi-utilisateur n’a été exécuté ici.

## Version 1.22 — Gestion des comptes utilisateurs
- Recherche des comptes par nom, adresse e-mail ou identifiant public SMILE.
- Consultation du statut, de la date d'inscription et des nombres de dépôts, investissements et retraits.
- Suspension/réactivation depuis l'administration; la suspension invalide immédiatement les sessions existantes et empêche les connexions.
- Chaque changement de statut est ajouté à `audit_logs` et une notification interne informe l'utilisateur.
- Réinitialisation par jeton aléatoire à usage unique, valable 30 minutes. L'administrateur transmet le lien généré à l'utilisateur; le mot de passe existant n'est jamais affiché. Après réinitialisation, toutes les sessions de l'utilisateur sont invalidées.
- Appliquer `schema.sql` au déploiement pour créer `password_reset_tokens`.
- Vérifications : `node --check server.js`, `node --check admin.js`, cinq tests unitaires existants et intégrité ZIP. Aucune intégration PostgreSQL réelle n'a été exécutée.


## Version 1.23 — audit et protection du solde disponible

Cette version corrige un défaut de contrôle détecté pendant la revue du code : une souscription à une offre pouvait auparavant vérifier le solde comptable sans déduire les demandes de retrait déjà en attente. Le serveur calcule désormais le solde disponible en retranchant les retraits en attente ou approuvés avant d'accepter une souscription.

Lors du paiement administratif d'un retrait, le serveur verrouille également le compte utilisateur et vérifie que le paiement demandé ne consomme pas les sommes encore réservées aux autres demandes de retrait. Cela réduit le risque de dépenser deux fois le même solde.

La version ajoute des tests unitaires pour le calcul du solde disponible et retire les anciens gestionnaires de routes dupliqués qui subsistaient en fin de fichier. Les anciens tests de parrainage restent présents.

### Résultats de vérification v1.23
- `node --check server.js`, `node --check app.js` et `node --check admin.js` : réussis.
- `npm test` : 8 tests réussis.
- Aucun test d'intégration PostgreSQL, test de concurrence multi-session, test Mobile Money ou audit de sécurité externe n'a été exécuté.
- Cette correction ne rend pas la plateforme prête pour l'argent réel. Les prérequis réglementaires, le prestataire Flooz/Mixx (TMoney), le rapprochement comptable, les sauvegardes et les tests de bout en bout restent indispensables.


## Version 1.25 — traçabilité des quotas administrateur

- Toute attribution ou modification de quota exige un motif (3 à 300 caractères).
- L'opération verrouille le compte et l'offre dans une transaction SQL.
- Une limite inférieure au nombre de souscriptions déjà utilisées est refusée.
- Chaque changement conserve l'ancienne limite, la nouvelle limite, le nombre déjà utilisé, l'administrateur, la date et le motif.
- L'espace administrateur permet de consulter l'historique global ou filtré par identifiant SMILE.


## v1.26 — Contrôle comptable

- Le solde disponible renvoyé par `GET /api/wallet/balance` provient du grand livre, qui intègre déjà le débit des retraits en attente. Le champ `reserved_cfa` reste informatif et n'est plus soustrait une seconde fois.
- Nouvelle route administrateur `GET /api/admin/accounting/audit` : contrôle les écritures déséquilibrées ou vides, les événements comptables manquants pour les dépôts approuvés, investissements et retraits selon leur statut, ainsi que l'égalité globale débits/crédits.
- La route d'audit est en lecture seule et renvoie `ok`, les compteurs et jusqu'à 50 exemples d'anomalies par catégorie.
- L'accès est réservé au rôle administrateur.

L'audit applicatif ne remplace pas une réconciliation bancaire/Mobile Money ni une vérification humaine des justificatifs. Effectuer une sauvegarde avant migration et tester sur une copie PostgreSQL avant toute mise en production.


## v1.27 — Rapprochement Mobile Money (Flooz / TMoney)

Cette version renforce la validation manuelle des dépôts : l'administrateur doit recopier la référence vérifiée dans le compte marchand, confirmer le montant exact reçu et attester explicitement de la réception avant tout crédit du portefeuille. Le serveur compare la référence et le montant aux données de la demande, verrouille la ligne en transaction et conserve l'administrateur, la date et la méthode de vérification (`manual`). Les validations restent idempotentes grâce au verrouillage de la demande et à la clé comptable unique du dépôt.

**Limite importante :** cette version ne réalise pas encore de connexion API/webhook directe à Flooz ou TMoney. Une intégration automatique nécessite la documentation technique officielle, les identifiants marchands/API, les URL de callback et les mécanismes de signature fournis par chaque opérateur. Ne placez jamais ces secrets dans le dépôt Git ou dans le navigateur. Jusqu'à cette intégration contractuelle, le rapprochement manuel décrit ci-dessus est la seule méthode activée.

## v1.28 — Supervision des paiements

- Nouvelle rubrique administrateur « Supervision des paiements » avec filtres par période, opérateur et statut.
- Indicateurs séparés pour dépôts en attente/validés et retraits en attente/payés, en nombre et en FCFA.
- Répartition par opérateur Flooz/Mixx (TMoney)/autre et historique récent des dépôts/retraits.
- Détection d'une même référence présente dans les deux flux (dépôt et retrait) pour examen manuel. Une alerte n'est pas une preuve de fraude.
- API protégée par le rôle administrateur : `GET /api/admin/payment-supervision`.
- Les chiffres sont calculés à partir des tables `deposits` et `withdrawals`; aucune donnée de démonstration n'est utilisée dans la rubrique réelle.

## v1.28 — Supervision des paiements

- Nouvelle rubrique administrateur « Supervision des paiements » avec filtres par période, opérateur et statut.
- Indicateurs séparés pour dépôts en attente/validés et retraits en attente/payés, en nombre et en FCFA.
- Répartition par opérateur Flooz/Mixx (TMoney)/autre et historique récent des dépôts/retraits.
- Détection d'une même référence présente dans les deux flux (dépôt et retrait) pour examen manuel. Une alerte n'est pas une preuve de fraude.
- API protégée par le rôle administrateur : `GET /api/admin/payment-supervision`.
- Les chiffres sont calculés à partir des tables `deposits` et `withdrawals`; aucune donnée de démonstration n'est utilisée dans la rubrique réelle.


## Modification des conditions des offres et souscriptions payées

- Les conditions de chaque souscription exécutée sont copiées dans `investments.offer_conditions_snapshot` et dans les colonnes de snapshot dédiées.
- Une modification d’offre par l’administration n’affecte pas les souscriptions existantes : elle s’applique uniquement aux nouvelles souscriptions du stock restant.
- Le stock total ne peut pas être abaissé sous le nombre de souscriptions déjà exécutées; le stock disponible est `stock_limit - souscriptions exécutées`.
- Chaque modification d’offre exige un motif et est enregistrée dans `offer_conditions_audit` avec les anciennes/nouvelles conditions, l’administrateur et l’horodatage.
- L’historique financier utilisateur affiche les conditions sauvegardées de chaque investissement.
- Les quotas personnels existants restent inchangés; la limite par défaut modifiée est appliquée aux nouvelles attributions. Les quotas individuels peuvent toujours être gérés depuis l’administration et leur historique reste audité.

## v1.29 — continuité du design et parcours de compte

Cette étape conserve les feuilles de style, les couleurs, la navigation et les écrans SMILE de la v1.28. Elle ajoute un écran de connexion/inscription relié aux routes d'authentification existantes, charge le profil réel après connexion, affiche le véritable identifiant SMILE, récupère le lien de parrainage et les membres de l'équipe sur trois niveaux, et remplace la déconnexion de démonstration par la fermeture réelle de session.

**Mobile Money est activé par défaut** (`MOBILE_MONEY_ENABLED=true`) pour maintenir les formulaires Mixx (TMoney) et Flooz accessibles. Le mode est 100 % manuel : chaque dépôt et chaque retrait doit être vérifié et approuvé par un administrateur. Aucun transfert automatique ni appel API opérateur n’est déclenché par SMILE. Configurez les coordonnées marchandes avant toute collecte réelle.

Les tests unitaires présents passent et les fichiers JavaScript ont été vérifiés syntaxiquement. Cette étape ne constitue pas une recette complète : aucune base PostgreSQL réelle n'était connectée pendant les vérifications, et les modules publications, profil, certains écrans de paramètres et l'application Android restent à finaliser. Ne pas utiliser cette archive pour collecter de l'argent réel.


### Accès utilisateur temporaire sans identifiants

Aucun accès invité ni compte utilisateur de test n’est proposé. Les membres doivent utiliser le parcours normal d’inscription et de connexion. L’authentification administrateur reste séparée et protégée.


## Version 1.33 — création des offres en brouillon et publication manuelle

Dans Administration → Offres d’investissement, toute nouvelle offre est enregistrée en brouillon et n’apparaît pas dans le compte utilisateur. L’administrateur peut ensuite la publier explicitement ou la retirer du catalogue utilisateur. Les offres déjà présentes dans une base existante conservent leur état publié afin de ne pas interrompre le catalogue actuel. La colonne `published` est ajoutée automatiquement au démarrage et également définie dans `schema.sql`. Les API de consultation et de souscription n’acceptent que les offres à la fois actives et publiées. La désactivation d’une offre retire automatiquement sa publication.

Les 22 offres lisibles dans la vidéo de référence (13 offres IA SMILE et 9 offres Super IA SMILE) sont préchargées comme brouillons, avec leurs durées, montants, quotas et stocks visibles. Les images pourront être ajoutées ou remplacées depuis l’administration. Les catégories Temps limité, revenu quotidien et produit d’équipe sont également conservées pour les futures offres.


## Version 1.34 — authentification utilisateur et sécurité des entrées

- L’interface principale propose désormais la connexion et l’inscription réelles via les routes existantes. La création silencieuse de comptes invités à chaque visite a été supprimée; le parrainage présent dans l’URL est transmis lors de l’inscription.
- Le changement du mot de passe utilisateur est maintenant relié au serveur : vérification de l’ancien mot de passe, nouveau mot de passe de 10 caractères minimum, mise à jour avec scrypt, fermeture des autres sessions et journalisation.
- Le faux formulaire de modification de mot de passe a été remplacé par une vraie requête API. Le PIN de retrait et la liaison d'un portefeuille ne sont pas présentés comme fonctionnels tant que leur mécanisme serveur n'existe pas.
- Lecture JSON limitée en octets (1 Mio par défaut, 8 Mio pour les images), gestion des erreurs JSON/taille HTTP et tolérance aux cookies malformés.
- Vérifications locales : tests unitaires, syntaxe JavaScript. Les tests PostgreSQL, navigateurs, paiements Mobile Money et audit externe restent à exécuter sur un environnement de recette.

**Limites restantes :** les publications ne sont pas connectées à un module éditorial, le PIN de retrait et les portefeuilles bénéficiaires ne sont pas implémentés, et aucun prestataire Mobile Money n’est intégré. Le parcours d’inscription et de connexion est disponible mais doit encore être testé sur une base PostgreSQL de recette. Garder `MOBILE_MONEY_ENABLED=true` pour maintenir les demandes Mixx (TMoney)/Flooz disponibles et `SMILE_GUEST_ACCESS=false` en production. Chaque opération reste soumise à approbation administrative.


## Version 1.35 — publications, PIN de retrait et bénéficiaires

- Ajout d’un module éditorial administrateur : création des publications en brouillon, publication explicite et retrait du fil utilisateur. Seules les publications publiées sont renvoyées à l’espace utilisateur.
- Ajout du PIN de retrait à 6 chiffres, dérivé avec scrypt et vérifié côté serveur. La modification exige le PIN actuel lorsqu’un PIN existe déjà. Les tentatives de configuration et de retrait sont limitées par adresse IP.
- Ajout de la gestion des bénéficiaires Flooz/Mixx (TMoney) (maximum cinq par compte), avec isolation par utilisateur et possibilité de supprimer un bénéficiaire. Une demande de retrait peut référencer un bénéficiaire enregistré.
- Désactivation du traitement automatique de libération des investissements : les conditions de durée et de déblocage doivent être décidées et validées avant d’autoriser un crédit automatique. Les fonds investis restent donc immobilisés tant qu’une procédure de libération conforme n’est pas définie.
- Les paiements Mobile Money sont activés par défaut pour garder les demandes Mixx (TMoney)/Flooz disponibles. Les API Flooz/Mixx (TMoney) opérateur ne sont pas intégrées : les transferts sont manuels et chaque dépôt/retrait reste soumis à approbation administrative.

### Recette de cette archive

Les 18 tests automatisés Node.js passent et les fichiers JavaScript passent `node --check`. Les tests de connexion PostgreSQL, la migration sur une copie de base réelle, les essais navigateur/mobile et les tests de paiement opérateur ne peuvent pas être certifiés sans environnement de recette et comptes prestataires.


## Mise à jour — inscription et rubrique Contrôle

Cette version comprend l’inscription par nom d’utilisateur et téléphone (e-mail facultatif), la connexion par téléphone ou e-mail, ainsi que la rubrique **Contrôle** des deux comptes spéciaux. Avant le premier démarrage, configurez les variables privées décrites dans [`CONFIGURATION_CONTROLE.md`](CONFIGURATION_CONTROLE.md). Les mots de passe ne sont volontairement pas intégrés dans le ZIP.


### Gestion des offres (v1.46)

L’administration des offres CRYPTO propose quatre actions : **Masquer** (offre visible, achat bloqué avec « Bientôt disponible »), **Afficher** (offre visible et achetable), **Retirer** (offre masquée aux utilisateurs mais conservée en base et dans l’administration) et **Republier** (offre retirée remise en ligne). Les colonnes `purchase_enabled` et `removed` sont ajoutées automatiquement au démarrage par migration idempotente. Les achats sont également contrôlés côté serveur.

## Version 1.47 — Navigation retour intelligente

Cette version ajoute un bouton « Retour » contextuel aux rubriques de l’espace utilisateur et de l’administration. Le retour suit la navigation précédente, fonctionne avec l’historique du navigateur et ne provoque ni déconnexion ni rechargement de page. Les formulaires en cours restent dans la page lorsqu’on change simplement de rubrique.


## Version 1.48 — Sessions administrateur et utilisateur indépendantes

Les sessions utilisent désormais deux cookies HttpOnly distincts (`smile_admin_session` et `smile_session`). L’administrateur peut ouvrir l’espace utilisateur dans un nouvel onglet sans être redirigé vers l’administration ni perdre sa connexion. Les déconnexions sont limitées à l’espace concerné. Les anciennes sessions administrateur sont reconnues pour assurer la transition. Le lien « Espace utilisateur » est disponible dans l’en-tête de l’administration.


## Version 1.49 — TMoney / Flooz et double étape de retrait

- Les nouvelles demandes utilisent TMoney ou Flooz (Mixx n'est plus proposé dans les formulaires). Les anciennes opérations Mixx restent conservées dans l'historique.
- Les dépôts nécessitent toujours une vérification réelle et une approbation administrative avant crédit.
- Les retraits ont deux étapes distinctes : approbation par un administrateur, puis confirmation du transfert réel avec référence unique. Le statut `paid` n'est accessible qu'après approbation.
- Le montant reste réservé dès la demande; un rejet avant paiement le restitue au portefeuille.
- `paid_by` permet de tracer l'administrateur ayant confirmé le transfert, séparément de `approved_by`.
- Le module de service client utilisateur / administration et son historique sont conservés.
- Tests exécutés localement : contrôles syntaxiques Node.js et 57 tests unitaires réussis. Aucun test PostgreSQL réel, test API opérateur ou transfert réel n'a été exécuté.
- Aucun accès marchand ni API Mixx (TMoney)/Flooz n'est connecté dans cette archive.


## Version 1.51 — quotas globaux et libellé Mixx (TMoney)
- Ajout dans Comptes & parrainage d’une modification individuelle du quota et d’une modification globale par offre.
- La modification globale applique un quota restant identique à tous les comptes utilisateurs existants, anciens et nouveaux, sur toutes les offres, et met à jour les quotas par défaut pour les futurs membres.
- Les souscriptions déjà consommées sont conservées : le total autorisé est recalculé en ajoutant le quota restant choisi au nombre déjà utilisé.
- Confirmation explicite, motif obligatoire, historique individuel de chaque quota et journal d’audit global.
- Le libellé affiché est désormais « Mixx (TMoney) ». La valeur technique `tmoney` est conservée pour préserver les transactions et données historiques.
- Les paiements restent activés en mode manuel. Tous les dépôts et retraits continuent d’exiger une approbation administrative; aucun transfert ni validation automatique n’est déclenché.


### Contact WhatsApp SMILE
Le numéro officiel n'étant pas encore fourni, les boutons WhatsApp affichent un message explicatif au lieu d'ouvrir un lien de discussion vide. Pour l'activer, renseigner `SMILE_WHATSAPP_NUMBER` dans `support-links.js` au format international avec chiffres uniquement (ex. `228XXXXXXXX`). Le lien `wa.me` est alors généré automatiquement. Le bouton Google ouvre le site officiel Google (`https://www.google.com/`) ; il ne constitue pas une connexion Google à SMILE.


## ORVIA 45 — accès administrateur sur appareil de confiance
- Ajout d’un mécanisme d’autorisation explicite d’un navigateur administrateur pour 180 jours.
- Le jeton est aléatoire, stocké sous forme de hash côté serveur et transmis en cookie HttpOnly/SameSite=Strict (Secure en production).
- L’ouverture de l’administration sur le navigateur autorisé restaure automatiquement une session administrateur.
- Ajout des commandes pour autoriser ou révoquer l’appareil ; une déconnexion explicite révoque aussi l’autorisation.
- Une première authentification normale est requise ; aucun accès administrateur public ou sans contrôle n’est créé.
