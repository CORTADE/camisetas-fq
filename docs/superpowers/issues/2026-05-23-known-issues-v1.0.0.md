# Known issues — Camisetas FQ v1.0.0

**Detected:** 2026-05-23, immediately after v1.0.0 tag.
**Target fix:** v1.1.0 (next session).
**Status:** documented locally only — NOT opened as GitHub issues per user request.

---

## 🐛 BUG-3 (P0 · CRITICAL) · Schema rejects `precio_anterior: null` written by Sveltia → build fails

**Severity:** P0 — every edit to a camiseta from `/admin` that leaves `precio_anterior` empty breaks the production deploy. Already caused **5 consecutive failed Netlify deploys**.

### Symptoms
- Editor opens a camiseta in `/admin`, edits any field, leaves `precio_anterior` empty, hits Save.
- Sveltia writes `precio_anterior: null` to the `.md` frontmatter (instead of omitting the key).
- Sveltia commits + pushes to GitHub → Netlify triggers build.
- Build fails with:
  ```
  InvalidContentEntryDataError: Expected type 'number', received 'null'
  ```
- Site stays on the previous successful deploy. No data lost, but new edits don't go live.

### Current workaround
Editor manually puts `0` or a real number in `precio_anterior` to unblock the deploy. Fragile — easy to forget.

### Root cause
The current schema in `src/content/config.ts` declares:
```ts
precio_anterior: z.number().int().positive().optional(),
```
`.optional()` accepts `undefined` (missing key) but NOT `null` (explicit null value). Sveltia writes `null` when a numeric field is cleared, not omits.

### Fix
Two coordinated changes:

1. **`src/content/config.ts`** — accept null:
   ```ts
   precio_anterior: z.number().int().positive().nullable().optional(),
   ```
   This accepts `undefined`, `null`, or a positive int. (Verify: `z.number().int().positive().nullable()` doesn't validate `0`. We want to also allow `0` to mean "no discount". So consider:
   `precio_anterior: z.union([z.number().int().positive(), z.literal(0), z.null()]).optional()` — but cleanest is just `.nullable().optional()` and treat `null`/missing as "no discount" in the component.)

