# cse134-hw4

| Field | Value |
|---|---|
| Repository URL | https://github.com/5ycm/cse134-hw4 |
| Deployed URL | _add your Netlify/Vercel/GitHub Pages URL here_ |

## What's where

| Part | Files |
|---|---|
| 1–2: HTML/CSS-only form | `form-no-js.html`, `style.css` (no JavaScript) |
| 3: Enhanced form | `form-with-js.html`, `form.js` (loaded with `defer`) |
| 4.1: Theme switching | `theme.js`, theme variables at the top of `style.css` |
| 4.2: View transition | Theme button uses `document.startViewTransition()`; page-to-page navigation uses `@view-transition { navigation: auto; }` |

## Notes

- Default theme is dark (my HW3 colors), so every page is readable with JavaScript off.
- The theme button is `hidden` in the HTML and only revealed by `theme.js`.
- Both view transitions are disabled under `prefers-reduced-motion: reduce`; the theme still switches.
- `form_errors` records one entry per invalid field per failed submit (captured with a capturing `invalid` listener on the form) and is sent as JSON in the hidden `form-errors` field.
