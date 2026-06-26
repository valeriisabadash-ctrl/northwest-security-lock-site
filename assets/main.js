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

  var observerSupported = 'IntersectionObserver' in window;
  if (observerSupported) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    document.querySelectorAll('.fade-up').forEach(function (item) { observer.observe(item); });
  } else {
    document.querySelectorAll('.fade-up').forEach(function (item) { item.classList.add('is-visible'); });
  }

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
        'Service Address: ' + clean(data.get('location')),
        'Service Needed: ' + clean(data.get('service')),
        'Urgency: ' + clean(data.get('urgency')),
        'Details: ' + clean(data.get('details')),
        '',
        'Please call this lead back and confirm availability, timing, and pricing.'
      ];
      window.location.href = 'mailto:pnwlocksmithor@gmail.com?subject=' + encodeURIComponent('Northwest Security and Lock service request') + '&body=' + encodeURIComponent(lines.join('\n'));
      if (formNote) formNote.textContent = 'Your email app should open with the request details. For urgent service, call directly.';
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
    if (window.matchMedia('(max-width: 640px)').matches) document.body.classList.add('chat-open');
  }
  function closeChat() {
    if (!chatPanel || !chatToggle) return;
    chatPanel.hidden = true;
    chatToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('chat-open');
  }

  if (chatToggle) {
    chatToggle.addEventListener('click', function () {
      if (chatPanel && chatPanel.hidden) openChat(); else closeChat();
    });
  }
  if (chatClose) chatClose.addEventListener('click', closeChat);
  openChatButtons.forEach(function (button) { button.addEventListener('click', openChat); });

  if (chatOptions && chatBody && chatForm) {
    chatOptions.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-service]');
      if (!button) return;
      selectedService = button.getAttribute('data-service') || 'Something else';
      appendMessage(selectedService, 'user-message');
      var urgent = selectedService.toLowerCase().indexOf('locked out') !== -1;
      appendMessage(urgent ? 'If you are locked out right now, call directly for the fastest response. I can still collect your details here.' : 'Got it. Share your name, phone, location, and urgency so the request can be routed properly.', 'bot-message');
      chatOptions.hidden = true;
      chatForm.hidden = false;
      var first = chatForm.querySelector('input[name="name"]');
      if (first) first.focus();
    });

    chatForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var data = new FormData(chatForm);
      var lines = [
        'New Quick Help lead:',
        '',
        'Service: ' + (selectedService || 'Not selected'),
        'Name: ' + clean(data.get('name')),
        'Phone: ' + clean(data.get('phone')),
        'Location: ' + clean(data.get('location')),
        'Urgency: ' + clean(data.get('urgency'))
      ];
      window.location.href = 'mailto:pnwlocksmithor@gmail.com?subject=' + encodeURIComponent('Northwest Security and Lock quick help lead') + '&body=' + encodeURIComponent(lines.join('\n'));
      appendMessage('Perfect. Your email app should open with the details. If this is urgent, call now at (503) 760-1402.', 'bot-message');
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
  function clean(value) { return (value || '').toString().trim(); }
});
