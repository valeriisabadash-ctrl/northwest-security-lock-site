# Northwest Security & Lock

Production: https://www.northwestsecurityandlocks.com/

## Build and check

Use Node 22 or later. Run `npm ci`, `npm run build`, `npm test`, and `npx playwright test`. Install the test browser once with `npx playwright install chromium --only-shell`. `npm run dev` serves the generated site at http://127.0.0.1:4173.

Vercel builds with `npm run build` and serves **dist/**. Do not deploy the repository root as a static folder: source HTML intentionally leaves structured-data generation to the build. `dist` is generated and not committed.

## Content and structured data

- Edit visible content in the root HTML files. Keep established, descriptive URL slugs.
- `data/business.json` is the shared source for verified business name, contact details, shop hours, emergency phone availability, address and coverage.
- `data/pages.json` defines page types, service nodes, breadcrumb hierarchy and meaningful modification dates. Update `lastModified` when changing a page's content; do not reset dates on every build.
- `scripts/build.mjs` embeds a complete Schema.org JSON-LD graph in each HTML response. FAQ questions and answers are extracted from visible `main details` elements. The same breadcrumb data creates visible navigation and BreadcrumbList markup.
- The build generates `sitemap.xml` and `llms.txt`. The latter is a supplementary content directory, not a ranking guarantee or a replacement for the sitemap and crawlable HTML.
- `robots.txt` allows crawling. Confirmation and 404 pages remain noindex; Vercel preview hosts retain the existing noindex response rule.
- Fonts are served locally under `assets/fonts/`; their original SIL Open Font licenses are included. CSS is combined in its original cascade order and minified. Local CSS and JS receive content-hashed filenames. Old resource filenames remain available in minified form for cached HTML.
- Eight image filenames were changed to descriptive kebab-case names. Permanent redirects preserve their former URLs.
- Request links use fragments to avoid duplicate query-string pages. Existing `?request=1&service=...` links remain supported. The secure request relay initializes only when the form is opened or submitted.

Do not add invented prices, credentials, locations, reviews or ratings. Mobile service areas are not separate physical storefronts. Google Search Console and Analytics account access requires verifying valerii@momentummatrix.ai; ordinary source changes do not access those services.

## Verification

`npm test` checks all 30 canonical pages, metadata, local links and fragments, image/style references, incoming links, business consistency, service references, visible FAQ correspondence, breadcrumbs and crawl files. Browser tests cover all pages at mobile and desktop widths, navigation, old/new form links and a mocked form relay. They do not send a customer request.
