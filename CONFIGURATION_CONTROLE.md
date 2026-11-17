# Configuration de la rubrique Contrôle SMILE

## 1. Variables privées à configurer

Dans le panneau d'hébergement (ou dans le fichier `.env` local non partagé), ajouter :

- `CONTROL_ACCESS_PASSWORD` : mot de passe spécial d'accès à la rubrique Contrôle (au moins 9 caractères).
- `SPECIAL_ACCOUNT_1_PASSWORD` : mot de passe initial du compte `controle1`.
- `SPECIAL_ACCOUNT_2_PASSWORD` : mot de passe initial du compte `controle2`.

Les téléphones des comptes sont `90454545` et `91454545`. Les comptes sont créés au premier démarrage où leurs variables de mot de passe sont définies. Ils sont créés comme comptes utilisateurs normaux et commencent désactivés pour les commissions. Leurs mots de passe sont hachés par scrypt avant enregistrement.

Le mot de passe Contrôle est également haché avec scrypt et enregistré en base. Il n'est jamais envoyé au navigateur. La session de déverrouillage dure 30 minutes et utilise un cookie HttpOnly/SameSite Strict. En production, HTTPS est obligatoire pour protéger ce cookie (`Secure`).

## 2. Mise en route

1. Configurez `DATABASE_URL` et les trois variables ci-dessus dans les variables privées de l'hébergeur.
2. Redémarrez le serveur SMILE. Les tables et index sont migrés automatiquement au démarrage.
3. Connectez-vous à l'administration avec le compte administrateur habituel.
4. Ouvrez **Contrôle**, saisissez le mot de passe spécial, puis activez chaque compte séparément.
5. Remplacez les mots de passe initiaux des deux comptes spéciaux avant toute mise en production.

Si la rubrique Contrôle avait déjà été initialisée et que vous souhaitez changer son mot de passe, il faut mettre à jour le hash de `special_control_credentials` avec le mécanisme de hachage `scrypt` du serveur, ou supprimer cette seule ligne puis redémarrer avec `CONTROL_ACCESS_PASSWORD` mis à jour.

## 3. Règle de commission

Lorsqu'un dépôt est confirmé manuellement par l'administrateur, le serveur vérifie qu'il s'agit du premier dépôt approuvé du compte. Pour chaque compte spécial actif à cet instant, il crédite 12 % du dépôt dans le portefeuille et passe l'écriture dans le grand livre (`commission_expense` / `user_wallet_liability`). Pour un compte inactif, la commission est enregistrée comme perdue et n'est jamais rattrapée lors d'une réactivation. Les dépôts suivants ne génèrent aucune commission spéciale.

Les écritures du dépôt, les commissions, les enregistrements d'idempotence et l'audit sont exécutés dans la même transaction PostgreSQL. Les contraintes uniques empêchent les doubles attributions.

## 4. Important

Ne mettez jamais de mots de passe dans le dépôt Git, dans `admin.js`, dans `server.js` ou dans un fichier ZIP partagé. Utilisez exclusivement les variables privées de l'hébergeur. Faites une sauvegarde PostgreSQL avant la mise à jour.
