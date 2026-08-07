(() => {
  const syncMobileActions = () => {
    const requestButton = document.querySelector('.open-request');
    if (!requestButton) return;

    if (!requestButton.dataset.originalParent) {
      const parent = requestButton.parentElement;
      if (parent?.id) requestButton.dataset.originalParent = `#${parent.id}`;
      else if (parent?.classList?.length) requestButton.dataset.originalParent = `.${Array.from(parent.classList).join('.')}`;
    }

    if (window.matchMedia('(max-width: 720px)').matches) {
      requestButton.classList.add('mobile-request-fab');
      if (requestButton.parentElement !== document.body) document.body.appendChild(requestButton);
      return;
    }

    requestButton.classList.remove('mobile-request-fab');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncMobileActions, { once: true });
  } else {
    syncMobileActions();
  }

  window.addEventListener('resize', syncMobileActions, { passive: true });
})();
