import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { load } from 'cheerio';

// Check the rendered HTML that crawlers receive, without relying on JavaScript.
const business = JSON.parse(await readFile('data/business.json', 'utf8'));
const origin = new URL(business.url).origin;
const config = JSON.parse(await readFile('data/pages.json', 'utf8'));
const pages = new Map(Object.entries(config).map(([file, page]) => [page.path, {
  path: page.path, file, incoming: new Set(), contentIncoming: new Set(),
  outgoing: new Set(), contentOutgoing: new Set(), anchors: [], depth: null,
}]));
const problems = [];
const plain = value => value.replace(/\s+/g, ' ').trim();

for (const page of pages.values()) {
  const $ = load(await readFile('dist/' + page.file, 'utf8'));
  for (const element of $('a[href]').toArray()) {
    const anchor = $(element), href = anchor.attr('href');
    const url = new URL(href, origin + page.path);
    if (url.origin !== origin) continue;
    const target = pages.get(url.pathname);
    // Asset links and utility pages are checked separately by validate.mjs.
    if (!target) continue;
    const label = plain(anchor.attr('aria-label') || anchor.text() || anchor.find('img').attr('alt') || '');
    const contextual = anchor.closest('main').length > 0 && anchor.closest('nav').length === 0;
    const context = contextual ? 'content' : 'navigation';
    if (!label) problems.push(`${page.path}: unnamed link to ${href}`);
    if (/^(click here|here|read more|learn more|more)$/i.test(label)) problems.push(`${page.path}: vague anchor '${label}'`);
    if (url.search) problems.push(`${page.path}: internal link uses a query variant ${href}`);
    if (/\bnofollow\b/i.test(anchor.attr('rel') || '')) problems.push(`${page.path}: internal nofollow link ${href}`);
    if (page.path === target.path) continue;
    page.anchors.push({ to: target.path, label, context, href });
    page.outgoing.add(target.path);
    target.incoming.add(page.path);
    if (contextual) {
      page.contentOutgoing.add(target.path);
      target.contentIncoming.add(page.path);
    }
  }
}

const home = pages.get('/');
assert(home, 'Homepage is configured');
home.depth = 0;
const queue = [home];
for (let i = 0; i < queue.length; i++) {
  for (const targetPath of queue[i].outgoing) {
    const target = pages.get(targetPath);
    if (target.depth !== null) continue;
    target.depth = queue[i].depth + 1;
    queue.push(target);
  }
}
for (const page of pages.values()) {
  if (page.depth === null) problems.push(`${page.path}: unreachable from the homepage`);
  if (page.depth > 2) problems.push(`${page.path}: more than two clicks from the homepage`);
  // Site maintenance thresholds preserve the useful links reviewed for these
  // 30 pages; they are not claimed to be universal search-engine requirements.
  if (page.contentIncoming.size < 2) problems.push(`${page.path}: fewer than two contextual source pages`);
  if (page.contentOutgoing.size < 2) problems.push(`${page.path}: fewer than two contextual destinations`);
}
const report = {
  checkedAt: new Date().toISOString(),
  summary: {
    pages: pages.size,
    contextualConnections: [...pages.values()].reduce((sum, p) => sum + p.contentOutgoing.size, 0),
    orphanPages: [...pages.values()].filter(p => !p.incoming.size).length,
    maxDepth: Math.max(...[...pages.values()].map(p => p.depth ?? Infinity)),
    minimumContextualSources: Math.min(...[...pages.values()].map(p => p.contentIncoming.size)),
  },
  pages: [...pages.values()].map(p => ({ ...p, incoming: [...p.incoming], contentIncoming: [...p.contentIncoming], outgoing: [...p.outgoing], contentOutgoing: [...p.contentOutgoing] })),
  problems,
};
if (process.argv[2]) await writeFile(process.argv[2], JSON.stringify(report, null, 2) + '\n');
assert.equal(problems.length, 0, problems.join('\n'));
console.log(`PASS: ${pages.size} pages reachable within ${report.summary.maxDepth} clicks; ${report.summary.contextualConnections} contextual connections; no orphan pages or link-quality issues.`);
