# Northwest Security & Lock Website

Static website for Northwest Security & Lock in Portland, Oregon.

## Client preview

The new GitHub/Vercel version is live here for review:

- https://northwest-security-lock-site-ia18c26dp.vercel.app

Do **not** use `northwestsecurityandlock.com` as the preview right now. That domain is still pointing to the old website until the client transfers/updates the domain.

## Active public pages

- `index.html`
- `contact.html`
- `services/automotive-locksmith.html`
- `services/residential-locksmith.html`
- `services/commercial-locksmith.html`
- `services/access-control.html`
- `service-area/portland-locksmith.html`
- `service-area/gresham-locksmith.html`
- `service-area/happy-valley-locksmith.html`
- `service-area/clackamas-locksmith.html`
- `service-area/milwaukie-locksmith.html`
- `sitemap.xml`
- `robots.txt`

## Notes before final launch

- Replace the CSS lock mark with the final official logo file when available.
- Add real shop, truck, and technician photos when the client has them.
- Add real Google reviews only after pulling actual customer review text.
- Add license or credential wording only if the client confirms the exact wording.
- Confirm phone number, email, hours, address, and exact service areas before launch.
- If a real backend is added later, replace the mailto lead form and local chat storage with CRM/email/SMS submission.

## Domain launch plan

After approval, connect the real domain to Vercel:

1. Add `northwestsecurityandlock.com` and `www.northwestsecurityandlock.com` inside the Vercel project domains.
2. Point the root/apex domain to Vercel with an A record.
3. Point `www` to Vercel with the CNAME Vercel gives in the domain settings.
4. Remove old WordPress/hosting DNS records so the old site stops showing.
5. Test both root and www versions after DNS updates.
