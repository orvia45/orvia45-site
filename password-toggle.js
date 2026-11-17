// Bouton œil appliqué à tous les champs de mot de passe, y compris les formulaires créés dynamiquement.
(() => {
  const eye = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  const eyeOff = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a16 16 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7c1.2 0 2.3-.3 3.3-.7"/></svg>';
  function enhance(input) {
    if (!(input instanceof HTMLInputElement) || input.type !== 'password' || input.dataset.eyeReady === 'true') return;
    const existing = input.closest('.password-field');
    let wrapper = existing;
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'password-field';
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);
    }
    if (wrapper.querySelector('[data-toggle-password]')) { input.dataset.eyeReady = 'true'; return; }
    const button = document.createElement('button');
    button.className = 'password-toggle';
    button.type = 'button';
    button.dataset.togglePassword = '';
    button.setAttribute('aria-label', 'Afficher le mot de passe');
    button.setAttribute('aria-pressed', 'false');
    button.title = 'Afficher le mot de passe';
    button.innerHTML = eye;
    wrapper.appendChild(button);
    input.dataset.eyeReady = 'true';
  }
  function scan(root) {
    if (root.matches?.('input[type="password"]')) enhance(root);
    root.querySelectorAll?.('input[type="password"]').forEach(enhance);
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-toggle-password]');
    if (!button) return;
    const input = button.closest('.password-field')?.querySelector('input');
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(show));
    button.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
    button.title = show ? 'Masquer le mot de passe' : 'Afficher le mot de passe';
    button.innerHTML = show ? eyeOff : eye;
  });
  scan(document);
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => { if (node.nodeType === 1) scan(node); })))
    .observe(document.documentElement, { childList: true, subtree: true });
})();
