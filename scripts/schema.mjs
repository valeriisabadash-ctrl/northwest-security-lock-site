import { createHash } from 'node:crypto';

const plain = value => value.replace(/\s+/g, ' ').trim();
const ref = id => ({ '@id': id });

/** Build a self-contained graph from maintained facts and the rendered page. */
export function createPageGraph({ $, business, page, pages }) {
  const absolute = value => new URL(value, business.url).href;
  const url = absolute(page.path);
  const pageId = url + '#webpage';
  const websiteId = absolute('/#website');
  const title = plain($('title').text());
  const description = $('meta[name="description"]').attr('content');
  const services = structuredClone(page.services);
  const graph = [structuredClone(business), {
    '@type': 'WebSite', '@id': websiteId, url: business.url,
    name: business.name, publisher: ref(business['@id']), inLanguage: 'en-US'
  }];
  const webpage = {
    '@type': page.pageType, '@id': pageId, url, name: title, description,
    isPartOf: ref(websiteId), about: ref(business['@id']),
    publisher: ref(business['@id']), inLanguage: 'en-US',
    dateModified: page.lastModified, isAccessibleForFree: true
  };

  // A service remains the main topic even when its page also answers questions.
  if (services.length) {
    webpage.mainEntity = services.map(service => ref(service['@id']));
    webpage.about = [ref(business['@id']), ...webpage.mainEntity];
    for (const service of services) {
      service.mainEntityOfPage = ref(pageId);
      service.availableChannel = {
        '@type': 'ServiceChannel', serviceUrl: url,
        servicePhone: { '@type': 'ContactPoint', telephone: business.telephone }
      };
    }
  } else if (['/', '/about', '/contact'].includes(page.path)) {
    webpage.mainEntity = ref(business['@id']);
  }

  const image = $('main img[src]').first();
  if (image.length) {
    const imageId = url + '#primaryimage';
    const imageUrl = absolute(image.attr('src'));
    const node = {
      '@type': 'ImageObject', '@id': imageId, url: imageUrl, contentUrl: imageUrl,
      caption: image.attr('alt'), representativeOfPage: true, inLanguage: 'en-US'
    };
    for (const dimension of ['width', 'height']) {
      const value = Number(image.attr(dimension));
      if (Number.isInteger(value) && value > 0) node[dimension] = value;
    }
    graph.push(node);
    webpage.primaryImageOfPage = ref(imageId);
    services.forEach(service => { service.image = ref(imageId); });
  }

  if (page.path !== '/') {
    webpage.breadcrumb = ref(url + '#breadcrumb');
    graph.push({
      '@type': 'BreadcrumbList', '@id': url + '#breadcrumb',
      itemListElement: page.breadcrumb.map((crumb, i) => ({ ...crumb, position: i + 1 }))
    });
  }

  // Model the actual linked directory, without manufacturing offers or storefronts.
  if (page.path === '/' || page.path === '/service-areas') {
    const locations = page.path === '/service-areas';
    const linkedPaths = new Set($('main a[href]').toArray().map(el => absolute($(el).attr('href'))));
    const entries = Object.values(pages).filter(p =>
      linkedPaths.has(absolute(p.path)) && (locations ? p.path.startsWith('/locksmith-') : p.services.length && !p.path.startsWith('/locksmith-'))
    );
    const id = url + (locations ? '#locations' : '#services-list');
    graph.push({
      '@type': 'ItemList', '@id': id,
      name: locations ? 'Mobile locksmith service areas' : 'Locksmith services',
      numberOfItems: entries.length, itemListOrder: 'https://schema.org/ItemListUnordered',
      itemListElement: entries.map((p, i) => ({
        '@type': 'ListItem', position: i + 1, name: p.breadcrumb.at(-1).name, url: absolute(p.path)
      }))
    });
    if (locations) webpage.mainEntity = ref(id);
    else webpage.mentions = ref(id);
  }

  const questions = [];
  $('main details').each((_, detail) => {
    const summary = $(detail).children('summary').first();
    const answer = $(detail).clone();
    answer.children('summary').remove();
    const name = plain(summary.text()), text = plain(answer.text());
    if (!name || !text) return;
    // Text-derived IDs survive reordering and link to the visible question.
    const anchor = $(detail).attr('id') || 'question-' + createHash('sha256').update(name).digest('hex').slice(0, 12);
    $(detail).attr('id', anchor);
    questions.push({
      '@type': 'Question', '@id': url + '#' + anchor, url: url + '#' + anchor,
      name, inLanguage: 'en-US',
      acceptedAnswer: { '@type': 'Answer', '@id': url + '#' + anchor + '-answer', text, inLanguage: 'en-US' }
    });
  });
  if (questions.length) {
    if (page.pageType === 'FAQPage') webpage.mainEntity = questions;
    else {
      const faqId = url + '#faq-content';
      webpage.hasPart = ref(faqId);
      graph.push({
        '@type': 'WebPageElement', '@id': faqId, name: 'Frequently asked questions',
        cssSelector: 'main details', isPartOf: ref(pageId), about: webpage.about,
        inLanguage: 'en-US', mainEntity: questions
      });
    }
  }
  graph.push(webpage, ...services);
  return { '@context': 'https://schema.org', '@graph': graph };
}
