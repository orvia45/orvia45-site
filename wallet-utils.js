'use strict';
// Le grand livre déduit déjà les retraits en attente : aucune seconde réservation.
function availableWalletBalance(ledgerBalance) { return Math.max(0, Number(ledgerBalance || 0)); }
module.exports = { availableWalletBalance };
