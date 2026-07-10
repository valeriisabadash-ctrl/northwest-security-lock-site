(() => {
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const chatModal = document.querySelector('[data-chat-modal]');
  const leadForm = document.querySelector('#service-form');
  const serviceField = leadForm?.querySelector('[name="service"]');
  const formStatus = leadForm?.querySelector('[data-form-status]');

  const setHeaderState = () => {
    header?.classList.toggle('scrolled', window.scrollY > 18);
  };

  const closeMenu = () => {
    nav?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };

  const openChat = () => {
    if (!chatModal) return;
    chatModal.hidden = false;
    document.body.classList.add('modal-open');
    chatModal.querySelector('.chat-close')?.focus();
  };

  const closeChat = () => {
    if (!chatModal) return;
    chatModal.hidden = true;
    document.body.classList.remove('modal-open');
  };

  const scrollToForm = (service = '') => {
    closeChat();
    closeMenu();
    if (serviceField && service) serviceField.value = service;
    leadForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => leadForm?.querySelector('input')?.focus(), 500);
  };

  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  menuButton?.addEventListener('click', () => {
    const willOpen = !nav?.classList.contains('open');
    nav?.classList.toggle('open', willOpen);
    menuButton.setAttribute('aria-expanded', String(willOpen));
    document.body.classList.toggle('menu-open', willOpen);
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.querySelectorAll('[data-open-chat]').forEach((button) => {
    button.addEventListener('click', openChat);
  });

  document.querySelectorAll('[data-close-chat]').forEach((button) => {
    button.addEventListener('click', closeChat);
  });

  chatModal?.addEventListener('click', (event) => {
    if (event.target === chatModal) closeChat();
  });

  document.querySelectorAll('[data-request-service]').forEach((button) => {
    button.addEventListener('click', () => {
      scrollToForm(button.dataset.requestService || '');
    });
  });

  document.querySelectorAll('[data-chat-service]').forEach((button) => {
    button.addEventListener('click', () => {
      scrollToForm(button.dataset.chatService || '');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
      closeChat();
    }
  });

  leadForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!leadForm.reportValidity()) return;

    const data = new FormData(leadForm);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const location = String(data.get('location') || '').trim();
    const service = String(data.get('service') || '').trim();
    const urgency = String(data.get('urgency') || '').trim();
    const details = String(data.get('details') || '').trim();

    const message = [
      'New website locksmith request',
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Address/area: ${location}`,
      `Service: ${service}`,
      `Urgency: ${urgency}`,
      `Details: ${details || 'Not provided'}`
    ].join('\n');

    if (formStatus) {
      formStatus.textContent = 'Opening your message app with the request filled in…';
    }

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const destination = isMobile
      ? `sms:+15037601402?&body=${encodeURIComponent(message)}`
      : `mailto:pnwlocksmithor@gmail.com?subject=${encodeURIComponent('Website locksmith request')}&body=${encodeURIComponent(message)}`;

    window.location.href = destination;
  });

  document.querySelector('[data-year]')?.replaceChildren(String(new Date().getFullYear()));
})();
