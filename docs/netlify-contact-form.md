# Contact form setup

The `contact` form is present in the generated `.dist/index.html`, with `data-netlify="true"`, a `form-name` field, named visitor fields and a hidden honeypot. The email field uses the name `email`, so Netlify can use it for reply-to. No extra backend function is required.

With JavaScript, submissions are URL-encoded and POSTed to `/thank-you.html`; the form only clears after an accepted response. Failures and timeouts retain the brief for retry. Without JavaScript, the native POST uses the same success page. The build publishes that page and the form module.

## Netlify dashboard

1. Open the portfolio site's **Forms** page and enable **Form detection** if it is disabled.
2. Deploy this version after enabling detection. Confirm the `contact` form appears.
3. Open **Forms → Submission notifications → Add notification**. Choose email, the `contact` form, and the desired receiving address (for example `srinidhibhat45@gmail.com`).
4. Submit a real enquiry on the deployed website and check both **Verified submissions** and the email inbox. Local/file previews do not run Netlify's form service and cannot verify notification delivery.

Notification recipients are managed in the Netlify dashboard, not in public HTML. This update prepares the site; it does not change dashboard settings or claim a notification was delivered.

Official references: [Forms setup](https://docs.netlify.com/manage/forms/setup/), [Submission notifications](https://docs.netlify.com/manage/forms/notifications/).

## Verification

- Production output contains the static form, the submit module, and `thank-you.html`.
- All 38 regression tests passed, including encoded payloads, accepted responses, rejected requests, timeouts, duplicate-click prevention, honeypots, and native form declarations.
- Local browser checks verified retained input and readable feedback after a rejected POST, plus the standalone success page. No live Netlify submission or email notification was sent.
- Service rows were checked at 1280 px, 393 px and 320 px, including expanded/collapsed cards.
