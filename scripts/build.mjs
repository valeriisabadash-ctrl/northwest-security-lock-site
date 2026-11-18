import { readFile, writeFile, readdir, mkdir, rm, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { load } from 'cheerio';
import { transform } from 'esbuild';
import { createPageGraph } from './schema.mjs';

const root = process.cwd();
const out = path.join(root, 'dist');
const business = JSON.parse(await readFile('data/business.json', 'utf8'));
const pages = JSON.parse(await readFile('data/pages.json', 'utf8'));
const origin = new URL(business.url).origin;
const absolute = value => new URL(value, business.url).href;
const plain = value => value.replace(/\s+/g, ' ').trim();
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const resources = [['/about', 'About Us'], ['/service-areas', 'Service Areas'], ['/reviews', 'Customer Reviews'], ['/faq', 'Locksmith FAQ'], ['/contact', 'Contact the Shop']];
const resourceNav = `<nav class="site-resource-links container" aria-label="Helpful links">${resources.map(([href, name]) => `<a href="${href}">${name}</a>`).join('')}</nav>`;

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp('assets', path.join(out, 'assets'), { recursive: true });
const entries = await readdir(root, { withFileTypes: true });
const assetMap = new Map();
let sourceBytes = 0, minifiedBytes = 0;
for (const entry of entries) {
  if (!entry.isFile()) continue;
  const name = entry.name;
  if (/\.(css|js)$/.test(name)) {
    const ext = path.extname(name).slice(1);
    const source = await readFile(name, 'utf8');
    const result = await transform(source, { loader: ext, minify: true, legalComments: 'none', target: ext === 'js' ? 'es2020' : ['chrome90', 'safari15', 'firefox90'] });
    const hash = createHash('sha256').update(result.code).digest('hex').slice(0, 12);
    const hashed = `${path.basename(name, '.' + ext)}.${hash}.min.${ext}`;
    assetMap.set(name, hashed);
    // Legacy resource URLs keep working for cached HTML and inbound links.
    await writeFile(path.join(out, name), result.code);
    await writeFile(path.join(out, hashed), result.code);
    sourceBytes += Buffer.byteLength(source);
    minifiedBytes += Buffer.byteLength(result.code);
  } else if (/\.(svg|png|jpg|jpeg|webp|ico)$/.test(name)) {
    await cp(name, path.join(out, name));
  }
}

const summaries = [];
for (const entry of entries.filter(e => e.isFile() && e.name.endsWith('.html'))) {
  const name = entry.name;
  const $ = load(await readFile(name, 'utf8'));
  const page = pages[name];
  $('link[href*="fonts.googleapis.com/css"]').attr('href', 'fonts.css');
  $('link[rel="preconnect"][href*="fonts."]').remove();
  $('head').append('<link rel="preload" href="/assets/fonts/libre-baskerville-43bd400c.woff2" as="font" type="font/woff2" crossorigin>');

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const url = new URL(href, business.url);
    if (url.origin === origin && url.searchParams.get('request') === '1') {
      // Fragment state opens the same form without creating duplicate indexed URLs.
      $(el).attr('href', '/#request-modal' + (url.searchParams.get('service') ? '&service=' + encodeURIComponent(url.searchParams.get('service')) : ''));
    }
  });
  $('img[src]').each((_, el) => {
    const image = $(el);
    if (image.attr('src').includes('raw.githubusercontent.com') && image.attr('src').includes('automotive-locksmith')) {
      image.attr('src', '/assets/automotive-locksmith-key-fob-service-optimized.webp');
    }
    if (image.attr('src').endsWith('logo.svg') && !image.attr('width')) image.attr({ width: '170', height: '78' });
    if (!image.attr('decoding')) image.attr('decoding', 'async');
  });

  if (page) {
    const url = absolute(page.path);
    const title = plain($('title').text());
    const description = $('meta[name="description"]').attr('content');
    $('link[rel="canonical"]').attr('href', url);
    $('meta[name="robots"]').attr('content', 'index,follow,max-image-preview:large,max-snippet:-1');
    const meta = (selector, attrs) => {
      const found = $(selector);
      if (found.length) found.attr(attrs); else $('<meta>').attr(attrs).appendTo('head');
    };
    meta('meta[property="og:url"]', { property: 'og:url', content: url });
    meta('meta[property="og:title"]', { property: 'og:title', content: title });
    meta('meta[property="og:description"]', { property: 'og:description', content: description });
    meta('meta[property="og:site_name"]', { property: 'og:site_name', content: business.name });
    meta('meta[property="og:image"]', { property: 'og:image', content: business.image });
    meta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: 'Northwest Security & Lock mobile locksmith service van' });
    meta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });

    if ($('footer').length) $('footer').append(resourceNav);
    else $('main').after(`<footer class="site-footer">${resourceNav}<p class="container">Northwest Security &amp; Lock · 14750 SE Division St, Portland, OR 97236 · <a href="tel:+15037601402">(503) 760-1402</a></p></footer>`);

    if (page.path !== '/') {
      const crumbs = page.breadcrumb.map((crumb, i) => ({ ...crumb, position: i + 1 }));
      if (!crumbs.length) throw new Error('Missing breadcrumb data for ' + name);
      $('.breadcrumbs, .site-breadcrumbs').remove();
      const html = `<nav class="site-breadcrumbs container" aria-label="Breadcrumb"><ol>${crumbs.map((crumb, i) => `<li>${i === crumbs.length - 1 ? `<span aria-current="page">${escape(crumb.name)}</span>` : `<a href="${escape(new URL(crumb.item).pathname)}">${escape(crumb.name)}</a>`}</li>`).join('')}</ol></nav>`;
      $('main').prepend(html);
    }
    const schema = createPageGraph({ $, business, page, pages });
    // Schema comes from the build, so crawlers receive complete JSON-LD without JavaScript.
    $('script[type="application/ld+json"]').remove();
    $('head').append(`<script type="application/ld+json">${json(schema)}</script>`);
    summaries.push({ url, title, description, lastModified: page.lastModified });
  }

  $('head').append('<link rel="stylesheet" href="seo-enhancements.css">');
  const localStyles = $('link[rel="stylesheet"]').toArray().filter(el => new URL($(el).attr('href'), business.url).origin === origin);
  const sources = await Promise.all(localStyles.map(el => readFile(new URL($(el).attr('href'), business.url).pathname.slice(1), 'utf8')));
  const bundle = (await transform(sources.join('\n'), { loader: 'css', minify: true, legalComments: 'none', target: ['chrome90', 'safari15', 'firefox90'] })).code;
  const hash = createHash('sha256').update(bundle).digest('hex').slice(0, 12);
  const bundleName = `site-styles.${hash}.min.css`;
  await writeFile(path.join(out, bundleName), bundle);
  $(localStyles[0]).attr('href', '/' + bundleName);
  localStyles.slice(1).forEach(el => $(el).remove());
  $('link[rel="stylesheet"][href], script[src]').each((_, el) => {
    const attr = el.name === 'script' ? 'src' : 'href';
    const url = new URL($(el).attr(attr), business.url);
    const filename = url.pathname.slice(1);
    if (url.origin === origin && assetMap.has(filename)) $(el).attr(attr, '/' + assetMap.get(filename));
  });
  // Inline code and style are optimized as well; JSON-LD stays JSON.
  for (const el of $('script:not([src]):not([type]), script[type="text/javascript"]').toArray()) {
    const code = $(el).html();
    if (code?.trim()) $(el).text((await transform(code, { loader: 'js', minify: true, target: 'es2020' })).code);
  }
  for (const el of $('style').toArray()) {
    $(el).text((await transform($(el).html(), { loader: 'css', minify: true })).code);
  }
  await writeFile(path.join(out, name), $.html());
}

