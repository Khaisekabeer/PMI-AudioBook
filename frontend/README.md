# React + Vite

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
