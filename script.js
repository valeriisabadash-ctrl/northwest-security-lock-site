(() => {
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const leadForm = document.querySelector('#service-form');
  const serviceField = leadForm?.querySelector('[name="service"]');
  const formStatus = leadForm?.querySelector('[data-form-status]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateHeader = () => {
    header?.classList.toggle('scrolled', window.scrollY > 12);
  };

  const closeMenu = () => {
    nav?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open navigation menu');
    document.body.classList.remove('menu-open');
  };

  const openRequest = (service = '') => {
    closeMenu();

    if (serviceField && service) {
      const matchingOption = Array.from(serviceField.options).find((option) => {
        const optionValue = option.value.toLowerCase();
        const requestedValue = service.toLowerCase();
        return optionValue === requestedValue || optionValue.includes(requestedValue) || requestedValue.includes(optionValue);
      });

      if (matchingOption) serviceField.value = matchingOption.value;
    }

    document.querySelector('#request-service')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start'
    });

    window.setTimeout(() => {
      leadForm?.querySelector('input')?.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 650);
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  menuButton?.addEventListener('click', () => {
    const willOpen = !nav?.classList.contains('open');
    nav?.classList.toggle('open', willOpen);
    menuButton.setAttribute('aria-expanded', String(willOpen));
    menuButton.setAttribute('aria-label', willOpen ? 'Close navigation menu' : 'Open navigation menu');
    document.body.classList.toggle('menu-open', willOpen);
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.querySelectorAll('[data-request-service]').forEach((button) => {
    button.addEventListener('click', () => {
      openRequest(button.dataset.requestService || '');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  leadForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!leadForm.reportValidity()) return;

    const data = new FormData(leadForm);
    const clean = (value) => String(value || '').trim();
    const name = clean(data.get('name'));
    const phone = clean(data.get('phone'));
    const location = clean(data.get('location'));
    const service = clean(data.get('service'));
    const urgency = clean(data.get('urgency'));
    const details = clean(data.get('details'));

    const message = [
      'New website locksmith request',
      '',
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Service: ${service}`,
      `Timing: ${urgency}`,
      `Location: ${location}`,
      `Details: ${details || 'Not provided'}`
    ].join('\n');

    if (formStatus) {
      formStatus.textContent = 'Opening your message with the request filled in…';
    }

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const destination = isMobile
      ? `sms:+15037601402?&body=${encodeURIComponent(message)}`
      : `mailto:pnwlocksmithor@gmail.com?subject=${encodeURIComponent('Website locksmith request')}&body=${encodeURIComponent(message)}`;

    window.location.href = destination;
  });

  document.querySelector('[data-year]')?.replaceChildren(String(new Date().getFullYear()));

  const revealItems = document.querySelectorAll('.reveal');

  if (!reduceMotion && 'IntersectionObserver' in window && revealItems.length) {
    document.body.classList.add('motion-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px' });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }
})();