await writeFile(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${summaries.map(p => `  <url><loc>${escape(p.url)}</loc><lastmod>${p.lastModified}</lastmod></url>`).join('\n')}\n</urlset>\n`);
await cp('robots.txt', path.join(out, 'robots.txt'));
await writeFile(path.join(out, 'llms.txt'), `# Northwest Security & Lock\n\n> Portland, Oregon locksmith shop providing automotive, residential and commercial locksmith services, with mobile service across the Portland metro area.\n\n## Business information\n\n- Official website: ${business.url}\n- Phone: ${business.telephone}\n- Email: ${business.email}\n- Shop: 14750 SE Division St, Portland, OR 97236, United States\n- Shop hours: Monday–Friday, 9:00 AM–5:00 PM, America/Los_Angeles\n- Emergency service: available by phone 24/7; call to confirm dispatch availability, compatibility and pricing.\n- The Portland shop is the physical location. Service-area pages describe mobile coverage, not additional storefronts.\n\n## Services and customer information\n\n${summaries.filter(p => !new URL(p.url).pathname.startsWith('/locksmith-')).map(p => `- [${p.title}](${p.url}): ${p.description}`).join('\n')}\n\n## Mobile service areas\n\n${summaries.filter(p => new URL(p.url).pathname.startsWith('/locksmith-')).map(p => `- [${p.title}](${p.url}): ${p.description}`).join('\n')}\n`);
console.log(`Built ${summaries.length} indexable pages with shared JSON-LD, ${summaries.length - 1} breadcrumb trails and llms.txt.`);
console.log(`CSS/JS: ${sourceBytes.toLocaleString()} → ${minifiedBytes.toLocaleString()} bytes (${Math.round((1 - minifiedBytes / sourceBytes) * 100)}% smaller).`);
