(() => {
  const body = document.body;
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  const dropdown = document.querySelector('.nav-dropdown');
  const dropdownButton = document.querySelector('.nav-dropdown-toggle');
  const modal = document.querySelector('#request-modal');
  const requestForm = document.querySelector('#service-request-form');
  const serviceSelect = requestForm?.querySelector('[name="service"]');

  const closeNavigation = () => {
    nav?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    dropdown?.classList.remove('open');
    dropdownButton?.setAttribute('aria-expanded', 'false');
  };

  menuButton?.addEventListener('click', () => {
    const isOpen = nav?.classList.toggle('open') ?? false;
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  dropdownButton?.addEventListener('click', (event) => {
    if (window.matchMedia('(max-width: 900px)').matches) {
      event.preventDefault();
      const isOpen = dropdown?.classList.toggle('open') ?? false;
      dropdownButton.setAttribute('aria-expanded', String(isOpen));
    }
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNavigation);
  });

  const openModal = (service = '') => {
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');

    if (service && serviceSelect) {
      const option = Array.from(serviceSelect.options).find((item) => item.text === service);
      if (option) serviceSelect.value = option.value;
    }

    window.setTimeout(() => {
      modal.querySelector('input, select, textarea, button')?.focus();
    }, 80);
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  };

  document.querySelectorAll('.open-request').forEach((button) => {
    button.addEventListener('click', () => openModal(button.dataset.service || ''));
  });

  document.querySelectorAll('[data-close-modal]').forEach((element) => {
    element.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
      closeNavigation();
    }
  });

  requestForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!requestForm.checkValidity()) {
      requestForm.reportValidity();
      return;
    }

    const data = new FormData(requestForm);
    const subject = `Locksmith service request — ${data.get('service')}`;
    const bodyLines = [
      'Northwest Security & Lock service request',
      '',
      `Name: ${data.get('name')}`,
      `Phone: ${data.get('phone')}`,
      `City / ZIP: ${data.get('location')}`,
      `Service: ${data.get('service')}`,
      `Urgency: ${data.get('urgency')}`,
      '',
      'Details:',
      String(data.get('details') || '')
    ];

    const mailto = `mailto:pnwlocksmithor@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    window.location.href = mailto;
  });

  window.addEventListener('resize', () => {
    if (!window.matchMedia('(max-width: 900px)').matches) {
      closeNavigation();
    }
  });
})();
