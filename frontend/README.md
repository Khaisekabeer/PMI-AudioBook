# React + Vite

## Google sign-in setup

Set `VITE_GOOGLE_CLIENT_ID` in your local Vite environment to the **Web
application** OAuth client from Google Cloud. Vite's `.env.development` overrides
`.env` in development; keep their client IDs consistent and restart Vite after
changing them. The backend's `GOOGLE_CLIENT_ID` should identify the same client.

In [Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients),
open that client and add the frontend's exact origin under **Authorized
JavaScript origins**. For the default development server this is:

```text
http://localhost:5173
```

If you use `http://127.0.0.1:5173`, a preview port such as `4173`, or a deployed
HTTPS hostname, register that exact origin separately. Origins contain the
scheme, host, and port, with no `/login` path. Preserve existing registered
origins. Save, allow the Google configuration to propagate, then reload the app.

This app uses the Google Identity Services popup token flow. An
`origin_mismatch` error is Google's rejection of an unregistered browser origin;
changing a redirect URI or the Vite asset origin does not register it. Use a
normal browser such as Chrome for the live Google sign-in check.

See [Google's origin mismatch documentation](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#authorization-errors-origin-mismatch).
Automated OAuth tests use a simulated Google SDK and backend: they verify the
frontend integration, but do not validate the client's Google Cloud registration.

## Appearance and regression tests

The moon/sun button in each page's navigation toggles night mode. The choice is
saved in browser storage and is retained during navigation and after a reload.
The app's custom screen reader and spoken feedback have been removed; audiobook
playback, keyboard navigation, labels, and visual accessibility controls remain.

Run the desktop and mobile Chromium regression suite with:

```sh
npm install
npx playwright install chromium
npm test
```

Tests build the app and start a local preview server on port 4173. API responses and audiobook media
use local fixtures, so no backend account or Google sign-in is needed. Coverage
includes theme switching on all six pages, persistence, keyboard activation,
speech removal with old preferences saved, form errors, and actual audio playback.
Screenshots and failure traces are saved in `test-results/`.

`npm run build` checks the production bundle. The existing `npm run lint`
configuration currently references an unsupported `tab-width` rule.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
