# Known issues — Camisetas FQ v1.0.0

**Detected:** 2026-05-23, immediately after v1.0.0 tag.
**Target fix:** v1.1.0 (next session).
**Status:** documented locally only — NOT opened as GitHub issues per user request.

---

## 🐛 BUG-1 (P1) · "PEDIR TODAS POR WHATSAPP" button in favorites drawer does not respond to click

**Severity:** P1 — breaks the main flow for ordering multiple favorited shirts in a single WhatsApp message.

### Symptoms
- Click on the green `#favCta` button has zero effect: no WhatsApp tab opens, no console error, no visible UI feedback.
- Single-item "Pedir →" buttons on individual product cards work correctly.
- The drawer otherwise renders correctly: items list, prices, "Vaciar lista" link, "✕" close button all functional.

### Environment confirmed
- Chrome desktop (latest, 2026-05-23).
- DevTools console is clean — no JS errors, no CSP violations, no failed network requests.
- HTML/CSS/ARIA inspection shows the `<button id="favCta">` is in the DOM with no `disabled` attribute, no `pointer-events: none`, and the listener target exists.

### Suspected root causes (in order of likelihood)

1. **Listener attached before drawer is populated.** In `public/scripts/favoritos.js` the listener is wired via `favCta?.addEventListener(...)` at top-level script execution (immediately after `DOMContentLoaded` / `defer`). The drawer's `<div id="favFooter" hidden>` containing the button IS in the DOM at that point, but the listener may be attaching to a node that gets replaced when the drawer is opened the first time. Need to verify by inspecting the actual node identity vs the listener registration.

2. **Missing event delegation.** Since the drawer's inner HTML (`favList.innerHTML = ...`) is rebuilt every time `renderDrawer()` runs, if `favCta` were inside `favList` it would get destroyed. **But `favCta` is in `favFooter`, NOT in `favList`** — so this shouldn't be the issue. Worth re-verifying though.

3. **The button is shadowed by the overlay.** The `.fav-overlay` covers the entire viewport with `z-index: 300`; the drawer has `z-index: 301`. If a z-index regression slipped in, the overlay would intercept clicks. Check computed z-index in DevTools.

4. **Async race with `window.dispatchEvent('favoritos-changed')`.** When the user clicks the button, the code path is sync (no awaits), so this is unlikely.

### Reproduction
1. Open https://camisetas-fq.netlify.app/
2. Click 2-3 ♡ hearts on product cards
3. Open drawer via the ♡ in the nav
4. Observe items list + green button
5. Click "◉ PEDIR TODAS POR WHATSAPP"
6. **Expected:** new tab opens `https://wa.me/34674614325?text=...` with all 3 items.
7. **Actual:** nothing happens.

### Files to inspect
- `public/scripts/favoritos.js:88-100` (the `favCta?.addEventListener('click', ...)` block)
- `src/components/FavoritosDrawer.astro:30-32` (the button markup)
- Compare with the working `ctaBtn` handler in `public/scripts/sorteo-grid.js` — that one works, what's different?

### Fix strategy
1. Add a `console.log('favCta click')` at the top of the handler to confirm if the listener is even firing.
2. If not firing → suspect listener registration timing → move registration into `openDrawer()` or use event delegation on a stable parent like `#favDrawer`.
3. If firing but no window open → suspect `window.open` blocking (popup blocker, although unlikely for user-initiated click), or `drawer.dataset.template` being empty/undefined at click time.
4. Add a Vitest unit test for the message assembly logic (currently NOT tested — only sorteo template rendering is).

### Workaround (none)
The user can still order items individually by clicking the "Pedir →" on each product card. The bulk-favorites flow is non-functional.

---

## 📱 RESPONSIVE-1 (P2) · FAB WhatsApp overlaps "Pedir →" button on product cards (≤480px)

**Severity:** P2 — visual cruft, may obscure the price/CTA on small phones.

### Affected viewports
- Mobile <480px (iPhone SE, iPhone 12 mini, small Androids).

### Symptoms
- The floating WhatsApp button (`.fab-wa`) is fixed at bottom-right with `z-index` above content.
- On product cards displayed in a single column (≤480px), the FAB sits exactly over the "Pedir →" CTA of whichever card is currently in view.
- Tap target collision.

### Fix strategy
- In `global.css`, add at the `@media (max-width: 480px)` block:
  - Either bottom-right the FAB further out (`bottom: 20px; right: 12px`) AND add `padding-bottom: 80px` to the `.collection` section so the last card's CTA isn't hidden.
  - Or shrink the FAB (`width: 48px; height: 48px`) on small screens.
- Test both visually before picking.

---

## 📱 RESPONSIVE-2 (P2) · Steps numbers (01/02/03) too big on ≤480px

**Severity:** P2 — out-of-proportion typography on small screens.

### Symptoms
- `.step-num` uses `font-size: clamp(...)` or fixed large size — on narrow viewports the digit dominates the card visually.

### Fix strategy
- Override `.step-num` font-size inside `@media (max-width: 480px)`. Try `font-size: 56px` (vs current ~120px) and confirm visual balance with the title and text below.
- Reduce `.step` padding too if needed.

---

## 📱 RESPONSIVE-3 (P2) · Hero H1 "PIDE CUALQUIER..." breaks into 4 lines on ≤480px

**Severity:** P2 — looks broken / unintentional. The design intent is 3 lines.

### Symptoms
- The hero h1 uses `clamp(48px, 8vw, 128px)` — at 375px wide, the clamp lands around 48px which is still too large for "PIDE CUALQUIER" to fit on one line. Result: it wraps to "PIDE / CUALQUIER / camiseta / DEL MUNDO".

### Fix strategy
- Inside `@media (max-width: 480px)`, override the h1 font-size to something like `40px` or `clamp(36px, 10vw, 48px)`.
- Verify "PIDE CUALQUIER" fits on one line in 320px-wide viewport.
- Consider tightening `letter-spacing` to `0` on mobile (the desktop tracking adds width).

---

## 📱 RESPONSIVE-4 (P2) · Personalizer jersey takes nearly full screen on ≤480px

**Severity:** P2 — preview dominates, form below requires excessive scroll.

### Symptoms
- `.pers-jersey` (the visual preview) uses `aspect-ratio` and width 100% — on mobile it becomes huge.

### Fix strategy
- Cap `.pers-preview` `max-height: 320px` (or similar) inside `@media (max-width: 480px)`.
- Optionally reduce `.pers-name` and `.pers-num` font-sizes on mobile to keep the proportion right.

---

## Suggested approach for v1.1 session

1. **Fix BUG-1 first** — it's a real functional bug, P1.
2. **Then RESPONSIVE-3** (most visible on landing — hero is first impression).
3. **Then RESPONSIVE-1** (tap collision is a UX papercut).
4. **Then RESPONSIVE-2 and RESPONSIVE-4** (polish).
5. Verify on real devices if possible (or via Chrome DevTools device emulation at 320px, 375px, 414px widths).
6. Commit each fix separately for easy review/rollback.
7. After all fixes pass visual review, tag `v1.1.0`.

## Notes

- All issues detected via visual inspection in Chrome desktop + DevTools mobile emulation immediately after v1.0.0 tag. No real-device testing yet.
- None of these block the editor flow in `/admin` — content management is fully functional.
- The site is usable today; these are quality/polish issues to address in v1.1.
