// Configuration du contact WhatsApp officiel SMILE.
// Saisir le numéro au format international, chiffres uniquement (ex. 228XXXXXXXX).
// Laisser vide tant que le numéro officiel n'a pas été communiqué.
const SMILE_WHATSAPP_NUMBER = '';

(function () {
  const digits = String(SMILE_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  const links = document.querySelectorAll('[data-whatsapp-link]');
  links.forEach((link) => {
    if (digits.length >= 8 && digits.length <= 15) {
      link.href = `https://wa.me/${digits}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.removeAttribute('aria-disabled');
    } else {
      link.href = '#';
      link.removeAttribute('target');
      link.setAttribute('aria-disabled', 'true');
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = 'Le numéro WhatsApp officiel de SMILE n’est pas encore configuré.';
          toast.style.display = 'block';
          window.setTimeout(() => { toast.style.display = 'none'; }, 3200);
        } else {
          window.alert('Le numéro WhatsApp officiel de SMILE n’est pas encore configuré.');
        }
      });
    }
  });
})();
