(() => {
  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };

  if (!document.querySelector('script[data-vercel-analytics]')) {
    const analyticsScript = document.createElement('script');
    analyticsScript.defer = true;
    analyticsScript.src = '/_vercel/insights/script.js';
    analyticsScript.dataset.vercelAnalytics = 'true';
    document.head.appendChild(analyticsScript);
  }

  window.si = window.si || function () {
    (window.siq = window.siq || []).push(arguments);
  };

  if (!document.querySelector('script[data-vercel-speed-insights]')) {
    const speedInsightsScript = document.createElement('script');
    speedInsightsScript.defer = true;
    speedInsightsScript.src = '/_vercel/speed-insights/script.js';
    speedInsightsScript.dataset.vercelSpeedInsights = 'true';
    document.head.appendChild(speedInsightsScript);
  }

  const addStylesheet = (selector, href, datasetKey) => {
    if (document.querySelector(selector)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset[datasetKey] = 'true';
    document.head.appendChild(link);
  };

  addStylesheet('link[data-mobile-layout]', 'mobile.css?v=20260716-9', 'mobileLayout');
  addStylesheet('link[data-final-cta-fix]', 'final-cta-fix.css?v=20260723-1', 'finalCtaFix');

  const body = document.body;
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  const seoNav = document.querySelector('.seo-links');
  const dropdown = document.querySelector('.nav-dropdown');
  const dropdownButton = document.querySelector('.nav-dropdown-toggle');
  const modal = document.querySelector('#request-modal');
  const requestForm = document.querySelector('#service-request-form');
  const serviceSelect = requestForm?.querySelector('[name="service"]');
  const submitButton = requestForm?.querySelector('button[type="submit"]');
  const modalIntro = modal?.querySelector('.modal-intro');
  const formActions = requestForm?.querySelector('.request-form-actions');
  let formStatus = requestForm?.querySelector('.form-status');

  const defaultSubmitLabel = 'Submit Service Request';
  const formEndpoint = 'https://formsubmit.co/ajax/pnwlocksmithor@gmail.com';

  if (modalIntro) {
    modalIntro.textContent = 'For an emergency, call now. For non-emergency service, complete the form and the request will be sent directly to Northwest Security & Lock.';
  }

  if (submitButton) submitButton.textContent = defaultSubmitLabel;

  if (requestForm && !formStatus) {
    formStatus = document.createElement('p');
    formStatus.className = 'modal-intro form-status';
    formStatus.setAttribute('role', 'status');
    formStatus.setAttribute('aria-live', 'polite');
    formStatus.hidden = true;
    formStatus.style.margin = '14px 0 0';
    requestForm.insertBefore(formStatus, formActions || null);
  }

  const honeyField = requestForm?.querySelector('[name="_honey"]') || (() => {
    if (!requestForm) return null;
    const input = document.createElement('input');
    input.type = 'text';
    input.name = '_honey';
    input.tabIndex = -1;
    input.autocomplete = 'off';
    input.setAttribute('aria-hidden', 'true');
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    requestForm.appendChild(input);
    return input;
  })();

  const setFormStatus = (message = '', type = '') => {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.hidden = !message;
    formStatus.style.color = type === 'error' ? '#9f2f24' : type === 'success' ? '#27643a' : '';
    formStatus.style.fontWeight = message ? '700' : '';
  };

  const resetSubmitButton = () => {
    if (!submitButton) return;
    submitButton.disabled = false;
    submitButton.removeAttribute('aria-busy');
    submitButton.textContent = defaultSubmitLabel;
  };

  const addFaqLink = (navigation) => {
    if (!navigation || navigation.querySelector('a[href="/faq"]')) return;
    const faqLink = document.createElement('a');
    faqLink.href = '/faq';
    faqLink.textContent = 'FAQ';
    const contactLink = navigation.querySelector('a[href="/contact"]');
    navigation.insertBefore(faqLink, contactLink || null);
  };

  addFaqLink(nav);
  addFaqLink(seoNav);

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

  document.querySelectorAll('.main-nav a, .seo-links a').forEach((link) => {
    link.addEventListener('click', closeNavigation);
  });

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
    setFormStatus();
    resetSubmitButton();
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
  document.querySelectorAll('[data-close-modal]').forEach((element) => {
    element.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
      closeNavigation();
    }
  });

  requestForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setFormStatus();

    if (!requestForm.checkValidity()) {
      requestForm.reportValidity();
      return;
    }

    if (honeyField?.value) return;

    const data = new FormData(requestForm);
    const service = String(data.get('service') || 'General Locksmith Service');
    const urgency = String(data.get('urgency') || 'Not specified');

    data.set('_subject', `New website service request — ${service}`);
    data.set('_template', 'table');
    data.set('_captcha', 'false');
    data.set('Submitted from', window.location.href);
    data.set('Request summary', `${service} — ${urgency}`);

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      submitButton.textContent = 'Sending Request...';
    }

    try {
      const response = await fetch(formEndpoint, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      });

      let result = {};
      try {
        result = await response.json();
      } catch (_) {
        // A successful response can still be accepted even when the body is empty.
      }

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'The request could not be sent.');
      }

      requestForm.reset();
      setFormStatus('Request sent successfully. Northwest Security & Lock will contact you as soon as possible.', 'success');
      if (submitButton) submitButton.textContent = 'Request Sent';
      window.setTimeout(resetSubmitButton, 2500);
    } catch (error) {
      console.error('Service request submission failed:', error);
      setFormStatus('The form could not send right now. Please call (503) 760-1402 so the request is not missed.', 'error');
      resetSubmitButton();
    }
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('request') === '1') {
    window.setTimeout(() => openModal(params.get('service') || ''), 180);
  }

  window.addEventListener('resize', () => {
    if (!window.matchMedia('(max-width: 900px)').matches) closeNavigation();
  });
})();
