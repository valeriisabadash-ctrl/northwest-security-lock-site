import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { load } from 'cheerio';

const origin = 'https://www.northwestsecurityandlocks.com';
const pages = JSON.parse(await readFile('data/pages.json', 'utf8'));
const images = JSON.parse(await readFile('data/images.json', 'utf8'));
const documents = new Map();
let imageCount = 0, tableCount = 0;
for (const file of (await readdir('dist')).filter(name => name.endsWith('.html'))) {
  const html = await readFile('dist/' + file, 'utf8');
  const $ = load(html), config = pages[file];
  const label = element => element.attr('aria-label') || (element.attr('aria-labelledby') || '').split(/\s+/).map(id => $('[id]').filter((_, el) => $(el).attr('id') === id).text()).join(' ').trim();
  assert.equal($('meta[charset]').length, 1, file + ': one encoding declaration');
  assert(html.slice(0, 1024).includes('<meta charset="utf-8">'), file + ': early UTF-8');
  assert.equal($('meta[name="viewport"]').length, 1, file + ': one viewport');
  assert.equal($('title').length, 1, file + ': one title');
  assert.equal($('meta[name="description"]').length, 1, file + ': one description');
  assert($('title').text().trim() && $('meta[name="description"]').attr('content')?.trim());
  assert.equal($('meta[name="robots"]').length, 1, file + ': one robots policy');
  assert.equal($('meta[name="googlebot"],meta[name="bingbot"]').length, 0, file + ': no conflicting bot-specific policy');
  assert.equal($('main').length, 1, file + ': one main landmark');
  assert.equal($('main h1').length, 1, file + ': primary heading in main');
  assert(label($('main')), file + ': named main landmark');
  assert.equal($('main').attr('tabindex'), '-1', file + ': main can receive skip-link focus');
  assert.equal($('.skip-link').attr('href'), '#' + $('main').attr('id'), file + ': working skip target');
  const navNames = [];
  $('nav,aside').each((_, el) => {
    assert(label($(el)), file + ': named ' + el.tagName + ' landmark');
    if (el.tagName === 'nav') navNames.push(label($(el)));
  });
  assert.equal(navNames.length, new Set(navNames).size, file + ': distinguishable navigation landmarks');
  $('[aria-labelledby]').each((_, el) => {
    for (const id of $(el).attr('aria-labelledby').split(/\s+/)) assert.equal($('[id]').filter((_, n) => $(n).attr('id') === id).length, 1, file + ': label target ' + id);
  });
  let previousLevel = 0;
  $('h1,h2,h3,h4,h5,h6').each((_, el) => {
    const level = Number(el.tagName.slice(1));
    assert($(el).text().trim(), file + ': nonempty heading');
    assert(level <= previousLevel + 1, file + ': skipped heading level at ' + $(el).text());
    previousLevel = level;
  });
  assert.equal($('.service-group h2, .info-card > strong').length, 0, file + ': cards use subsection headings');
  const ids = $('[id]').map((_, el) => $(el).attr('id')).get();
  assert.equal(new Set(ids).size, ids.length, file + ': unique HTML identifiers');
  $('img').each((_, el) => {
    const image = $(el), url = new URL(image.attr('src'), origin);
    assert(image.attr('alt') !== undefined, file + ': explicit image alternative');
    if (url.origin === origin) {
      const info = images[url.pathname.slice(1)];
      assert(info, file + ': image has reviewed metadata: ' + url.pathname);
      if (image.attr('alt') !== '') assert.equal(image.attr('alt'), info.alt, file + ': accurate image description');
      assert.equal(Number(image.attr('width')), info.width);
      assert.equal(Number(image.attr('height')), info.height);
    }
    imageCount++;
  });
  $('table').each((_, el) => {
    const table = $(el), cols = table.find('thead th').length;
    assert.equal(table.children('caption').length, 1, file + ': table caption');
    assert(table.children('caption').text().trim());
    assert(cols > 0, file + ': table column headings');
    assert.equal(table.find('thead th[scope="col"]').length, cols);
    table.find('tbody tr').each((_, row) => {
      assert.equal($(row).children('th,td').length, cols, file + ': consistent table columns');
      assert.equal($(row).children('th[scope="row"]').length, 1, file + ': row headings');
    });
    assert.equal(table.parent().attr('tabindex'), '0', file + ': keyboard-scrollable table');
    assert(label(table.parent()), file + ': named table region');
    tableCount++;
  });
  if (config) {
    const url = origin + config.path, description = $('meta[name="description"]').attr('content');
    assert.equal($('link[rel="canonical"]').attr('href'), url);
    assert.equal($('meta[name="robots"]').attr('content'), 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
    for (const name of ['title', 'description']) {
      const value = name === 'title' ? $('title').text() : description;
      for (const selector of [`meta[property="og:${name}"]`, `meta[name="twitter:${name}"]`]) {
        assert.equal($(selector).length, 1, file + ': single ' + selector);
        assert.equal($(selector).attr('content'), value, file + ': synchronized ' + selector);
      }
    }
    assert.equal($('meta[property="og:url"]').attr('content'), url);
    assert.equal($('meta[property="og:image"]').attr('content'), $('meta[name="twitter:image"]').attr('content'));
    assert.equal($('meta[property="og:image:alt"]').attr('content'), $('meta[name="twitter:image:alt"]').attr('content'));
    documents.set(url, $);
  } else {
    assert.equal($('meta[name="robots"]').attr('content'), 'noindex,follow');
    assert.equal($('link[rel="canonical"]').length, 0, file + ': utility page must not canonicalize to unrelated content');
  }
}
const xml = load(await readFile('dist/sitemap.xml', 'utf8'), { xmlMode: true });
assert.equal(xml('urlset').attr('xmlns'), 'http://www.sitemaps.org/schemas/sitemap/0.9');
assert.equal(xml('urlset').attr('xmlns:image'), 'http://www.google.com/schemas/sitemap-image/1.1');
assert.equal(xml('url').length, documents.size);
for (const entry of xml('url').toArray()) {
  const url = xml(entry).children('loc').text(), $ = documents.get(url);
  assert($, 'Sitemap URL must be a canonical indexable page: ' + url);
  assert(!new URL(url).search && !new URL(url).hash);
  const lastmod = xml(entry).children('lastmod').text();
  assert(/^\d{4}-\d{2}-\d{2}$/.test(lastmod) && Number.isFinite(Date.parse(lastmod)), 'Valid maintained date');
  assert.equal(lastmod, Object.values(pages).find(page => origin + page.path === url).lastModified);
  const included = xml(entry).find('image\\:loc').map((_, el) => xml(el).text()).get();
  const visible = [...new Set($('main img').toArray().filter(el => $(el).attr('alt') !== '').map(el => new URL($(el).attr('src'), origin).href))];
  assert.deepEqual(included, visible, 'Sitemap images match visible content on ' + url);
}
const directives = (await readFile('dist/robots.txt', 'utf8')).split('\n').map(line => line.split('#')[0].trim()).filter(Boolean);
assert.deepEqual(directives, ['User-agent: *', 'Allow: /', 'Sitemap: ' + origin + '/sitemap.xml'], 'Open crawling policy and correct sitemap');
console.log(`PASS: ${documents.size + 2} HTML documents with consistent robots, metadata, landmarks and headings; ${imageCount} reviewed image alternatives; ${tableCount} accessible data table.`);
console.log('PASS: image sitemap matches canonical pages and displayed images; utility pages remain crawlable and noindex.');
