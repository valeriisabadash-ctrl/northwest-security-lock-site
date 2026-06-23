document.addEventListener('DOMContentLoaded', function () {
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  var button = document.querySelector('[data-menu-button]');
  var nav = document.querySelector('[data-nav]');
  if (button && nav) {
    button.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var form = document.querySelector('[data-lead-form]');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var lines = [
        'New locksmith service request from the website:',
        '',
        'Name: ' + (data.get('name') || ''),
        'Phone: ' + (data.get('phone') || ''),
        'Email: ' + (data.get('email') || ''),
        'Service: ' + (data.get('service') || ''),
        'Location: ' + (data.get('location') || ''),
        'Timing: ' + (data.get('timing') || ''),
        '',
        'Details:',
        data.get('details') || ''
      ];
      var subject = encodeURIComponent('Website service request - Northwest Security & Lock');
      var body = encodeURIComponent(lines.join('\n'));
      window.location.href = 'mailto:pnwlocksmithor@gmail.com?subject=' + subject + '&body=' + body;
    });
  }
});
