import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const origin = 'https://www.northwestsecurityandlocks.com';
const pages = JSON.parse(await readFile('data/pages.json', 'utf8'));
const files = Object.keys(pages);
const documents = new Map();
const titles = new Set(), descriptions = new Set();
const incoming = new Map(Object.values(pages).map(p => [p.path, new Set()]));
let businessJSON, serviceCount = 0, questionCount = 0;
const text = value => value.replace(/\s+/g, ' ').trim();
for (const file of files) {
  const $ = load(await readFile(path.join('dist', file), 'utf8'));
  const config = pages[file], url = origin + config.path;
  assert.equal($('html').attr('lang'), 'en', `${file}: page language`);
  assert.equal($('h1').length, 1, `${file}: exactly one H1`);
  assert.equal($('link[rel="canonical"]').length, 1, `${file}: one canonical`);
  assert.equal($('link[rel="canonical"]').attr('href'), url, `${file}: canonical URL`);
  assert(!($('meta[name="robots"]').attr('content') || '').includes('noindex'), `${file}: indexable`);
  const title = text($('title').text()), description = $('meta[name="description"]').attr('content');
  assert(title && !titles.has(title), `${file}: unique title`); titles.add(title);
  assert(description && !descriptions.has(description), `${file}: unique description`); descriptions.add(description);
  assert.equal($('script[type="application/ld+json"]').length, 1, `${file}: one schema graph`);
  const schema = JSON.parse($('script[type="application/ld+json"]').text());
  assert.equal(schema['@context'], 'https://schema.org');
  const graph = schema['@graph'];
  const business = graph.filter(n => n['@type'] === 'Locksmith');
  assert.equal(business.length, 1, `${file}: one business`);
  if (!businessJSON) businessJSON = JSON.stringify(business[0]);
  assert.equal(JSON.stringify(business[0]), businessJSON, `${file}: shared business facts`);
  assert.equal(business[0].telephone, '+15037601402');
  assert.equal(business[0].address.streetAddress, '14750 SE Division St');
  assert(!business[0].aggregateRating, `${file}: no self-serving review-star markup`);
  const page = graph.find(n => n['@id'] === url + '#webpage');
  assert(page, `${file}: connected webpage node`);
  assert.equal(page.name, title); assert.equal(page.description, description);
  assert.equal(page['@type'], config.pageType, `${file}: page keeps its specific purpose`);
  assert.equal(page.dateModified, config.lastModified, `${file}: maintained modification date`);
  assert.equal(page.isPartOf['@id'], origin + '/#website');
  if (['/', '/about', '/contact'].includes(config.path)) assert.equal(page.mainEntity['@id'], business[0]['@id'], `${file}: business is the main topic`);
  if (config.path === '/') assert.equal(graph.filter(n => n['@type'] === 'Service').length, 0, 'Homepage must not carry unrelated local service nodes');
  const pageIds = graph.map(n => n['@id']);
  assert.equal(new Set(pageIds).size, pageIds.length, `${file}: unique schema IDs`);
  pageIds.forEach(id => assert(id && id.startsWith(origin + '/'), `${file}: absolute canonical schema node ID`));
  const services = graph.filter(n => n['@type'] === 'Service');
  serviceCount += services.length;
  for (const service of services) {
    assert.equal(service.provider['@id'], business[0]['@id'], `${file}: service provider`);
    assert(service.name && service.serviceType && service.description, `${file}: complete service description`);
    assert.equal(service.url, url, `${file}: service belongs to this page`);
    assert.equal(service.mainEntityOfPage['@id'], page['@id'], `${file}: service points back to its page`);
    assert(page.mainEntity.some(n => n['@id'] === service['@id']), `${file}: service remains a primary entity`);
    assert(page.about.some(n => n['@id'] === service['@id']), `${file}: page is about its service`);
    assert(Array.isArray(service.areaServed) && service.areaServed.length, `${file}: typed service coverage`);
    for (const area of service.areaServed) {
      assert(['City', 'Place'].includes(area['@type']) && area.name.endsWith(', Oregon'), `${file}: explicit Oregon coverage`);
      assert(business[0].areaServed.some(known => known.name === area.name && known['@type'] === area['@type']), `${file}: coverage comes from verified business areas`);
      assert(!area.address, `${file}: mobile coverage is not an invented storefront`);
    }
    assert.equal(service.availableChannel.servicePhone.telephone, business[0].telephone);
    assert.equal(service.availableChannel.serviceUrl, url);
  }
  assert.equal(services.length, config.services.length, `${file}: service coverage`);
  const primaryImage = graph.find(n => n['@type'] === 'ImageObject');
  if ($('main img[src]').length) {
    assert(primaryImage, `${file}: representative image schema`);
    assert.equal(page.primaryImageOfPage['@id'], primaryImage['@id']);
    assert.equal(primaryImage.contentUrl, new URL($('main img[src]').first().attr('src'), origin + '/').href);
    assert.equal(primaryImage.caption, $('main img[src]').first().attr('alt'));
  } else assert(!page.primaryImageOfPage, `${file}: no invented page image`);
  for (const list of graph.filter(n => n['@type'] === 'ItemList')) {
    assert.equal(list.numberOfItems, list.itemListElement.length);
    const urls = list.itemListElement.map(n => n.url);
    assert.equal(new Set(urls).size, urls.length, `${file}: unique directory entries`);
    list.itemListElement.forEach((item, i) => {
      assert.equal(item.position, i + 1);
      assert($('main a[href]').toArray().some(el => new URL($(el).attr('href'), origin + '/').href === item.url), `${file}: directory entry is visibly linked`);
    });
    if (config.path === '/service-areas') assert.equal(page.mainEntity['@id'], list['@id'], 'Service areas are the main collection topic');
  }
  const faq = graph.find(n => n['@type'] === 'WebPageElement');
  if (faq) {
    assert.equal(page.hasPart['@id'], faq['@id']);
    assert.equal(faq.isPartOf['@id'], page['@id']);
    assert.equal(faq.cssSelector, 'main details');
  }
  const questionOwner = config.pageType === 'FAQPage' ? page : faq;
  const questions = questionOwner?.mainEntity || [];
  assert.equal(questions.length, $('main details').length, `${file}: FAQ coverage`);
  questions.forEach((question, i) => {
    const detail = $('main details').eq(i).clone();
    assert.equal(question.name, text(detail.children('summary').text()), `${file}: visible FAQ question`);
    assert.equal(question.url, url + '#' + detail.attr('id'), `${file}: question links to visible answer`);
    assert.equal(question['@id'], question.url, `${file}: stable question identity`);
    detail.children('summary').remove();
    assert.equal(question.acceptedAnswer.text, text(detail.text()), `${file}: visible FAQ answer`);
  });
  questionCount += questions.length;
  if (config.path !== '/') {
    const breadcrumb = graph.find(n => n['@type'] === 'BreadcrumbList');
    assert(breadcrumb && breadcrumb.itemListElement.length >= 2, `${file}: breadcrumb schema`);
    const visible = $('nav[aria-label="Breadcrumb"] li');
    assert.equal(visible.length, breadcrumb.itemListElement.length, `${file}: visible breadcrumbs`);
    breadcrumb.itemListElement.forEach((crumb, i) => {
      assert.equal(crumb.position, i + 1); assert.equal(crumb.name, text(visible.eq(i).text()));
    });
    assert.equal(breadcrumb.itemListElement.at(-1).item, url);
    assert.equal($('nav[aria-label="Breadcrumb"] [aria-current="page"]').length, 1);
  }
  assert($('nav[aria-label="Helpful links"] a[href="/about"]').length, `${file}: company information link`);
  assert.equal($('img:not([alt])').length, 0, `${file}: image alternatives`);
  documents.set(config.path, { $, graph, file });
}
const exists = async pathname => {
  const file = path.join('dist', pathname === '/' ? 'index.html' : pathname.slice(1));
  try { await access(file); return true; } catch {}
  try { await access(file + '.html'); return true; } catch { return false; }
};
for (const [pathname, { $, graph, file }] of documents) {
  for (const el of $('a[href], img[src], script[src], link[href]').toArray()) {
    const value = $(el).attr(el.name === 'img' || el.name === 'script' ? 'src' : 'href');
    const url = new URL(value, origin + pathname);
    if (url.origin !== origin || url.pathname.startsWith('/_vercel/')) continue;
    assert(await exists(decodeURIComponent(url.pathname)), `${file}: missing ${url.pathname}`);
    if (el.name === 'a') {
      assert(!url.searchParams.has('request'), `${file}: duplicate request URL`);
      if (url.pathname !== pathname && incoming.has(url.pathname)) incoming.get(url.pathname).add(pathname);
      if (url.hash) {
        const id = decodeURIComponent(url.hash.slice(1).split('&')[0]);
        const target = documents.get(url.pathname)?.$;
        if (target) assert(target('[id]').toArray().some(node => target(node).attr('id') === id), `${file}: missing fragment ${value}`);
      }
    }
    if (el.name === 'script' || (el.name === 'link' && $(el).attr('rel') === 'stylesheet')) {
      assert(/\.[a-f0-9]{12}\.min\.(js|css)$/.test(url.pathname), `${file}: unhashed or unminified resource`);
    }
  }
  const refs = [], definitions = new Map();
  const walk = value => {
    if (!value || typeof value !== 'object') return;
    if (Object.keys(value).length === 1 && value['@id']) refs.push(value['@id']);
    else if (value['@id']) {
      assert(!definitions.has(value['@id']), `${file}: duplicate entity definition ${value['@id']}`);
      definitions.set(value['@id'], value);
    }
    Object.values(value).forEach(walk);
  };
  walk(graph);
  refs.forEach(ref => assert(definitions.has(ref), `${file}: unresolved reference in this page's graph: ${ref}`));
  const htmlIds = $('[id]').map((_, el) => $(el).attr('id')).get();
  assert.equal(new Set(htmlIds).size, htmlIds.length, `${file}: unique HTML anchors`);
}
const sparse = [...incoming].filter(([, sources]) => sources.size < 2);
assert.equal(sparse.length, 0, `Pages with fewer than two incoming source pages: ${JSON.stringify(sparse.map(([url, sources]) => [url, [...sources]]))}`);
const contact = documents.get('/contact').$.root().find('main').clone();
contact.find('script, style, nav').remove();
const contactWords = text(contact.text()).split(/\s+/).length;
assert(contactWords >= 400, `Contact page needs substantial useful content: ${contactWords}`);
const sitemap = load(await readFile('dist/sitemap.xml', 'utf8'), { xmlMode: true });
assert.equal(sitemap('loc').length, files.length, 'Sitemap covers canonical pages only');
const sitemapUrls = new Set(sitemap('loc').map((_, el) => sitemap(el).text()).get());
assert.equal(sitemapUrls.size, files.length, 'Unique sitemap URLs');
for (const p of Object.values(pages)) assert(sitemapUrls.has(origin + p.path));
const robots = await readFile('dist/robots.txt', 'utf8');
assert(robots.includes('Sitemap: ' + origin + '/sitemap.xml'));
assert(!/Disallow:\s*\//i.test(robots), 'Public pages remain crawlable');
const llms = await readFile('dist/llms.txt', 'utf8');
assert(llms.startsWith('# Northwest Security & Lock\n\n> '));
for (const p of Object.values(pages)) assert(llms.includes('](' + origin + p.path + ')'), 'llms.txt includes ' + p.path);
for (const file of ['404.html', 'request-sent.html']) {
  const $ = load(await readFile('dist/' + file, 'utf8'));
  assert($('meta[name="robots"]').attr('content')?.includes('noindex'), file + ' stays out of search');
  assert.equal($('script[type="application/ld+json"]').length, 0, file + ' has no misleading search markup');
}
for (const name of (await readdir('dist')).filter(n => n.endsWith('.css'))) {
  const css = await readFile('dist/' + name, 'utf8');
  for (const match of css.matchAll(/url\(["']?([^\s"')]+)["']?\)/g)) {
    const url = new URL(match[1], origin + '/');
    if (url.origin === origin) assert(await exists(url.pathname), `${name}: missing CSS asset ${url.pathname}`);
  }
}
console.log(`PASS: ${files.length} canonical pages, ${files.length - 1} breadcrumbs, ${serviceCount} services, ${questionCount} matching FAQ answers.`);
console.log(`PASS: local links, fragments, assets, schema references, unique metadata, sitemap and llms.txt. Contact content: ${contactWords} words.`);
