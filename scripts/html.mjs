import { createHash } from 'node:crypto';

const text = value => value.replace(/\s+/g, ' ').trim();

export function setMeta($, selector, attributes) {
  const existing = $(selector);
  if (existing.length) {
    existing.first().attr(attributes);
    existing.slice(1).remove();
  } else $('<meta>').attr(attributes).appendTo('head');
}

export function optimizeDocument({ $, page, business, images }) {
  // Encoding must be declared before scripts and within the first 1,024 bytes.
  $('meta[charset]').remove();
  $('head').prepend('<meta charset="utf-8">');
  setMeta($, 'meta[name="viewport"]', { name: 'viewport', content: 'width=device-width,initial-scale=1' });
  setMeta($, 'meta[name="robots"]', {
    name: 'robots', content: page ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' : 'noindex,follow'
  });
  $('meta[name="googlebot"], meta[name="bingbot"]').remove();
  $('link[rel="canonical"]').remove();
  if (page) $('<link>').attr({ rel: 'canonical', href: new URL(page.path, business.url).href }).appendTo('head');

  const ensureId = element => {
    if (!element.attr('id')) element.attr('id', 'heading-' + createHash('sha256').update(text(element.text())).digest('hex').slice(0, 12));
    return element.attr('id');
  };
  const main = $('main');
  if (!main.attr('id')) main.attr('id', 'main');
  main.attr('tabindex', '-1');
  const h1 = main.find('h1').first();
  if (h1.length) main.attr('aria-labelledby', ensureId(h1));
  if (!$('.skip-link').length) $('body').prepend('<a class="skip-link" href="#' + main.attr('id') + '">Skip to content</a>');
  $('.skip-link').attr('href', '#' + main.attr('id'));
  $('header nav').attr('aria-label', 'Main navigation');

  // These cards are subsections of a section with an existing H2.
  $('.service-group h2, .info-card > strong').each((_, element) => { element.tagName = 'h3'; });
  $('.site-footer h3').each((_, element) => { element.tagName = 'h2'; });
  if (page && (page.services.length || page.path === '/service-areas')) {
    $('main .faq-list').each((_, element) => {
      element.tagName = 'section';
      $(element).prepend('<h2 class="faq-heading">Frequently asked questions</h2>');
      $(element).attr('aria-labelledby', ensureId($(element).children('h2').first()));
    });
  }
  $('aside').each((_, element) => {
    const aside = $(element);
    if (aside.attr('aria-label') || aside.attr('aria-labelledby')) return;
    const heading = aside.find('h2,h3,h4').first();
    if (heading.length) aside.attr('aria-labelledby', ensureId(heading));
    else if (aside.find('iframe').length) aside.attr('aria-label', 'Portland shop location');
  });
  $('nav a[href]').each((_, element) => {
    const link = $(element);
    const target = new URL(link.attr('href'), business.url);
    if (page && target.origin === new URL(business.url).origin && target.pathname === page.path && !target.hash && !target.search) link.attr('aria-current', 'page');
  });

  $('img[src]').each((_, element) => {
    const image = $(element);
    const url = new URL(image.attr('src'), business.url);
    const info = url.origin === new URL(business.url).origin && images[url.pathname.slice(1)];
    if (info) {
      image.attr({ width: String(info.width), height: String(info.height) });
      // An intentionally decorative image retains its empty alternative text.
      if (image.attr('alt') !== '') image.attr('alt', info.alt);
    }
  });
}