2. **`src/components/ProductCard.astro`** — guard the discount badge render:
   ```astro
   {d.precio_anterior && d.precio_anterior > 0 && <small>{d.precio_anterior}€</small>}
   ```
   (Currently the conditional is `{d.precio_anterior && ...}` which is already truthy-guarded — verify it doesn't crash on `null` at type-check time. Likely just needs a type assertion adjustment.)

3. **Add a unit test** (in a new `src/content/schema.test.ts` or extend `whatsapp.test.ts`):
   - Schema accepts `{ precio: 50, precio_anterior: null }` without error
   - Schema accepts `{ precio: 50 }` (no precio_anterior key) without error
   - Schema accepts `{ precio: 50, precio_anterior: 60 }` (with valid value)

### Reproduction
1. Open https://camisetas-fq.netlify.app/admin → sign in
2. Open any camiseta (e.g. Final Lisboa 2014)
3. Clear the "Precio anterior" field
4. Click Save
5. Wait ~90s
6. Check Netlify deploys page → latest deploy shows red "Failed" with the InvalidContentEntryDataError above

### Why this is P0
- Editor flow is the primary value proposition of this project (CMS for non-programmer).
- Every silent failure erodes trust in the system.
- The fix is small and surgical (~5 lines of code + 1 test).
- **Recommended to fix this BEFORE any other v1.1 work.**

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

## 🐛 BUG-4 (P1) · Sorteo schema enforces `ganador_numero` pattern even when sorteo is not finalized

**Severity:** P1 — blocks editing of active sorteos from `/admin`. Workaround exists but is awkward.

### Symptoms
- Editor opens the active sorteo (`mundial-2026-espana`, `estado: activo`) in `/admin`.
- Tries to save any change.
- The CMS validation rejects with: `"Dos dígitos"` on the "Ganador — Número (sólo si finalizado)" field, even though:
  - The field is empty (no ganador yet)
  - The sorteo's `estado` is `activo`, not `finalizado` — so a ganador shouldn't be required at all

### Current workaround
Editor types `01` (or any 2-digit string) into the ganador number to pass validation, then has to remember to clear it when the sorteo actually finalizes. Fragile.

### Root cause
In `public/admin/config.yml`:
```yaml
- { name: ganador_numero, label: "Ganador — Número (sólo si finalizado)", widget: string, required: false, pattern: ['^\d{2}$', 'Dos dígitos'] }
```
Sveltia applies the `pattern` validation to ANY non-empty string. `required: false` only means the field can be empty/missing — but it doesn't disable the pattern check. The issue: Sveltia evidently treats the editor leaving the field empty as still triggering the pattern check (or has some normalization that converts empty input to a string that fails the regex).

The Zod schema in `src/content/config.ts` is actually fine:
```ts
ganador_numero: z.string().regex(/^\d{2}$/).optional(),
```
`.optional()` correctly skips validation when undefined. The build-time validation does NOT fail; the runtime-in-CMS validation does.

### Fix (two options)

**Option A — relax the pattern to accept empty:**
In `public/admin/config.yml`:
```yaml
- { name: ganador_numero, label: "Ganador — Número (sólo si finalizado)", widget: string, required: false, pattern: ['^(\d{2})?$', 'Dos dígitos o vacío'] }
```
The `(\d{2})?` makes the 2-digit group optional. Simple, low-risk.

Apply the same fix to `ganador_nombre` if it has a similar constraint (currently none, but worth checking).

**Option B — conditional field visibility (more involved):**
Use Sveltia's `condition` widget option (if supported in this version) to only show ganador fields when `estado === 'finalizado'`. This would also visually hide the irrelevant fields, improving editor UX. Requires verifying Sveltia syntax for conditional fields.

**Recommended:** start with Option A (1-line change, ships the fix), then consider Option B as polish in v1.2.

### Also update the Zod schema's `superRefine`
The existing `superRefine` only triggers if `estado === 'finalizado'` AND `ganador_nombre`/`ganador_numero` are MISSING. It doesn't reject a stray ganador value on a non-finalized sorteo (which is the workaround state). Consider tightening:
```ts
if (data.estado !== 'finalizado' && (data.ganador_nombre || data.ganador_numero)) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: 'Solo se debe rellenar ganador cuando el sorteo está finalizado',
    path: ['ganador_nombre'],
  });
}
```
This would catch leftover "01" values from the workaround flow once Option A is in place.

### Reproduction
1. `/admin` → 🎰 Sorteos → mundial-2026-espana
2. Verify `estado` is `Activo`, ganador fields are empty
3. Change any field (e.g. add a vendido)
4. Click Save
5. **Expected:** save succeeds, commit pushed
6. **Actual:** red validation error on "Ganador — Número" field, save blocked

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

Priority order (P0 → P1 → P2):

1. **BUG-3 first (P0)** — unblocks editor flow. Until this is fixed, every `precio_anterior` clear from `/admin` breaks the build. Small surgical fix, ~5 lines + 1 unit test.
2. **BUG-4 (P1)** — unblocks editing of active sorteos without the "01 workaround". Tiny `config.yml` regex tweak.
3. **BUG-1 (P1)** — functional bug in favorites drawer button. Bulk-favorites WhatsApp message is currently broken.
4. **RESPONSIVE-3 (P2)** — hero on mobile, first impression.
5. **RESPONSIVE-1 (P2)** — FAB collision with product CTA.
6. **RESPONSIVE-2 and RESPONSIVE-4 (P2)** — polish.

After all fixes:
- Verify the bug fixes with their reproductions (BUG-3 by actually clearing a precio_anterior from `/admin` and watching the deploy succeed; BUG-4 by saving an active sorteo without ganador; BUG-1 by clicking the favorites drawer button).
- Verify responsive fixes on real devices if possible (or Chrome DevTools at 320 / 375 / 414 px widths).
- Commit each fix separately for easy review/rollback.
- After all fixes pass visual review, tag `v1.1.0`.

## Notes

- All issues detected via visual inspection in Chrome desktop + DevTools mobile emulation immediately after v1.0.0 tag. No real-device testing yet.
- None of these block the editor flow in `/admin` — content management is fully functional.
- The site is usable today; these are quality/polish issues to address in v1.1.
