# SMILE v1.54.2 — Ajustements Temps Limité

- Les images Temps Limité reprennent le rendu des images VIP : remplissage du cadre (`object-fit: cover`), proportions cohérentes, sans cadre rose ajouté.
- Le bandeau « Fin de l’offre » et ses chiffres sont agrandis et renforcés visuellement.
- Le deuxième compte à rebours reste visible et se fige à `00:00:00:00` lorsque la date de lancement est atteinte (logique existante conservée).
- Les styles restent ciblés sur `.limited-product-card` / `.limited-product-image` et ne modifient pas les cartes VIP standard.
- Cache PWA renouvelé : `smile-shell-v1.54.2`.

Cette archive doit être déployée sur l’hébergement pour prendre effet. Les tests locaux ne remplacent pas une vérification en production.
