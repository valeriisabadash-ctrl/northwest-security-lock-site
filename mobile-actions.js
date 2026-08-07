(() => {
  const isMobile = () => window.matchMedia('(max-width: 720px)').matches;

  const getOriginalRequestButton = () =>
    document.querySelector('.hero .open-request') ||
    document.querySelector('.final-cta .open-request') ||
    document.querySelector('.open-request');

  const ensureDock = () => {
    let dock = document.querySelector('.mobile-action-dock');

    if (!dock) {
      dock = document.createElement('div');
      dock.className = 'mobile-action-dock';
      dock.setAttribute('aria-label', 'Quick locksmith actions');

      const request = document.createElement('button');
      request.type = 'button';
      request.className = 'mobile-request-trigger';
      request.textContent = 'Request Service';
      request.addEventListener('click', () => {
        const original = getOriginalRequestButton();
        if (original) original.click();
      });

      const call = document.createElement('a');
      call.className = 'mobile-call-trigger';
      call.href = 'tel:+15037601402';
      call.textContent = 'Call Now';
      call.setAttribute('aria-label', 'Call Northwest Security & Lock');

      dock.append(request, call);
      document.body.appendChild(dock);
    }

    dock.hidden = !isMobile();

    const oldCall = document.querySelector('.mobile-call');
    if (oldCall) oldCall.style.display = isMobile() ? 'none' : '';
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureDock, { once: true });
  } else {
    ensureDock();
  }

  window.addEventListener('resize', ensureDock, { passive: true });
})();
