/**
 * Moteur de calcul des commissions SMILE.
 * Règle: une seule attribution, sur le premier dépôt validé
 * de chaque filleul. Les niveaux absents ne sont pas redistribués.
 * À appeler côté serveur après validation réelle et authentifiée.
 */
const RATES = Object.freeze([0.10, 0.03, 0.01]);

function calculateFirstDepositCommissions(amount, ancestors) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new TypeError('Le montant doit être un nombre positif.');
  }
  if (!Array.isArray(ancestors)) {
    throw new TypeError('ancestors doit être un tableau ordonné du niveau 1 au niveau 3.');
  }
  const result = [];
  for (let i = 0; i < Math.min(ancestors.length, 3); i++) {
    const beneficiaryId = ancestors[i];
    if (beneficiaryId) {
      // Arrondi monétaire à l'unité FCFA la plus proche.
      result.push({ level: i + 1, beneficiaryId, rate: RATES[i], amount: Math.round(amount * RATES[i]) });
    }
  }
  return result;
}

/**
 * Vérifie si un filleul peut déclencher sa commission.
 * Le stockage durable et la contrainte d'unicité doivent être assurés en base
 * de données (une ligne par referredUserId), dans une transaction atomique.
 */
function canAwardFirstDeposit(referredUser) {
  return Boolean(referredUser && referredUser.firstValidatedDepositAt == null && referredUser.firstDepositCommissionPaid !== true);
}

module.exports = { RATES, calculateFirstDepositCommissions, canAwardFirstDeposit };
