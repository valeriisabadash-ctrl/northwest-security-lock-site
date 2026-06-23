document.addEventListener('DOMContentLoaded', function () {
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  var menuButton = document.querySelector('[data-menu-button]');
  var nav = document.querySelector('[data-nav]');
  if (menuButton && nav) {
    menuButton.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  document.querySelectorAll('.fade-up').forEach(function (item) {
    observer.observe(item);
  });

  var leadForm = document.querySelector('[data-lead-form]');
  var formNote = document.querySelector('[data-form-note]');
  if (leadForm) {
    leadForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var data = new FormData(leadForm);
      var lines = [
        'New locksmith service request from the website:',
        '',
        'Name: ' + clean(data.get('name')),
        'Phone: ' + clean(data.get('phone')),
        'Location: ' + clean(data.get('location')),
        'Service Needed: ' + clean(data.get('service')),
        'Urgency: ' + clean(data.get('urgency')),
        'Details: ' + clean(data.get('details')),
        '',
        'Note: Pricing depends on the lock, location, time, and situation. Confirm all details before quoting.'
      ];

      var subject = encodeURIComponent('Northwest Security & Lock service request');
      var body = encodeURIComponent(lines.join('\n'));
      var mailto = 'mailto:pnwlocksmithor@gmail.com?subject=' + subject + '&body=' + body;
      window.location.href = mailto;

      if (formNote) {
        formNote.textContent = 'Your email app should open with the request details. For urgent service, call directly.';
      }
    });
  }

  var chatToggle = document.querySelector('[data-chat-toggle]');
  var chatPanel = document.querySelector('[data-chat-panel]');
  var chatClose = document.querySelector('[data-chat-close]');
  var chatBody = document.querySelector('[data-chat-body]');
  var chatOptions = document.querySelector('[data-chat-options]');
  var chatForm = document.querySelector('[data-chat-form]');
  var openChatButtons = document.querySelectorAll('[data-open-chat]');
  var selectedService = '';

  function openChat() {
    if (!chatPanel || !chatToggle) return;
    chatPanel.hidden = false;
    chatToggle.setAttribute('aria-expanded', 'true');
    if (window.matchMedia('(max-width: 640px)').matches) {
      document.body.classList.add('chat-open');
    }
  }

  function closeChat() {
    if (!chatPanel || !chatToggle) return;
    chatPanel.hidden = true;
    chatToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('chat-open');
  }

  if (chatToggle) {
    chatToggle.addEventListener('click', function () {
      if (chatPanel && chatPanel.hidden) {
        openChat();
      } else {
        closeChat();
      }
    });
  }

  if (chatClose) chatClose.addEventListener('click', closeChat);

  openChatButtons.forEach(function (button) {
    button.addEventListener('click', openChat);
  });

  if (chatOptions && chatBody && chatForm) {
    chatOptions.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-service]');
      if (!button) return;

      selectedService = button.getAttribute('data-service') || 'Something else';
      appendMessage(selectedService, 'user-message');

      var urgentCopy = selectedService.toLowerCase().indexOf('locked out') !== -1
        ? 'If you are locked out right now, calling is fastest. I can still collect your details, but do not wait on chat if it is urgent.'
        : 'Pricing depends on the lock, location, time, and situation. We can give you a quick estimate after a few details, but for urgent service, calling is fastest.';

      appendMessage(urgentCopy + ' What is the best name, phone number, location, and urgency?', 'bot-message');

      chatOptions.hidden = true;
      chatForm.hidden = false;
      chatForm.querySelector('input[name="name"]').focus();
    });

    chatForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var data = new FormData(chatForm);
      var lead = {
        service: selectedService || 'Not selected',
        name: clean(data.get('name')),
        phone: clean(data.get('phone')),
        location: clean(data.get('location')),
        urgency: clean(data.get('urgency')),
        createdAt: new Date().toISOString()
      };

      try {
        var saved = JSON.parse(localStorage.getItem('nwsl_chat_leads') || '[]');
        saved.push(lead);
        localStorage.setItem('nwsl_chat_leads', JSON.stringify(saved));
      } catch (error) {
        // Local storage is optional. A real launch should send this to CRM/email/SMS backend.
      }

      appendMessage('Got it. For urgent help, call now at (503) 760-1402. For non-urgent work, this lead needs to be connected to a backend before launch so the shop receives it instantly.', 'bot-message');
      chatForm.reset();
      chatForm.hidden = true;
    });
  }

  function appendMessage(text, className) {
    var div = document.createElement('div');
    div.className = className;
    div.textContent = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function clean(value) {
    return (value || '').toString().trim();
  }
});
