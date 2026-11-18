import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const origin = 'https://www.northwestsecurityandlocks.com';
const pages = JSON.parse(await readFile('data/pages.json', 'utf8'));
const files = Object.keys(pages);
const documents = new Map();
const titles = new Set(), descriptions = new Set(), ids = new Set();
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
  const pageIds = graph.map(n => n['@id']);
  assert.equal(new Set(pageIds).size, pageIds.length, `${file}: unique schema IDs`);
  pageIds.forEach(id => { assert(id, `${file}: schema node ID`); ids.add(id); });
  const services = graph.filter(n => n['@type'] === 'Service');
  serviceCount += services.length;
  for (const service of services) {
    assert.equal(service.provider['@id'], business[0]['@id'], `${file}: service provider`);
    assert(service.name && service.serviceType, `${file}: service description`);
  }
  const questions = Array.isArray(page.mainEntity) ? page.mainEntity.filter(n => n['@type'] === 'Question') : [];
  assert.equal(questions.length, $('main details').length, `${file}: FAQ coverage`);
  questions.forEach((question, i) => {
    const detail = $('main details').eq(i).clone();
    assert.equal(question.name, text(detail.children('summary').text()), `${file}: visible FAQ question`);
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
  const refs = [];
  const walk = value => {
    if (!value || typeof value !== 'object') return;
    if (Object.keys(value).length === 1 && value['@id']) refs.push(value['@id']);
    Object.values(value).forEach(walk);
  };
  walk(graph);
  refs.forEach(ref => assert(ids.has(ref), `${file}: unresolved graph reference ${ref}`));
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
