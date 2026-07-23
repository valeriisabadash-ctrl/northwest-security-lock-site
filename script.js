(() => {
  const existingMobileStyles = document.querySelector('link[data-mobile-layout]');
  if (!existingMobileStyles) {
    const mobileStyles = document.createElement('link');
    mobileStyles.rel = 'stylesheet';
    mobileStyles.href = 'mobile.css?v=20260716-9';
    mobileStyles.dataset.mobileLayout = 'true';
    document.head.appendChild(mobileStyles);
  }

  const body = document.body;
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  const dropdown = document.querySelector('.nav-dropdown');
  const dropdownButton = document.querySelector('.nav-dropdown-toggle');
  const modal = document.querySelector('#request-modal');
  const requestForm = document.querySelector('#service-request-form');
  const serviceSelect = requestForm?.querySelector('[name="service"]');

  const replaceShopHours = () => {
    const replacements = new Map([
      ['Mon–Sat: 7:00 AM–6:00 PM', 'Monday–Friday: 9:00 AM–5:00 PM'],
      ['Mon-Sat: 7:00 AM-6:00 PM', 'Monday-Friday: 9:00 AM-5:00 PM'],
      ['Monday through Saturday 7:00 AM–6:00 PM', 'Monday through Friday 9:00 AM–5:00 PM']
    ]);

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      let updated = node.nodeValue;
      replacements.forEach((replacement, original) => {
        updated = updated.replaceAll(original, replacement);
      });
      if (updated !== node.nodeValue) node.nodeValue = updated;
    }

    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      try {
        const data = JSON.parse(script.textContent);
        const updateHours = (value) => {
          if (!value || typeof value !== 'object') return;
          if (Array.isArray(value)) {
            value.forEach(updateHours);
            return;
          }
          if (value.openingHoursSpecification) {
            const specs = Array.isArray(value.openingHoursSpecification)
              ? value.openingHoursSpecification
              : [value.openingHoursSpecification];
            specs.forEach((spec) => {
              spec.dayOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
              spec.opens = '09:00';
              spec.closes = '17:00';
            });
          }
          Object.values(value).forEach(updateHours);
        };
        updateHours(data);
        script.textContent = JSON.stringify(data);
      } catch (_) {
        // Leave unrelated or malformed structured data untouched.
      }
    });
  };

  replaceShopHours();

  const closeNavigation = () => {
    nav?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    dropdown?.classList.remove('open');
    dropdownButton?.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-open');
  };

  menuButton?.addEventListener('click', () => {
    const isOpen = nav?.classList.toggle('open') ?? false;
    menuButton.setAttribute('aria-expanded', String(isOpen));
    body.classList.toggle('menu-open', isOpen);
  });

  dropdownButton?.addEventListener('click', (event) => {
    if (window.matchMedia('(max-width: 900px)').matches) {
      event.preventDefault();
      const isOpen = dropdown?.classList.toggle('open') ?? false;
      dropdownButton.setAttribute('aria-expanded', String(isOpen));
    }
  });

  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNavigation));

  const chooseService = (service = '') => {
    if (!serviceSelect || !service) return;
    const normalized = service.toLowerCase();
    const option = Array.from(serviceSelect.options).find((item) => {
      const text = item.text.toLowerCase();
      return text === normalized || text.includes(normalized) || normalized.includes(text);
    });
    if (option) serviceSelect.value = option.value;
  };

  const openModal = (service = '') => {
    if (!modal) return;
    closeNavigation();
    chooseService(service);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    window.setTimeout(() => modal.querySelector('input, select, textarea, button')?.focus(), 80);
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
  document.querySelectorAll('[data-close-modal]').forEach((element) => element.addEventListener('click', closeModal));

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
    window.location.href = `mailto:pnwlocksmithor@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('request') === '1') {
    window.setTimeout(() => openModal(params.get('service') || ''), 180);
  }

  window.addEventListener('resize', () => {
    if (!window.matchMedia('(max-width: 900px)').matches) closeNavigation();
  });
})();