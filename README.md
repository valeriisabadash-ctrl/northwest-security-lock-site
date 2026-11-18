# Northwest Security & Lock

Production: https://www.northwestsecurityandlocks.com/

## Build and check

Use Node 22 or later. Run `npm ci`, `npm run build`, `npm test`, and `npx playwright test`. Install the test browser once with `npx playwright install chromium --only-shell`. `npm run dev` serves the generated site at http://127.0.0.1:4173.

Vercel builds with `npm run build` and serves **dist/**. Do not deploy the repository root as a static folder: source HTML intentionally leaves structured-data generation to the build. `dist` is generated and not committed.

## Content and structured data

- Edit visible content in the root HTML files. Keep established, descriptive URL slugs.
- `data/business.json` is the shared source for verified business name, contact details, shop hours, emergency phone availability, address and coverage.
- `data/pages.json` defines page types, service nodes, breadcrumb hierarchy and meaningful modification dates. Update `lastModified` when changing a page's content; do not reset dates on every build.
- `scripts/schema.mjs` creates the graph, and `scripts/build.mjs` embeds it in each HTML response. Service pages identify their own service as the main entity; the homepage, About and Contact pages identify the business. Only the dedicated FAQ page uses `FAQPage`. Supporting questions on other pages belong to a `WebPageElement`, so they do not replace the page's primary topic.
- Questions and answers come from visible `main details` elements, with stable question anchors. Service coverage uses the verified Oregon City/Place data. The homepage service directory and service-area collection include only visibly linked pages. Page images and captions come from the first main-content image; no image is invented for pages without one.
- Each page's graph resolves its own entity references. Service/provider, page/website, page/service, image and FAQ relationships are checked automatically. The same breadcrumb data creates visible navigation and BreadcrumbList markup.
- The build generates `sitemap.xml` and `llms.txt`. The latter is a supplementary content directory, not a ranking guarantee or a replacement for the sitemap and crawlable HTML.
- `robots.txt` allows crawling. Confirmation and 404 pages remain noindex; Vercel preview hosts retain the existing noindex response rule.
- Fonts are served locally under `assets/fonts/`; their original SIL Open Font licenses are included. CSS is combined in its original cascade order and minified. Local CSS and JS receive content-hashed filenames. Old resource filenames remain available in minified form for cached HTML.
- `scripts/html.mjs` normalizes metadata and semantic HTML in the generated pages: one robots directive and canonical, matching Open Graph/Twitter text, early UTF-8, named navigation and sidebars, focusable skip targets, and correctly nested card/FAQ headings. Edit titles and descriptions in the source HTML; social metadata is synchronized during the build.
- `data/images.json` contains visually reviewed alt text and actual image dimensions. Describe the picture without inventing a city, work history or equipment that is not visible. Decorative images can explicitly retain `alt=""`.
- The sitemap includes all 30 canonical pages and the images actually shown in their main content. It omits utility, query-string and redirect URLs. `lastmod` uses the maintained page date, never the build time. Robots and sitemap responses use explicit content types and a one-hour revalidation policy.
- The contact-options data table has a caption, row and column headings, and a named horizontal-scrolling region that works with a keyboard on small screens.
- Eight image filenames were changed to descriptive kebab-case names. Permanent redirects preserve their former URLs.
- Request links use fragments to avoid duplicate query-string pages. Existing `?request=1&service=...` links remain supported. The secure request relay initializes only when the form is opened or submitted.

Do not add invented prices, credentials, locations, reviews or ratings. Mobile service areas are not separate physical storefronts. Google Search Console and Analytics account access requires verifying valerii@momentummatrix.ai; ordinary source changes do not access those services.

Schema is descriptive, not a promise of rich results or AI citations. Google retired FAQ rich results in May 2026; visible questions still have useful semantic markup. Reference: https://developers.google.com/search/updates and https://developers.google.com/search/docs/appearance/structured-data/sd-policies.

## Verification

`npm test` checks all 30 canonical pages, metadata, local links and fragments, image/style references, incoming links, business consistency, service references, visible FAQ correspondence, breadcrumbs and crawl files. It also checks all 32 HTML documents for semantic structure, landmark labels, heading order, image alternatives, utility-page noindex behavior and table headers. Browser tests cover all pages at mobile and desktop widths, keyboard skip links, table scrolling, navigation, old/new form links and a mocked form relay. They do not send a customer request.
