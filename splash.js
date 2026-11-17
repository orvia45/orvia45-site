/* Affiche le logo officiel au premier écran, puis laisse apparaître l'application. */
(() => {
  const splash = document.getElementById('smile-splash');
  if (!splash) return;
  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    window.setTimeout(() => splash.classList.add('is-hidden'), 900);
    window.setTimeout(() => splash.remove(), 1450);
  };
  if (document.readyState === 'complete') {
    dismiss();
  } else {
    window.addEventListener('load', dismiss, { once: true });
  }
  // Évite de bloquer l'accès au site si une ressource distante tarde à charger.
  window.setTimeout(dismiss, 4500);
})();
