# Camisetas FQ — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a content-managed static football-jerseys website with WhatsApp-only checkout, deployed on Netlify, editable through Sveltia CMS via GitHub OAuth.

**Architecture:** Astro 5 static site (HTML pre-rendered at build time) reading from Markdown Content Collections validated by Zod schemas. CMS panel at `/admin/` (Sveltia) writes Markdown commits to the same GitHub repo, triggering Netlify rebuilds. Cart/checkout replaced by deep-links to `wa.me` with templated messages. Favorites live in `localStorage` (no auth).

**Tech Stack:** Astro 5, TypeScript (schemas only), Vitest (unit tests for `lib/`), Sveltia CMS, Netlify, GitHub OAuth via `sveltia-cms-auth.netlify.app` proxy. Zero CSS framework — all styling ported verbatim from existing `index.html`.

**Reference documents:**
- Spec: `docs/superpowers/specs/2026-05-23-camisetas-fq-design.md`
- Visual source of truth: `./index.html` (1380 lines, CSS lines 11–754, JS lines 1196–1380)
- Images: `./imagenes/` (12 files)

**Checkpoints** (the user requires human review before continuing past these):
- 🛑 **Checkpoint 1** — After Task 30 (web visual local funcionando)
- 🛑 **Checkpoint 2** — After Task 33 (CMS local funcionando)
- 🛑 **Checkpoint 3** — After Task 37 (web online en Netlify)

---

## PART 0 — Pre-flight (one question for the user)

### Task 0: GitHub username confirmed

**GitHub username: `CORTADE`** (provided by user — note the uppercase). Used wherever the plan references the repo, including `public/admin/config.yml`, the remote URL, and verification links.

- [x] **Step 1: Username captured: `CORTADE`**

---

## PART 1 — Project skeleton

### Task 1: Initialize Astro project + git

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`
- Initialize: `.git/`

- [ ] **Step 1: Sanity check current directory**

Run: `ls /home/roberto/proyectos/camisetas-fq/`
Expected output includes: `index.html`, `imagenes/`, `docs/`. Nothing else (no `package.json`, no `.git`).

- [ ] **Step 2: Create package.json directly (skip interactive `npm create astro@latest`)**

The Astro creator is interactive and will collide with our existing files. Write `package.json` directly:

```json
{
  "name": "camisetas-fq",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "astro": "astro",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "astro": "^5.0.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 3: Install dependencies**

Run: `cd /home/roberto/proyectos/camisetas-fq && npm install`
Expected: `node_modules/` appears, ~200 packages, 0 vulnerabilities.

- [ ] **Step 4: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://camisetas-fq.netlify.app',
  trailingSlash: 'never',
  build: { format: 'file' },
});
```

- [ ] **Step 5: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules/
dist/
.astro/
.env
.env.local
.DS_Store
.vscode/
.idea/
*.log
```

- [ ] **Step 7: Initialize git, set up main branch**

```bash
git init -b main
git config user.email "robertocortade@gmail.com"
git config user.name "Roberto Cortade"
```

- [ ] **Step 8: First commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json .gitignore
git commit -m "chore: scaffold Astro project"
```

### Task 2: Move images to `public/`

**Files:**
- Move: `./imagenes/` → `./public/imagenes/`

- [ ] **Step 1: Create public/**

```bash
mkdir -p public
```

- [ ] **Step 2: Move imagenes/ into public/**

```bash
git mv imagenes public/imagenes 2>/dev/null || mv imagenes public/imagenes
```

(`git mv` works only after files are tracked; since the repo is fresh and `imagenes/` was never committed, fall back to plain `mv`.)

- [ ] **Step 3: Create `public/uploads/` placeholder**

CMS-uploaded images go here. Create empty directory with a `.gitkeep` so git tracks it.

```bash
mkdir -p public/uploads
touch public/uploads/.gitkeep
```

- [ ] **Step 4: Verify image count**

Run: `ls public/imagenes/ | wc -l`
Expected: `12`

- [ ] **Step 5: Commit**

```bash
git add public/
git commit -m "feat: move source images into public/imagenes"
```

### Task 3: Extract CSS to `src/styles/global.css`

The CSS in `index.html` is between `<style>` (line 10) and `</style>` (line 754). Extract verbatim.

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Extract lines 11–753 from index.html**

```bash
mkdir -p src/styles
sed -n '11,753p' index.html > src/styles/global.css
```

- [ ] **Step 2: Verify size**

Run: `wc -l src/styles/global.css`
Expected: `743` lines (or very close — confirms full extract).

- [ ] **Step 3: Quick smoke test of the CSS**

Run: `head -30 src/styles/global.css`
Expected: starts with `/* ===================== RESET & ROOT ===================== */` and `*,*::before,*::after{...}`.

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: extract CSS from index.html into global.css"
```

### Task 4: BaseLayout

**Files:**
- Create: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Create the layout**

```astro
---
import '../styles/global.css';
export interface Props { title?: string; description?: string; }
const {
  title = 'Camisetas FQ · Futbol Quality',
  description = 'Camisetas de fútbol de calidad premium. Finales de Champions, Mundiales y joyas retro.'
} = Astro.props;
---
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content={description} />
  <title>{title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
</head>
<body>
  <slot />
  <script>
    window.addEventListener('load', () => {
      const loader = document.getElementById('loader');
      if (loader) setTimeout(() => loader.classList.add('gone'), 1400);
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: BaseLayout with fonts and loader handoff"
```

---

## PART 2 — Content schemas & pre-populated content

### Task 5: Content Collection schemas

**Files:**
- Create: `src/content/config.ts`

- [ ] **Step 1: Write the schema file**

```typescript
import { defineCollection, z } from 'astro:content';

const camisetas = defineCollection({
  type: 'content',
  schema: z.object({
    titulo: z.string(),
    equipo: z.string(),
    eyebrow: z.string(),
    foto: z.string(),
    precio: z.number().int().positive(),
    precio_anterior: z.number().int().positive().optional(),
    badge: z.object({
      texto: z.string(),
      color: z.enum(['gold', 'red-vintage', 'orange-last']).default('gold'),
    }).optional(),
    stock: z.boolean().default(true),
    tallas: z.array(z.enum(['S', 'M', 'L', 'XL', 'XXL'])).default(['S', 'M', 'L', 'XL', 'XXL']),
    destacada: z.boolean().default(false),
    orden: z.number().int().default(100),
  }),
});

const sorteos = defineCollection({
  type: 'content',
  schema: z.object({
    titulo: z.string(),
    eyebrow: z.string(),
    descripcion: z.string(),
    imagen_fondo: z.string(),
    precio_numero: z.number().positive(),
    premio_descripcion: z.string(),
    estado: z.enum(['borrador', 'activo', 'finalizado']),
    tipo_finalizacion: z.enum(['por_fecha', 'por_completarse', 'por_fecha_o_completarse']),
    fecha_limite: z.coerce.date().optional(),
    mensaje_whatsapp_custom: z.string().optional().default(''),
    vendidos: z.array(z.object({
      numero: z.string().regex(/^\d{2}$/),
      comprador: z.string(),
    })).default([]),
    reservados: z.array(z.string().regex(/^\d{2}$/)).default([]),
    mostrar_timeline_vendidos: z.boolean().default(true),
    ganador_nombre: z.string().optional(),
    ganador_numero: z.string().regex(/^\d{2}$/).optional(),
    ganador_foto: z.string().optional(),
  }).superRefine((data, ctx) => {
    if ((data.tipo_finalizacion === 'por_fecha' || data.tipo_finalizacion === 'por_fecha_o_completarse') && !data.fecha_limite) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'fecha_limite obligatorio para este tipo', path: ['fecha_limite'] });
    }
    if (data.estado === 'finalizado' && (!data.ganador_nombre || !data.ganador_numero)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Sorteo finalizado requiere ganador_nombre y ganador_numero', path: ['ganador_nombre'] });
    }
  }),
});

const settings = defineCollection({
  type: 'content',
  schema: z.discriminatedUnion('tipo', [
    z.object({
      tipo: z.literal('inicio'),
      hero_eyebrow: z.string(),
      hero_titulo_linea1: z.string(),
      hero_titulo_linea2: z.string(),
      hero_titulo_linea3: z.string(),
      hero_titulo_linea3_palabra_dorada: z.string(),
      hero_parrafo: z.string(),
      hero_jersey_foto: z.string(),
      hero_stat_1_numero: z.string(),
      hero_stat_1_etiqueta: z.string(),
      hero_stat_2_numero: z.string(),
      hero_stat_2_etiqueta: z.string(),
      marquee: z.array(z.string()).min(3),
      trust_bar: z.array(z.object({
        icono: z.string(), titulo: z.string(), subtitulo: z.string(),
      })).length(4),
      cinematic_titulo_linea1: z.string(),
      cinematic_titulo_linea2: z.string(),
      cinematic_subtitulo: z.string(),
      cinematic_imagen: z.string(),
      cinematic_cta_texto: z.string().default('Pedir mi camiseta'),
      steps: z.array(z.object({
        numero: z.string(), titulo: z.string(), texto: z.string(),
      })).length(3),
      personalizer_titulo: z.string(),
      personalizer_nombre_default: z.string().default('CAMPEÓN'),
      personalizer_dorsal_default: z.string().default('10'),
      personalizer_precio_extra: z.number().int().default(12),
      sorteo_seccion_visible: z.boolean().default(true),
    }),
    z.object({
      tipo: z.literal('contacto'),
      whatsapp: z.string().regex(/^\d{8,15}$/),
      instagram: z.string(),
      email: z.union([z.string().email(), z.literal('')]).default(''),
      tiktok: z.string().optional().default(''),
      footer_descripcion: z.string(),
      footer_anio: z.number().int(),
      template_camiseta: z.string(),
      template_personalizacion: z.string(),
      template_sorteo: z.string(),
      template_favoritos: z.string(),
      template_generico: z.string(),
    }),
  ]),
});

export const collections = { camisetas, sorteos, settings };
```

- [ ] **Step 2: Type-check (will fail until content exists, that's OK; we just want to validate syntax)**

Run: `npx astro check 2>&1 | head -20`
Expected: warnings about empty collections, NOT TypeScript errors in `config.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/content/config.ts
git commit -m "feat: define Zod schemas for camisetas, sorteos, settings"
```

### Task 6: Pre-populate the 10 camiseta files

**Files:**
- Create: `src/content/camisetas/{lisboa-2014,moscu-2008,francia-98-zidane,barcelona-kappa,psg-jordan,brasil-2021-la-10,arsenal-highbury,portugal-2016,spain-2010,cordoba-cf}.md`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p src/content/camisetas
```

- [ ] **Step 2: Write all 10 files**

Each file is `---\n<yaml frontmatter>\n---\n` (empty body). Use the exact frontmatter from spec section 5. Below are the contents — write each as a separate Write call.

`src/content/camisetas/lisboa-2014.md`:
```markdown
---
titulo: "Final Lisboa 2014"
equipo: "Real Madrid · Edición conmemorativa"
eyebrow: "UEFA CHAMPIONS LEAGUE"
foto: /imagenes/jersey-real-madrid-lisbon.jpg
precio: 69
precio_anterior: 89
badge:
  texto: DÉCIMA
  color: gold
stock: true
tallas: [S, M, L, XL, XXL]
destacada: true
orden: 10
---
```

`src/content/camisetas/moscu-2008.md`:
```markdown
---
titulo: "Final Moscú 2008"
equipo: "Manchester United · AIG"
eyebrow: "UEFA CHAMPIONS LEAGUE"
foto: /imagenes/jersey-man-united-aig.jpg
precio: 75
badge:
  texto: VINTAGE
  color: red-vintage
destacada: true
orden: 20
---
```

`src/content/camisetas/francia-98-zidane.md`:
```markdown
---
titulo: "Francia 98 · Zidane"
equipo: "Selección Francesa · Adidas"
eyebrow: "FIFA WORLD CUP"
foto: /imagenes/jersey-france-98.jpg
precio: 85
badge:
  texto: ÚLTIMA
  color: orange-last
destacada: true
orden: 30
---
```

`src/content/camisetas/barcelona-kappa.md`:
```markdown
---
titulo: "FC Barcelona Kappa"
equipo: "Edición coleccionista"
eyebrow: "LA LIGA · 1996/97"
foto: /imagenes/jersey-barcelona-kappa.jpg
precio: 79
badge:
  texto: VINTAGE
  color: red-vintage
destacada: true
orden: 40
---
```

`src/content/camisetas/psg-jordan.md`:
```markdown
---
titulo: "PSG · Jordan Edition"
equipo: "Paris Saint-Germain · Negro"
eyebrow: "UEFA CHAMPIONS LEAGUE"
foto: /imagenes/jersey-psg-jordan.jpg
precio: 69
badge:
  texto: NUEVA
  color: gold
destacada: true
orden: 50
---
```

`src/content/camisetas/brasil-2021-la-10.md`:
```markdown
---
titulo: "Brasil 2021 · La 10"
equipo: "Copa América Maracanã"
eyebrow: "SELECCIÓN BRASILEÑA"
foto: /imagenes/jersey-brazil-10.jpg
precio: 72
badge:
  texto: COPA AMÉRICA
  color: gold
destacada: true
orden: 60
---
```

`src/content/camisetas/arsenal-highbury.md`:
```markdown
---
titulo: "Arsenal Highbury · Henry"
equipo: "Arsenal FC · O2"
eyebrow: "PREMIER LEAGUE · 2005/06"
foto: /imagenes/jersey-arsenal-o2.jpg
precio: 75
badge:
  texto: VINTAGE
  color: red-vintage
destacada: false
orden: 70
---
```

`src/content/camisetas/portugal-2016.md`:
```markdown
---
titulo: "Portugal · Cristiano 7"
equipo: "Selección Portuguesa · Eurocopa"
eyebrow: "UEFA EURO 2016 · CAMPEONES"
foto: /imagenes/jersey-portugal-17.jpg
precio: 70
destacada: false
orden: 80
---
```

`src/content/camisetas/spain-2010.md`:
```markdown
---
titulo: "España 2010 · La Roja"
equipo: "Selección Española · Iniesta"
eyebrow: "FIFA WORLD CUP · CAMPEONES"
foto: /imagenes/jersey-spain-2010.jpg
precio: 79
badge:
  texto: CAMPEONES
  color: gold
destacada: false
orden: 90
---
```

`src/content/camisetas/cordoba-cf.md`:
```markdown
---
titulo: "Córdoba CF Retro"
equipo: "Edición coleccionista"
eyebrow: "SEGUNDA DIVISIÓN · 90s"
foto: /imagenes/jersey-cordoba.jpg
precio: 65
badge:
  texto: VINTAGE
  color: red-vintage
destacada: false
orden: 100
---
```

- [ ] **Step 3: Type-check passes for camisetas**

Run: `npx astro check 2>&1 | grep -i "camisetas\|error"`
Expected: no errors for `camisetas` collection.

- [ ] **Step 4: Commit**

```bash
git add src/content/camisetas/
git commit -m "content: pre-populate 10 camiseta entries"
```

### Task 7: Pre-populate sorteo demo

**Files:**
- Create: `src/content/sorteos/mundial-2026-espana.md`

- [ ] **Step 1: Create directory**

```bash
mkdir -p src/content/sorteos
```

- [ ] **Step 2: Write the file**

`src/content/sorteos/mundial-2026-espana.md`:
```markdown
---
titulo: "Elige tu número. Gana las dos camisetas de España."
eyebrow: "SORTEO ACTIVO · MUNDIAL 2026"
descripcion: "Local + Visitante FIFA World Cup 2026. Solo 1€ por número. El ganador se lleva el pack a casa."
imagen_fondo: /imagenes/sorteo-spain.jpg
precio_numero: 1
premio_descripcion: "Pack camiseta local + visitante España FIFA World Cup 2026"
estado: activo
tipo_finalizacion: por_fecha_o_completarse
fecha_limite: 2026-07-15T23:59:00
mensaje_whatsapp_custom: ""
vendidos:
  - { numero: "00", comprador: "Juan R." }
  - { numero: "03", comprador: "María L." }
  - { numero: "07", comprador: "Pedro S." }
  - { numero: "11", comprador: "Ana G." }
  - { numero: "13", comprador: "Sergio M." }
  - { numero: "15", comprador: "Lucía F." }
  - { numero: "19", comprador: "Diego F." }
  - { numero: "21", comprador: "Carmen P." }
  - { numero: "23", comprador: "Carlos M." }
  - { numero: "24", comprador: "Ana B." }
  - { numero: "27", comprador: "Pablo R." }
  - { numero: "30", comprador: "Inés L." }
  - { numero: "32", comprador: "Roberto C." }
  - { numero: "35", comprador: "Marta J." }
  - { numero: "38", comprador: "Iván T." }
  - { numero: "42", comprador: "Sofía D." }
  - { numero: "45", comprador: "Marcos H." }
  - { numero: "48", comprador: "Andrea V." }
  - { numero: "51", comprador: "Hugo M." }
  - { numero: "54", comprador: "Elena R." }
  - { numero: "56", comprador: "Javi P." }
  - { numero: "58", comprador: "Noelia G." }
  - { numero: "60", comprador: "Adrián S." }
  - { numero: "62", comprador: "Lola B." }
  - { numero: "64", comprador: "Sara N." }
  - { numero: "67", comprador: "Raúl T." }
  - { numero: "71", comprador: "Laura P." }
  - { numero: "74", comprador: "Cristina M." }
  - { numero: "77", comprador: "David L." }
  - { numero: "81", comprador: "Beatriz A." }
  - { numero: "85", comprador: "Manuel F." }
  - { numero: "88", comprador: "Patricia C." }
  - { numero: "92", comprador: "Antonio R." }
reservados: ["05", "17", "40", "69", "83"]
mostrar_timeline_vendidos: true
---
```

- [ ] **Step 3: Type-check**

Run: `npx astro check 2>&1 | grep -i "sorteo\|error"`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/sorteos/
git commit -m "content: pre-populate España 2026 sorteo demo"
```

### Task 8: Pre-populate settings (inicio + contacto)

**Files:**
- Create: `src/content/settings/inicio.md`
- Create: `src/content/settings/contacto.md`

- [ ] **Step 1: Create directory**

```bash
mkdir -p src/content/settings
```

- [ ] **Step 2: Write `inicio.md`**

```markdown
---
tipo: inicio
hero_eyebrow: "FUTBOL QUALITY · DESDE 2019"
hero_titulo_linea1: "PIDE CUALQUIER"
hero_titulo_linea2: "camiseta"
hero_titulo_linea3: "DEL MUNDO"
hero_titulo_linea3_palabra_dorada: "MUNDO"
hero_parrafo: "Finales de Champions, Mundiales y joyas retro. Cada camiseta es una pieza de coleccionista con calidad premium y detalle máximo. Si no la encuentras tú, la conseguimos nosotros."
hero_jersey_foto: /imagenes/jersey-real-madrid-lisbon.jpg
hero_stat_1_numero: "+500"
hero_stat_1_etiqueta: "Clientes"
hero_stat_2_numero: "+1.2K"
hero_stat_2_etiqueta: "Camisetas"
marquee:
  - "ENVÍOS A TODA ESPAÑA Y EUROPA"
  - "PIDE CUALQUIER CAMISETA DEL MUNDO"
  - "CALIDAD PREMIUM · DETALLE MÁXIMO"
  - "+500 CLIENTES SATISFECHOS"
  - "FINALES DE CHAMPIONS · MUNDIALES · JOYAS RETRO"
trust_bar:
  - { icono: "★", titulo: "CALIDAD PREMIUM", subtitulo: "Detalle máximo en cada pieza" }
  - { icono: "✈", titulo: "ENVÍO 24/48H", subtitulo: "A toda España y Europa" }
  - { icono: "⌖", titulo: "CUALQUIER CAMISETA", subtitulo: "La conseguimos para ti" }
  - { icono: "⌬", titulo: "COMPRA POR WHATSAPP", subtitulo: "Atención personal directa" }
cinematic_titulo_linea1: "Si no la tenemos,"
cinematic_titulo_linea2: "te la conseguimos."
cinematic_subtitulo: "Dinos qué camiseta sueñas tener, sin importar la temporada o el club. La rastreamos, la verificamos y te llega a casa."
cinematic_imagen: /imagenes/poster-cortade.jpg
cinematic_cta_texto: "Pedir mi camiseta"
steps:
  - { numero: "01", titulo: "ELIGE", texto: "Explora la colección y guarda tus camisetas favoritas. Indica la talla y, si quieres, dorsal y nombre." }
  - { numero: "02", titulo: "PIDE", texto: "Pulsa 'Pedir por WhatsApp' y enviaremos tu pedido automáticamente. Confirmamos stock al momento." }
  - { numero: "03", titulo: "RECIBE", texto: "Pagas por Bizum o transferencia y en 24-48h tienes tu camiseta en casa. Envío a toda España y Europa." }
personalizer_titulo: "Diseña tu camiseta"
personalizer_nombre_default: "CAMPEÓN"
personalizer_dorsal_default: "10"
personalizer_precio_extra: 12
sorteo_seccion_visible: true
---
```

- [ ] **Step 3: Write `contacto.md`**

```markdown
---
tipo: contacto
whatsapp: "34600000000"
instagram: "camisetas_fq19"
email: ""
tiktok: ""
footer_descripcion: "Camisetas de fútbol de calidad premium. Finales de Champions, Mundiales y joyas retro entregadas a tu casa con detalle máximo."
footer_anio: 2026
template_camiseta: |
  ¡Hola! Me interesa la camiseta "{nombre}" ({equipo}) - {precio}€.
  Talla: {talla}.
  ¿Sigue disponible?
template_personalizacion: |
  ¡Hola! Quiero personalizar una camiseta con nombre "{nombre}" y dorsal {dorsal} (talla {talla}).
  ¿Qué camiseta me recomendáis?
template_sorteo: |
  ¡Hola! Quiero reservar {cantidad_texto} del sorteo "{titulo_sorteo}":
  {numeros}
  Total: {total}€
  ¿Siguen disponibles?
template_favoritos: |
  ¡Hola! Me interesan estas camisetas de mi lista de favoritos:
  {lista}
  ¿Cuáles tenéis disponibles?
template_generico: "¡Hola! Tengo una consulta sobre Camisetas FQ."
---
```

- [ ] **Step 4: Type-check passes for everything**

Run: `npx astro check`
Expected: `0 errors, 0 warnings`.

- [ ] **Step 5: Commit**

```bash
git add src/content/settings/
git commit -m "content: pre-populate inicio and contacto settings"
```

---

## PART 3 — Lib utilities (TDD)

### Task 9: `lib/whatsapp.ts` — template rendering (incluye `renderSorteoTemplate` para selección múltiple del sorteo)

**Files:**
- Create: `src/lib/whatsapp.ts`
- Create: `src/lib/whatsapp.test.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: Create vitest config**

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
```

- [ ] **Step 2: Write failing test**

`src/lib/whatsapp.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { renderTemplate, buildWaUrl } from './whatsapp';

describe('renderTemplate', () => {
  it('replaces a single variable', () => {
    expect(renderTemplate('Hola {nombre}', { nombre: 'Juan' })).toBe('Hola Juan');
  });
  it('replaces multiple variables', () => {
    expect(renderTemplate('{a} y {b}', { a: 'X', b: 'Y' })).toBe('X y Y');
  });
  it('leaves unknown variables intact', () => {
    expect(renderTemplate('Hola {nombre}', {})).toBe('Hola {nombre}');
  });
  it('handles repeated variables', () => {
    expect(renderTemplate('{x} {x}', { x: 'a' })).toBe('a a');
  });
  it('handles empty template', () => {
    expect(renderTemplate('', { x: 'a' })).toBe('');
  });
});

describe('buildWaUrl', () => {
  it('encodes the message', () => {
    expect(buildWaUrl('34600000000', 'hola mundo')).toBe('https://wa.me/34600000000?text=hola%20mundo');
  });
  it('handles message with special characters', () => {
    const url = buildWaUrl('34600000000', '¿qué tal?');
    expect(url).toContain('%C2%BFqu%C3%A9%20tal%3F');
  });
  it('produces no query string if message empty', () => {
    expect(buildWaUrl('34600000000', '')).toBe('https://wa.me/34600000000');
  });
});
```

- [ ] **Step 3: Run test, confirm it fails**

Run: `npm test`
Expected: fails with "Cannot find module './whatsapp'".

- [ ] **Step 4: Create the implementation**

`src/lib/whatsapp.ts`:
```typescript
export function renderTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return key in vars ? String(vars[key]) : match;
  });
}

export function buildWaUrl(phone: string, message: string): string {
  if (!message) return `https://wa.me/${phone}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
```

- [ ] **Step 5: Run test, confirm pass**

Run: `npm test`
Expected: `Test Files 1 passed | Tests 8 passed`.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/lib/whatsapp.ts src/lib/whatsapp.test.ts
git commit -m "feat(lib): whatsapp template rendering with tests"
```

### Task 10: `lib/sorteos.ts` — active/finished sorteo selection

**Files:**
- Create: `src/lib/sorteos.ts`
- Create: `src/lib/sorteos.test.ts`

- [ ] **Step 1: Write failing test**

`src/lib/sorteos.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { getSorteoActivo, getSorteosFinalizados, validateUnicoActivo } from './sorteos';

const make = (slug: string, data: any) => ({ slug, data, body: '' } as any);

describe('getSorteoActivo', () => {
  it('returns null when none are active', () => {
    const list = [
      make('a', { estado: 'borrador', tipo_finalizacion: 'por_completarse' }),
      make('b', { estado: 'finalizado', tipo_finalizacion: 'por_completarse', ganador_nombre: 'x', ganador_numero: '01' }),
    ];
    expect(getSorteoActivo(list)).toBeNull();
  });
  it('returns the only active sorteo', () => {
    const list = [
      make('a', { estado: 'activo', tipo_finalizacion: 'por_completarse' }),
    ];
    expect(getSorteoActivo(list)?.slug).toBe('a');
  });
  it('with multiple active, returns the one with earliest fecha_limite', () => {
    const list = [
      make('a', { estado: 'activo', tipo_finalizacion: 'por_fecha', fecha_limite: new Date('2026-12-01') }),
      make('b', { estado: 'activo', tipo_finalizacion: 'por_fecha', fecha_limite: new Date('2026-06-01') }),
      make('c', { estado: 'activo', tipo_finalizacion: 'por_fecha', fecha_limite: new Date('2026-09-01') }),
    ];
    expect(getSorteoActivo(list)?.slug).toBe('b');
  });
  it('with active sorteos lacking dates, falls back to alphabetical slug', () => {
    const list = [
      make('z', { estado: 'activo', tipo_finalizacion: 'por_completarse' }),
      make('a', { estado: 'activo', tipo_finalizacion: 'por_completarse' }),
    ];
    expect(getSorteoActivo(list)?.slug).toBe('a');
  });
});

describe('getSorteosFinalizados', () => {
  it('returns only finalized, sorted by most recent first', () => {
    const list = [
      make('a', { estado: 'finalizado', tipo_finalizacion: 'por_completarse', fecha_limite: new Date('2025-01-01'), ganador_nombre: 'x', ganador_numero: '01' }),
      make('b', { estado: 'activo', tipo_finalizacion: 'por_completarse' }),
      make('c', { estado: 'finalizado', tipo_finalizacion: 'por_completarse', fecha_limite: new Date('2025-06-01'), ganador_nombre: 'y', ganador_numero: '02' }),
    ];
    const out = getSorteosFinalizados(list);
    expect(out.map(s => s.slug)).toEqual(['c', 'a']);
  });
});

describe('validateUnicoActivo', () => {
  it('returns ok when 0 or 1 active', () => {
    expect(validateUnicoActivo([make('a', { estado: 'borrador' })])).toEqual({ ok: true });
  });
  it('returns warning when multiple active', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const list = [
      make('x', { estado: 'activo' }),
      make('y', { estado: 'activo' }),
    ];
    const result = validateUnicoActivo(list);
    expect(result.ok).toBe(false);
    expect(result.activos).toEqual(['x', 'y']);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
```

- [ ] **Step 2: Run test, confirm fails**

Run: `npm test`
Expected: fails with "Cannot find module './sorteos'".

- [ ] **Step 3: Implement**

`src/lib/sorteos.ts`:
```typescript
import type { CollectionEntry } from 'astro:content';

type Sorteo = CollectionEntry<'sorteos'>;

export function getSorteoActivo(list: Sorteo[]): Sorteo | null {
  const activos = list.filter(s => s.data.estado === 'activo');
  if (activos.length === 0) return null;
  if (activos.length > 1) validateUnicoActivo(list);
  return activos.sort((a, b) => {
    const da = a.data.fecha_limite?.getTime();
    const db = b.data.fecha_limite?.getTime();
    if (da && db) return da - db;
    if (da && !db) return -1;
    if (!da && db) return 1;
    return a.slug.localeCompare(b.slug);
  })[0];
}

export function getSorteosFinalizados(list: Sorteo[]): Sorteo[] {
  return list
    .filter(s => s.data.estado === 'finalizado')
    .sort((a, b) => {
      const da = a.data.fecha_limite?.getTime() ?? 0;
      const db = b.data.fecha_limite?.getTime() ?? 0;
      return db - da;
    });
}

export type ValidationResult = { ok: true } | { ok: false; activos: string[] };

export function validateUnicoActivo(list: Sorteo[]): ValidationResult {
  const activos = list.filter(s => s.data.estado === 'activo').map(s => s.slug);
  if (activos.length <= 1) return { ok: true };
  console.warn(`⚠️ Múltiples sorteos activos: ${activos.join(', ')}. Se mostrará solo el primero.`);
  return { ok: false, activos };
}
```

- [ ] **Step 4: Run test, confirm pass**

Run: `npm test`
Expected: all tests in `sorteos.test.ts` pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sorteos.ts src/lib/sorteos.test.ts
git commit -m "feat(lib): sorteo selection helpers with tests"
```

---

## PART 4 — Visual components (top of page)

> **General pattern for component tasks:** open `index.html` and copy the relevant section's markup, then replace hard-coded strings with `{props.value}` interpolation. The CSS classes already exist in `global.css` — do NOT rename them.

### Task 11: Loader, TopMarquee, FloatingWhatsApp

These three are tiny. Bundle in one task.

**Files:**
- Create: `src/components/Loader.astro`
- Create: `src/components/TopMarquee.astro`
- Create: `src/components/FloatingWhatsApp.astro`

- [ ] **Step 1: Create directory**

```bash
mkdir -p src/components
```

- [ ] **Step 2: `Loader.astro`** (source: `index.html` lines 756–759)

```astro
<div class="loader" id="loader">
  <div class="loader-shield"></div>
  <div class="loader-text">FUTBOL QUALITY</div>
</div>
```

- [ ] **Step 3: `TopMarquee.astro`**

```astro
---
export interface Props { mensajes: string[] }
const { mensajes } = Astro.props;
const doubled = [...mensajes, ...mensajes];
---
<div class="top-bar">
  <div class="marquee">
    {doubled.map(m => <span>{m}</span>)}
  </div>
</div>
```

- [ ] **Step 4: `FloatingWhatsApp.astro`**

The SVG in `index.html` is at lines 1145–1147 (FAB) — copy verbatim. The href is dynamic.

```astro
---
import { buildWaUrl } from '../lib/whatsapp';
export interface Props { whatsapp: string; templateGenerico: string }
const { whatsapp, templateGenerico } = Astro.props;
const href = buildWaUrl(whatsapp, templateGenerico);
---
<a href={href} class="fab-wa" aria-label="Hablar por WhatsApp" title="Hablar por WhatsApp" target="_blank" rel="noopener">
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/></svg>
</a>
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Loader.astro src/components/TopMarquee.astro src/components/FloatingWhatsApp.astro
git commit -m "feat(components): Loader, TopMarquee, FloatingWhatsApp"
```

### Task 12: Nav (responsive with hamburguesa)

**Files:**
- Create: `src/components/Nav.astro`
- Modify: `src/styles/global.css` (add mobile styles + favorites badge)

The HTML reference (`index.html` lines 778–796) has search/heart/cart icons. We replace with: only ♡ (desktop), plus ☰ on mobile.

- [ ] **Step 1: Write the component**

```astro
---
// No props — favorites count is rendered client-side
---
<nav class="nav" id="nav">
  <div class="nav-inner">
    <a href="#" class="logo">
      <div class="logo-shield"></div>
      <div class="logo-text">CAMISETAS <b>FQ</b></div>
    </a>
    <ul class="nav-menu" id="navMenu">
      <li><a href="#coleccion">Colección</a></li>
      <li><a href="#personaliza">Personaliza</a></li>
      <li><a href="#sorteo">Sorteo</a></li>
      <li><a href="#contacto">Contacto</a></li>
    </ul>
    <div class="nav-actions">
      <button class="nav-icon nav-fav" aria-label="Mis favoritos" id="favBtn">
        ♡
        <span class="nav-fav-badge" id="favBadge" hidden>0</span>
      </button>
      <button class="nav-icon nav-burger" aria-label="Abrir menú" id="navBurger">☰</button>
    </div>
  </div>
</nav>
```

- [ ] **Step 2: Append mobile + badge styles to `global.css`**

Append to the end of `src/styles/global.css`:

```css
/* ===================== NAV — favorites badge ===================== */
.nav-fav { position: relative; }
.nav-fav-badge {
  position: absolute; top: -4px; right: -4px;
  background: var(--gold); color: #000; font-size: 10px; font-weight: 700;
  width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center;
}
.nav-fav-badge[hidden] { display: none; }

/* ===================== NAV — hamburger (mobile only) ===================== */
.nav-burger { display: none; }
@media (max-width: 768px) {
  .nav-inner { grid-template-columns: 1fr auto; gap: 16px; padding: 14px 20px; }
  .nav-menu {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(5,5,5,0.97); backdrop-filter: blur(20px);
    flex-direction: column; justify-content: center; align-items: center;
    gap: 32px; z-index: 200; transform: translateY(-100%);
    transition: transform .35s ease; padding: 80px 20px;
  }
  .nav-menu.open { transform: translateY(0); }
  .nav-menu a { font-size: 18px; }
  .nav-burger { display: grid; }
}
@media (max-width: 480px) {
  .nav-inner { padding: 12px 16px; }
  .logo-text { font-size: 16px; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Nav.astro src/styles/global.css
git commit -m "feat(components): Nav with mobile hamburger and favorites badge"
```

### Task 13: Hero

**Files:**
- Create: `src/components/Hero.astro`

Reference: `index.html` lines 800–831.

- [ ] **Step 1: Write the component**

```astro
---
import type { CollectionEntry } from 'astro:content';
type Inicio = Extract<CollectionEntry<'settings'>['data'], { tipo: 'inicio' }>;
export interface Props { data: Inicio; whatsapp: string; templateGenerico: string }
import { buildWaUrl } from '../lib/whatsapp';
const { data, whatsapp, templateGenerico } = Astro.props;
const waHref = buildWaUrl(whatsapp, templateGenerico);

// Split línea 3 to wrap the golden word in <span class="gold">
const linea3Full = data.hero_titulo_linea3;
const golden = data.hero_titulo_linea3_palabra_dorada;
const linea3Before = linea3Full.replace(golden, '').trim();
---
<section class="hero">
  <div class="hero-inner">
    <div>
      <div class="hero-eyebrow">{data.hero_eyebrow}</div>
      <h1>
        <span>{data.hero_titulo_linea1}</span>
        <span><em class="serif">{data.hero_titulo_linea2}</em></span>
        <span>{linea3Before} <span class="gold">{golden}</span></span>
      </h1>
      <p>{data.hero_parrafo}</p>
      <div class="hero-actions">
        <a href="#coleccion" class="btn btn-gold">Ver Colección <span class="arrow">→</span></a>
        <a href={waHref} target="_blank" rel="noopener" class="btn btn-ghost">Pedir por WhatsApp <span class="arrow">→</span></a>
      </div>
    </div>
    <div class="hero-visual">
      <div class="hero-jersey-wrap">
        <img src={data.hero_jersey_foto} alt="Camiseta destacada" class="hero-jersey" />
      </div>
      <div class="hero-stat s1">
        <div class="hero-stat-num">{data.hero_stat_1_numero}</div>
        <div class="hero-stat-lbl">{data.hero_stat_1_etiqueta}</div>
      </div>
      <div class="hero-stat s2">
        <div class="hero-stat-num">{data.hero_stat_2_numero}</div>
        <div class="hero-stat-lbl">{data.hero_stat_2_etiqueta}</div>
      </div>
    </div>
  </div>
  <div class="scroll-hint">SCROLL</div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat(components): Hero with editable stats"
```

### Task 14: TrustBar

**Files:**
- Create: `src/components/TrustBar.astro`

Reference: `index.html` lines 834–853.

- [ ] **Step 1: Write the component**

```astro
---
export interface Props { items: { icono: string; titulo: string; subtitulo: string }[] }
const { items } = Astro.props;
---
<div class="trust-bar">
  <div class="trust-inner">
    {items.map(item => (
      <div class="trust-item">
        <div class="trust-icon">{item.icono}</div>
        <div class="trust-text"><strong>{item.titulo}</strong><span>{item.subtitulo}</span></div>
      </div>
    ))}
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TrustBar.astro
git commit -m "feat(components): TrustBar"
```

### Task 15: CinematicBanner

**Files:**
- Create: `src/components/CinematicBanner.astro`

Reference: `index.html` lines 991–1000.

- [ ] **Step 1: Write the component**

```astro
---
import type { CollectionEntry } from 'astro:content';
import { buildWaUrl } from '../lib/whatsapp';
type Inicio = Extract<CollectionEntry<'settings'>['data'], { tipo: 'inicio' }>;
export interface Props { data: Inicio; whatsapp: string; templateGenerico: string }
const { data, whatsapp, templateGenerico } = Astro.props;
const waHref = buildWaUrl(whatsapp, templateGenerico);
---
<section class="cinematic reveal">
  <div class="cinematic-bg" style={`background-image:url('${data.cinematic_imagen}')`}></div>
  <div class="cinematic-overlay"></div>
  <div class="cinematic-inner">
    <h2 class="cinematic-title">{data.cinematic_titulo_linea1}<br />{data.cinematic_titulo_linea2}</h2>
    <p class="cinematic-sub">{data.cinematic_subtitulo}</p>
    <a href={waHref} target="_blank" rel="noopener" class="btn btn-gold">{data.cinematic_cta_texto} <span class="arrow">→</span></a>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CinematicBanner.astro
git commit -m "feat(components): CinematicBanner"
```

---

## PART 5 — Coleccion + ProductCard

### Task 16: ProductCard

**Files:**
- Create: `src/components/ProductCard.astro`
- Modify: `src/styles/global.css` (badge colors + favorite-active state)

Reference: `index.html` lines 884–902 (one product).

- [ ] **Step 1: Append CSS for badge colors and favorited state**

Append to `src/styles/global.css`:

```css
/* ===================== PRODUCT — badge color variants ===================== */
.product-badge.gold { background: var(--gold); color: #000; }
.product-badge.red-vintage { background: var(--red); color: #fff; }
.product-badge.orange-last { background: #ff7a1a; color: #fff; }
.product-wishlist.is-fav { color: var(--gold); }
.product-wishlist.is-fav::before { content: '♥'; }
.product-wishlist::before { content: '♡'; }
.product-wishlist { color: var(--cream); }
```

(If the original CSS already styles `.product-wishlist` with ♡ content, this may double — verify by grepping `wishlist` in `global.css` and merging properly. The HTML has the literal "♡" as text content, not via `::before`, so the rule above replaces the text — adjust the component accordingly.)

- [ ] **Step 2: Write the component (without ::before, using text content for portability)**

```astro
---
import type { CollectionEntry } from 'astro:content';
import { renderTemplate, buildWaUrl } from '../lib/whatsapp';
type Camiseta = CollectionEntry<'camisetas'>;
type Contacto = Extract<CollectionEntry<'settings'>['data'], { tipo: 'contacto' }>;
export interface Props { camiseta: Camiseta; templates: Contacto; whatsapp: string }
const { camiseta, templates, whatsapp } = Astro.props;
const d = camiseta.data;
const message = renderTemplate(templates.template_camiseta, {
  nombre: d.titulo,
  equipo: d.equipo,
  precio: d.precio,
  talla: 'a confirmar',
});
const waHref = buildWaUrl(whatsapp, message);
const badgeClass = d.badge ? `product-badge ${d.badge.color}` : '';
---
<article class="product reveal" data-slug={camiseta.slug}>
  <div class="product-img-wrap">
    <img src={d.foto} class="product-img" alt={d.titulo} loading="lazy" />
    {d.badge && <div class={badgeClass}>{d.badge.texto}</div>}
    <button class="product-wishlist" type="button" aria-label="Añadir a favoritos" data-fav-toggle={camiseta.slug}>♡</button>
  </div>
  <div class="product-info">
    <div class="product-meta">{d.eyebrow}</div>
    <h3 class="product-name">{d.titulo}</h3>
    <div class="product-team">{d.equipo}</div>
    <div class="product-bottom">
      <div class="product-price">
        {d.precio_anterior && <small>{d.precio_anterior}€</small>}
        {d.precio}€
      </div>
      <a class="product-cta" href={waHref} target="_blank" rel="noopener">Pedir →</a>
    </div>
  </div>
</article>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ProductCard.astro src/styles/global.css
git commit -m "feat(components): ProductCard with badge variants and favorite hook"
```

### Task 17: Coleccion

**Files:**
- Create: `src/components/Coleccion.astro`

Reference: `index.html` lines 875–989.

- [ ] **Step 1: Write the component**

```astro
---
import type { CollectionEntry } from 'astro:content';
import ProductCard from './ProductCard.astro';
type Camiseta = CollectionEntry<'camisetas'>;
type Contacto = Extract<CollectionEntry<'settings'>['data'], { tipo: 'contacto' }>;
export interface Props { camisetas: Camiseta[]; templates: Contacto; whatsapp: string }
const { camisetas, templates, whatsapp } = Astro.props;
const destacadas = camisetas
  .filter(c => c.data.destacada)
  .sort((a, b) => a.data.orden - b.data.orden);
---
<section class="section" id="coleccion" style="padding-top:0">
  <div class="section-inner">
    <div class="section-head reveal">
      <div>
        <div class="section-eyebrow">COLECCIÓN DESTACADA</div>
        <h2 class="section-title">Las piezas que <em>todos</em><br>quieren tener</h2>
      </div>
    </div>
    <div class="collection">
      {destacadas.map(c => <ProductCard camiseta={c} templates={templates} whatsapp={whatsapp} />)}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Coleccion.astro
git commit -m "feat(components): Coleccion grid of destacadas"
```

---

## PART 6 — Sorteo

### Task 18: SorteoGrid (server-rendered 100 cells)

**Files:**
- Create: `src/components/SorteoGrid.astro`

The original JS in `index.html` (lines 1212–1262) builds the grid client-side. We render it server-side for better first paint, and a script later adds interactivity.

- [ ] **Step 1: Write the component**

```astro
---
export interface Props {
  vendidos: { numero: string; comprador: string }[];
  reservados: string[];
}
const { vendidos, reservados } = Astro.props;
const soldMap = new Map(vendidos.map(v => [v.numero, v.comprador]));
const reservedSet = new Set(reservados);
const cells = Array.from({ length: 100 }, (_, i) => {
  const num = String(i).padStart(2, '0');
  if (soldMap.has(num)) return { num, kind: 'sold', buyer: soldMap.get(num)! };
  if (reservedSet.has(num)) return { num, kind: 'reserved' as const };
  return { num, kind: 'avail' as const };
});
---
<div class="grid-100" id="grid100">
  {cells.map(c => {
    if (c.kind === 'sold') return (
      <div class="cell sold" data-num={c.num} title={`Vendido a ${c.buyer}`}>
        <span>{c.num}</span><span class="cell-buyer">{c.buyer}</span>
      </div>
    );
    if (c.kind === 'reserved') return (
      <div class="cell reserved" data-num={c.num} title="Reservado · pendiente de pago">{c.num}</div>
    );
    return (
      <div class="cell avail" data-num={c.num} title="Disponible · click para elegir">{c.num}</div>
    );
  })}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SorteoGrid.astro
git commit -m "feat(components): SorteoGrid server-rendered 100 cells"
```

### Task 19: SorteoSection + SorteosAnteriores

**Files:**
- Create: `src/components/SorteoSection.astro`
- Create: `src/components/SorteosAnteriores.astro`
- Modify: `src/styles/global.css` (progress bar + sorteos-anteriores grid)

Reference: `index.html` lines 1002–1057.

- [ ] **Step 1: Append CSS for progress bar and previous sorteos grid**

```css
/* ===================== SORTEO — progress bar ===================== */
.sorteo-progress { margin: 24px 0; }
.sorteo-progress-track {
  height: 8px; background: rgba(255,255,255,.08);
  border-radius: 4px; overflow: hidden;
}
.sorteo-progress-fill {
  height: 100%; background: linear-gradient(90deg, var(--gold-deep), var(--gold));
  transition: width .8s ease;
}
.sorteo-progress-label {
  display: flex; justify-content: space-between;
  font-family: var(--font-display); letter-spacing: .15em; font-size: 11px;
  color: var(--gold); margin-bottom: 8px;
}

/* ===================== SORTEOS ANTERIORES ===================== */
.sorteos-anteriores { margin-top: 80px; padding: 0 20px; }
.sorteos-anteriores h3 {
  font-family: var(--font-display); letter-spacing: .2em; font-size: 18px;
  color: var(--cream); text-align: center; margin-bottom: 32px;
}
.sorteos-anteriores-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px; max-width: 1200px; margin: 0 auto;
}
.sorteo-anterior {
  background: var(--bg-2); border: 1px solid var(--line); padding: 24px;
  text-align: center;
}
.sorteo-anterior img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin: 0 auto 12px; }
.sorteo-anterior-num { font-family: var(--font-display); font-size: 32px; color: var(--gold); line-height: 1; }
.sorteo-anterior-name { color: var(--cream); margin: 4px 0; }
.sorteo-anterior-title { color: var(--muted); font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
```

- [ ] **Step 2: `SorteosAnteriores.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
export interface Props { sorteos: CollectionEntry<'sorteos'>[] }
const { sorteos } = Astro.props;
---
{sorteos.length > 0 && (
  <div class="sorteos-anteriores reveal">
    <h3>SORTEOS ANTERIORES</h3>
    <div class="sorteos-anteriores-grid">
      {sorteos.map(s => (
        <div class="sorteo-anterior">
          {s.data.ganador_foto && <img src={s.data.ganador_foto} alt={s.data.ganador_nombre} />}
          <div class="sorteo-anterior-num">#{s.data.ganador_numero}</div>
          <div class="sorteo-anterior-name">{s.data.ganador_nombre}</div>
          <div class="sorteo-anterior-title">{s.data.titulo}</div>
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 3: `SorteoSection.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import SorteoGrid from './SorteoGrid.astro';
import SorteosAnteriores from './SorteosAnteriores.astro';
type Sorteo = CollectionEntry<'sorteos'>;
type Contacto = Extract<CollectionEntry<'settings'>['data'], { tipo: 'contacto' }>;
export interface Props {
  sorteo: Sorteo | null;
  finalizados: Sorteo[];
  templates: Contacto;
  whatsapp: string;
  seccionVisible: boolean;
}
const { sorteo, finalizados, templates, whatsapp, seccionVisible } = Astro.props;

// Global toggle: if the editor turned the whole section off, render nothing.
const renderNothing = !seccionVisible || (!sorteo && finalizados.length === 0);

const d = sorteo?.data;
const showCountdown = d && (d.tipo_finalizacion === 'por_fecha' || d.tipo_finalizacion === 'por_fecha_o_completarse');
const showProgress = d && (d.tipo_finalizacion === 'por_completarse' || d.tipo_finalizacion === 'por_fecha_o_completarse');
const soldCount = d?.vendidos.length ?? 0;
const progressPct = Math.round((soldCount / 100) * 100);

// Effective message template for grid CTA — per-sorteo override or global
const sorteoMessageTemplate = d?.mensaje_whatsapp_custom?.trim()
  ? d.mensaje_whatsapp_custom
  : templates.template_sorteo;
const titulo = d?.titulo ?? '';

// Timeline: last 4 vendidos in reverse order (most recent first), only if enabled
const showTimeline = d?.mostrar_timeline_vendidos && d.vendidos.length > 0;
const timelineItems = showTimeline ? d.vendidos.slice(-4).reverse() : [];
---
{!renderNothing && sorteo && d && (
  <section class="section sorteo" id="sorteo">
    <div class="sorteo-inner">
      <div class="sorteo-content reveal">
        <div class="section-eyebrow">{d.eyebrow}</div>
        <h2 set:html={d.titulo.replace(/\n/g, '<br>')} />
        <p class="sorteo-desc">{d.descripcion}</p>

        {showCountdown && d.fecha_limite && (
          <div class="countdown" id="cd" data-fecha-limite={d.fecha_limite.toISOString()}>
            <div class="cd-unit"><div class="cd-num" id="cd-d">00</div><div class="cd-lbl">Días</div></div>
            <div class="cd-unit"><div class="cd-num" id="cd-h">00</div><div class="cd-lbl">Horas</div></div>
            <div class="cd-unit"><div class="cd-num" id="cd-m">00</div><div class="cd-lbl">Min</div></div>
            <div class="cd-unit"><div class="cd-num" id="cd-s">00</div><div class="cd-lbl">Seg</div></div>
          </div>
        )}

        {showProgress && (
          <div class="sorteo-progress">
            <div class="sorteo-progress-label">
              <span>{soldCount}/100 pillados</span><span>{100 - soldCount} disponibles</span>
            </div>
            <div class="sorteo-progress-track">
              <div class="sorteo-progress-fill" style={`width:${progressPct}%`}></div>
            </div>
          </div>
        )}

        <div class="sorteo-price">
          <div class="sorteo-price-label">Por solo</div>
          <div class="sorteo-price-num">{d.precio_numero}</div>
          <div class="sorteo-price-cur">€</div>
        </div>

        {showTimeline && (
          <div class="sorteo-timeline">
            <div class="timeline-title">EN DIRECTO · ÚLTIMOS PILLADOS</div>
            <ul class="timeline-list">
              {timelineItems.map(v => (
                <li><span>{v.comprador} cogió el</span> <b>#{v.numero}</b></li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div class="sorteo-grid-wrap reveal"
           data-whatsapp={whatsapp}
           data-sorteo-titulo={titulo}
           data-sorteo-precio={d.precio_numero}
           data-template={sorteoMessageTemplate}>
        <div class="grid-header">
          <span class="grid-header-label">ELIGE TU NÚMERO</span>
          <span class="grid-counter"><b id="gcSold">{soldCount}</b> / 100 pillados</span>
        </div>
        <SorteoGrid vendidos={d.vendidos} reservados={d.reservados} />
        <div class="grid-legend">
          <span><span class="legend-dot avail"></span>Disponible</span>
          <span><span class="legend-dot sold"></span>Vendido</span>
          <span><span class="legend-dot reserved"></span>Reservado</span>
          <span><span class="legend-dot selected"></span>Tu elección</span>
        </div>
        <div class="grid-cta-wrap" id="gridCta">
          <div class="grid-cta-info">
            <div class="grid-cta-label">Has elegido el número</div>
            <div class="grid-cta-num">--</div>
          </div>
          <button class="grid-cta-btn" id="gridCtaBtn" type="button">RESERVAR POR WHATSAPP</button>
          <button class="grid-cta-clear" id="gridCtaClear" type="button">Limpiar selección</button>
        </div>
      </div>
    </div>

    <SorteosAnteriores sorteos={finalizados} />
  </section>
)}

{!renderNothing && !sorteo && finalizados.length > 0 && (
  <section class="section sorteo">
    <div class="sorteo-inner"><SorteosAnteriores sorteos={finalizados} /></div>
  </section>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/SorteoSection.astro src/components/SorteosAnteriores.astro src/styles/global.css
git commit -m "feat(components): SorteoSection with countdown, progress bar, previous draws"
```

---

## PART 7 — Bottom of page components

### Task 20: Steps

**Files:**
- Create: `src/components/Steps.astro`

Reference: `index.html` lines 1059–1086.

- [ ] **Step 1: Write the component**

```astro
---
export interface Props { steps: { numero: string; titulo: string; texto: string }[] }
const { steps } = Astro.props;
---
<section class="section" style="background:var(--bg-2)">
  <div class="section-inner">
    <div class="section-head reveal" style="justify-content:center;text-align:center;margin-bottom:80px">
      <div>
        <div class="section-eyebrow" style="justify-content:center">CÓMO COMPRAR</div>
        <h2 class="section-title">Tres pasos. <em>Cero</em> complicaciones.</h2>
      </div>
    </div>
    <div class="steps">
      {steps.map(s => (
        <div class="step reveal">
          <div class="step-num">{s.numero}</div>
          <div class="step-title">{s.titulo}</div>
          <p class="step-text" set:html={s.texto.replace('WhatsApp', '<span class="wa">WhatsApp</span>')} />
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Steps.astro
git commit -m "feat(components): Steps"
```

### Task 21: Personalizer

**Files:**
- Create: `src/components/Personalizer.astro`

Reference: `index.html` lines 1088–1127.

- [ ] **Step 1: Write the component**

```astro
---
import type { CollectionEntry } from 'astro:content';
type Inicio = Extract<CollectionEntry<'settings'>['data'], { tipo: 'inicio' }>;
type Contacto = Extract<CollectionEntry<'settings'>['data'], { tipo: 'contacto' }>;
export interface Props { data: Inicio; templates: Contacto; whatsapp: string }
const { data, templates, whatsapp } = Astro.props;
---
<section class="section" id="personaliza"
         data-whatsapp={whatsapp}
         data-template={templates.template_personalizacion}>
  <div class="section-inner">
    <div class="section-head reveal">
      <div>
        <div class="section-eyebrow">PERSONALIZACIÓN PRO</div>
        <h2 class="section-title">Tu <em>nombre</em>, tu dorsal,<br>tu historia.</h2>
      </div>
    </div>
    <div class="personalizer reveal">
      <div class="pers-preview">
        <div class="pers-jersey">
          <div class="pers-name" id="pname">{data.personalizer_nombre_default}</div>
          <div class="pers-num" id="pnum">{data.personalizer_dorsal_default}</div>
        </div>
      </div>
      <div class="pers-controls">
        <div class="pers-eyebrow">PRUÉBALO EN VIVO</div>
        <h3 class="pers-title">{data.personalizer_titulo}</h3>
        <div class="pers-field">
          <label class="pers-label" for="iname">Nombre en la espalda</label>
          <input type="text" class="pers-input" id="iname" value={data.personalizer_nombre_default} maxlength="12" />
        </div>
        <div class="pers-row">
          <div class="pers-field">
            <label class="pers-label" for="inum">Dorsal</label>
            <input type="text" class="pers-input" id="inum" value={data.personalizer_dorsal_default} maxlength="2" />
          </div>
          <div class="pers-field">
            <label class="pers-label" for="italla">Talla</label>
            <select class="pers-input" id="italla">
              <option>S</option><option>M</option><option selected>L</option><option>XL</option><option>XXL</option>
            </select>
          </div>
        </div>
        <button class="pers-add" type="button" id="persAdd">Añadir personalización +{data.personalizer_precio_extra}€ →</button>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Personalizer.astro
git commit -m "feat(components): Personalizer with editable defaults"
```

### Task 22: Footer

**Files:**
- Create: `src/components/Footer.astro`

Reference: `index.html` lines 1150–1193.

- [ ] **Step 1: Write the component**

```astro
---
import type { CollectionEntry } from 'astro:content';
import { buildWaUrl } from '../lib/whatsapp';
type Contacto = Extract<CollectionEntry<'settings'>['data'], { tipo: 'contacto' }>;
export interface Props { contacto: Contacto }
const { contacto } = Astro.props;
const waHref = buildWaUrl(contacto.whatsapp, contacto.template_generico);
const igHref = `https://instagram.com/${contacto.instagram}`;
---
<footer class="footer" id="contacto">
  <div class="footer-cta reveal">
    <h3>¿Buscas una <em>camiseta especial</em>?</h3>
    <p>Habla directamente con nosotros por WhatsApp. Respuesta en minutos y atención personal de quien sabe de camisetas.</p>
    <a href={waHref} target="_blank" rel="noopener" class="btn-wa">
      <span class="wa-icon">◉</span> ESCRIBIR POR WHATSAPP
    </a>
  </div>

  <div class="footer-grid">
    <div class="footer-brand">
      <a href="#" class="logo">
        <div class="logo-shield"></div>
        <div class="logo-text">CAMISETAS <b>FQ</b></div>
      </a>
      <p>{contacto.footer_descripcion}</p>
      <div class="socials">
        <a href={igHref} target="_blank" rel="noopener" class="social" aria-label="Instagram">ⓘ</a>
        <a href={waHref} target="_blank" rel="noopener" class="social" aria-label="WhatsApp">◉</a>
        {contacto.tiktok && <a href={`https://tiktok.com/@${contacto.tiktok}`} target="_blank" rel="noopener" class="social" aria-label="TikTok">▶</a>}
        {contacto.email && <a href={`mailto:${contacto.email}`} class="social" aria-label="Email">✉</a>}
      </div>
    </div>

    <div class="footer-col">
      <h4>NAVEGAR</h4>
      <ul>
        <li><a href="#coleccion">→ Colección</a></li>
        <li><a href="#sorteo">→ Sorteo activo</a></li>
        <li><a href="#personaliza">→ Personalizar</a></li>
      </ul>
    </div>

    <div class="footer-col">
      <h4>AYUDA</h4>
      <ul>
        <li><a href={waHref} target="_blank" rel="noopener">→ Guía de tallas</a></li>
        <li><a href={waHref} target="_blank" rel="noopener">→ Envíos</a></li>
        <li><a href={waHref} target="_blank" rel="noopener">→ Cómo pedir</a></li>
      </ul>
    </div>

    <div class="footer-col">
      <h4>CONTACTO</h4>
      <ul>
        <li><a href={waHref} target="_blank" rel="noopener">→ WhatsApp directo</a></li>
        <li><a href={igHref} target="_blank" rel="noopener">→ @{contacto.instagram}</a></li>
        {contacto.email && <li><a href={`mailto:${contacto.email}`}>→ Email</a></li>}
      </ul>
    </div>
  </div>

  <div class="footer-bottom">
    <div>© {contacto.footer_anio} <span class="gold">Camisetas FQ</span> · Futbol Quality. Todos los derechos reservados.</div>
    <div>Diseño cinemático · Hecho con pasión por el fútbol</div>
  </div>
</footer>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat(components): Footer with optional email"
```

---

## PART 8 — Client-side scripts

### Task 23: `reveal.js` + `nav-mobile.js`

**Files:**
- Create: `src/scripts/reveal.js`
- Create: `src/scripts/nav-mobile.js`

- [ ] **Step 1: Create directory**

```bash
mkdir -p src/scripts
```

- [ ] **Step 2: `reveal.js`**

```js
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));
document.querySelectorAll('.product.reveal').forEach((el, i) => { el.style.transitionDelay = (i * 80) + 'ms'; });

window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  if (!nav) return;
  nav.style.background = window.scrollY > 40 ? 'rgba(5,5,5,0.95)' : 'rgba(10,10,10,0.85)';
});
```

- [ ] **Step 3: `nav-mobile.js`**

```js
const burger = document.getElementById('navBurger');
const menu = document.getElementById('navMenu');
if (burger && menu) {
  burger.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    burger.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    burger.textContent = isOpen ? '✕' : '☰';
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open');
    burger.textContent = '☰';
    burger.setAttribute('aria-label', 'Abrir menú');
  }));
}
```

- [ ] **Step 4: Commit**

```bash
git add src/scripts/reveal.js src/scripts/nav-mobile.js
git commit -m "feat(scripts): reveal observer and mobile nav toggle"
```

### Task 24: `countdown.js`

**Files:**
- Create: `src/scripts/countdown.js`

- [ ] **Step 1: Write the script**

```js
const cd = document.getElementById('cd');
if (cd) {
  const target = new Date(cd.dataset.fechaLimite);
  const D = document.getElementById('cd-d');
  const H = document.getElementById('cd-h');
  const M = document.getElementById('cd-m');
  const S = document.getElementById('cd-s');
  const pad = n => String(Math.max(0, n)).padStart(2, '0');
  function tick() {
    const diff = target - new Date();
    if (diff <= 0) {
      [D, H, M, S].forEach(el => el && (el.textContent = '00'));
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (D) D.textContent = pad(d);
    if (H) H.textContent = pad(h);
    if (M) M.textContent = pad(m);
    if (S) S.textContent = pad(s);
  }
  setInterval(tick, 1000);
  tick();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scripts/countdown.js
git commit -m "feat(scripts): countdown reading data-fecha-limite"
```

### Task 25: `sorteo-grid.js` (multi-select)

**Files:**
- Create: `public/scripts/sorteo-grid.js`

Multi-select cliente-side: el visitante marca varios números, ve total agregado, manda la lista por WhatsApp. La selección NO se persiste en el CMS — el editor marca vendidos/reservados manualmente después de confirmar pago. Tras abrir WhatsApp, la selección se LIMPIA automáticamente.

La lógica de plantilla (singular/plural, lista formateada, total) replica `renderSorteoTemplate()` de `src/lib/whatsapp.ts` inline (no se puede importar TypeScript en JS plano del navegador). Los tests del lib garantizan la corrección de la lógica.

- [ ] **Step 1: Write the script**

```js
const grid = document.getElementById('grid100');
if (grid) {
  const wrap = grid.closest('.sorteo-grid-wrap');
  const phone = wrap.dataset.whatsapp;
  const tituloSorteo = wrap.dataset.sorteoTitulo;
  const precio = Number(wrap.dataset.sorteoPrecio);
  const template = wrap.dataset.template;
  const cta = document.getElementById('gridCta');
  const ctaInfo = cta.querySelector('.grid-cta-info');
  const ctaBtn = document.getElementById('gridCtaBtn');
  const ctaClear = document.getElementById('gridCtaClear');
  const selected = new Set();

  function renderTemplate(tpl, nums) {
    if (nums.length === 0) return '';
    const cantidadTexto = nums.length === 1 ? 'el número' : `los ${nums.length} números`;
    const numerosFmt = nums.map(n => `#${n}`).join(', ');
    const total = nums.length * precio;
    return tpl
      .replace(/\{numero\}/g, nums[0])
      .replace(/\{numeros\}/g, numerosFmt)
      .replace(/\{cantidad_texto\}/g, cantidadTexto)
      .replace(/\{total\}/g, String(total))
      .replace(/\{titulo_sorteo\}/g, tituloSorteo)
      .replace(/\{precio\}/g, String(precio));
  }

  function renderCta() {
    if (selected.size === 0) {
      cta.classList.remove('show');
      return;
    }
    const nums = [...selected].sort();
    const numerosFmt = nums.map(n => `#${n}`).join(', ');
    const total = nums.length * precio;
    if (nums.length === 1) {
      ctaInfo.innerHTML = `<div class="grid-cta-label">Has elegido el número</div><div class="grid-cta-num">#${nums[0]}</div>`;
      ctaBtn.textContent = `RESERVAR EL #${nums[0]} POR WHATSAPP`;
    } else {
      ctaInfo.innerHTML = `<div class="grid-cta-label">Has elegido ${nums.length} números</div><div class="grid-cta-num">${numerosFmt}</div><div class="grid-cta-total">Total: ${total}€</div>`;
      ctaBtn.textContent = `RESERVAR LOS ${nums.length} NÚMEROS POR WHATSAPP`;
    }
    cta.classList.add('show');
  }

  function clearSelection() {
    selected.forEach(num => {
      const cell = grid.querySelector(`.cell[data-num="${num}"]`);
      if (cell) { cell.classList.remove('selected'); cell.classList.add('avail'); }
    });
    selected.clear();
    renderCta();
  }

  grid.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const num = cell.dataset.num;
    if (cell.classList.contains('selected')) {
      cell.classList.remove('selected');
      cell.classList.add('avail');
      selected.delete(num);
    } else if (cell.classList.contains('avail')) {
      cell.classList.remove('avail');
      cell.classList.add('selected');
      selected.add(num);
    } else {
      return;
    }
    renderCta();
    if (selected.size === 1) cta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  ctaBtn.addEventListener('click', () => {
    if (selected.size === 0) return;
    const nums = [...selected].sort();
    const msg = renderTemplate(template, nums);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    clearSelection();
  });

  ctaClear?.addEventListener('click', clearSelection);
}
```

- [ ] **Step 2: Commit**

```bash
git add public/scripts/sorteo-grid.js
git commit -m "feat(scripts): sorteo grid multi-select with auto-clear after WhatsApp"
```

### Task 26: `personalizer.js`

**Files:**
- Create: `src/scripts/personalizer.js`

- [ ] **Step 1: Write the script**

```js
const persSection = document.getElementById('personaliza');
const iname = document.getElementById('iname');
const inum = document.getElementById('inum');
const italla = document.getElementById('italla');
const pname = document.getElementById('pname');
const pnum = document.getElementById('pnum');
const persAdd = document.getElementById('persAdd');

if (iname && pname) iname.addEventListener('input', () => { pname.textContent = iname.value.toUpperCase(); });
if (inum && pnum) inum.addEventListener('input', () => { pnum.textContent = inum.value; });

if (persAdd && persSection) {
  const phone = persSection.dataset.whatsapp;
  const template = persSection.dataset.template;
  persAdd.addEventListener('click', () => {
    const msg = template
      .replace('{nombre}', iname?.value || 'CAMPEÓN')
      .replace('{dorsal}', inum?.value || '10')
      .replace('{talla}', italla?.value || 'L');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scripts/personalizer.js
git commit -m "feat(scripts): personalizer live preview + whatsapp CTA"
```

### Task 27: FavoritosDrawer component

**Files:**
- Create: `src/components/FavoritosDrawer.astro`
- Modify: `src/styles/global.css` (drawer styles)

- [ ] **Step 1: Append drawer styles to `global.css`**

```css
/* ===================== FAVORITOS DRAWER ===================== */
.fav-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(4px);
  z-index: 300; opacity: 0; pointer-events: none; transition: opacity .3s;
}
.fav-overlay.open { opacity: 1; pointer-events: auto; }
.fav-drawer {
  position: fixed; top: 0; right: 0; bottom: 0; width: min(420px, 100%);
  background: var(--bg-2); border-left: 1px solid var(--gold-deep);
  z-index: 301; transform: translateX(100%); transition: transform .35s ease;
  display: flex; flex-direction: column;
}
.fav-drawer.open { transform: translateX(0); }
.fav-header {
  padding: 20px 24px; border-bottom: 1px solid var(--line);
  display: flex; justify-content: space-between; align-items: center;
}
.fav-title { font-family: var(--font-display); letter-spacing: .2em; font-size: 14px; color: var(--gold); }
.fav-close { font-size: 22px; color: var(--cream); width: 32px; height: 32px; }
.fav-list { flex: 1; overflow-y: auto; padding: 16px; }
.fav-item {
  display: grid; grid-template-columns: 80px 1fr auto; gap: 12px;
  padding: 12px 0; border-bottom: 1px solid var(--line); align-items: center;
}
.fav-item img { width: 80px; height: 100px; object-fit: cover; }
.fav-item-name { color: var(--cream); font-size: 14px; }
.fav-item-team { color: var(--muted); font-size: 11px; }
.fav-item-price { color: var(--gold); font-family: var(--font-display); font-size: 18px; }
.fav-item-remove { color: var(--muted); font-size: 18px; padding: 4px 8px; }
.fav-empty { text-align: center; padding: 60px 20px; color: var(--muted); }
.fav-empty-icon { font-size: 64px; color: var(--gold-deep); margin-bottom: 16px; }
.fav-empty-title { font-family: var(--font-display); letter-spacing: .15em; color: var(--cream); font-size: 16px; margin-bottom: 8px; }
.fav-empty-text { font-size: 13px; line-height: 1.6; margin-bottom: 24px; }
.fav-footer { padding: 16px; border-top: 1px solid var(--line); display: flex; flex-direction: column; gap: 12px; }
.fav-cta-wa {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  background: var(--wa); color: #000; padding: 14px;
  font-family: var(--font-display); letter-spacing: .2em; font-size: 13px; font-weight: 600;
}
.fav-cta-wa:hover { background: var(--wa-dark); color: #fff; }
.fav-clear { color: var(--muted); font-size: 12px; text-align: center; text-decoration: underline; }
```

- [ ] **Step 2: Write the component**

```astro
---
import type { CollectionEntry } from 'astro:content';
type Camiseta = CollectionEntry<'camisetas'>;
type Contacto = Extract<CollectionEntry<'settings'>['data'], { tipo: 'contacto' }>;
export interface Props { camisetas: Camiseta[]; templates: Contacto; whatsapp: string }
const { camisetas, templates, whatsapp } = Astro.props;
// Serialize compact data for the client-side script
const itemsData = camisetas.map(c => ({
  slug: c.slug,
  titulo: c.data.titulo,
  equipo: c.data.equipo,
  precio: c.data.precio,
  foto: c.data.foto,
}));
---
<div class="fav-overlay" id="favOverlay"></div>
<aside class="fav-drawer" id="favDrawer" aria-hidden="true"
       data-whatsapp={whatsapp}
       data-template={templates.template_favoritos}
       data-items={JSON.stringify(itemsData)}>
  <div class="fav-header">
    <div class="fav-title" id="favTitle">TUS FAVORITOS</div>
    <button class="fav-close" id="favClose" type="button" aria-label="Cerrar">✕</button>
  </div>
  <div class="fav-list" id="favList"></div>
  <div class="fav-empty" id="favEmpty">
    <div class="fav-empty-icon">♡</div>
    <div class="fav-empty-title">AÚN NO HAS GUARDADO CAMISETAS</div>
    <div class="fav-empty-text">Explora la colección y pulsa el ♡ en las que más te gusten para tenerlas siempre a mano.</div>
    <a href="#coleccion" class="btn btn-gold" id="favEmptyCta">Ver colección →</a>
  </div>
  <div class="fav-footer" id="favFooter" hidden>
    <button class="fav-cta-wa" id="favCta" type="button">◉ PEDIR TODAS POR WHATSAPP</button>
    <button class="fav-clear" id="favClear" type="button">Vaciar lista</button>
  </div>
</aside>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/FavoritosDrawer.astro src/styles/global.css
git commit -m "feat(components): FavoritosDrawer with empty state"
```

### Task 28: `favoritos.js`

**Files:**
- Create: `src/scripts/favoritos.js`

- [ ] **Step 1: Write the script**

```js
const STORAGE_KEY = 'camisetas-fq:favoritos';

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function save(slugs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs)); }
  catch {}
  window.dispatchEvent(new CustomEvent('favoritos-changed'));
}
function toggle(slug) {
  const list = load();
  const i = list.indexOf(slug);
  if (i >= 0) list.splice(i, 1); else list.push(slug);
  save(list);
}

// Mark hearts on initial render
function updateHearts() {
  const set = new Set(load());
  document.querySelectorAll('[data-fav-toggle]').forEach(btn => {
    const slug = btn.getAttribute('data-fav-toggle');
    btn.classList.toggle('is-fav', set.has(slug));
    btn.textContent = set.has(slug) ? '♥' : '♡';
  });
  const badge = document.getElementById('favBadge');
  if (badge) {
    badge.textContent = String(set.size);
    badge.hidden = set.size === 0;
  }
}

// Wire toggle buttons on product cards
document.querySelectorAll('[data-fav-toggle]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle(btn.getAttribute('data-fav-toggle'));
  });
});

// Drawer open/close
const drawer = document.getElementById('favDrawer');
const overlay = document.getElementById('favOverlay');
const favBtn = document.getElementById('favBtn');
const favClose = document.getElementById('favClose');
const favList = document.getElementById('favList');
const favEmpty = document.getElementById('favEmpty');
const favFooter = document.getElementById('favFooter');
const favTitle = document.getElementById('favTitle');
const favCta = document.getElementById('favCta');
const favClear = document.getElementById('favClear');
const favEmptyCta = document.getElementById('favEmptyCta');

function openDrawer() {
  if (!drawer) return;
  drawer.classList.add('open');
  overlay.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  renderDrawer();
}
function closeDrawer() {
  drawer.classList.remove('open');
  overlay.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
}

favBtn?.addEventListener('click', openDrawer);
favClose?.addEventListener('click', closeDrawer);
overlay?.addEventListener('click', closeDrawer);
favEmptyCta?.addEventListener('click', closeDrawer);

function renderDrawer() {
  if (!drawer) return;
  const items = JSON.parse(drawer.dataset.items || '[]');
  const itemsBySlug = new Map(items.map(it => [it.slug, it]));
  const favSlugs = load();
  const active = favSlugs.map(s => itemsBySlug.get(s)).filter(Boolean);
  favTitle.textContent = `TUS FAVORITOS · ${active.length} ${active.length === 1 ? 'pieza' : 'piezas'}`;
  if (active.length === 0) {
    favList.innerHTML = '';
    favEmpty.style.display = '';
    favFooter.hidden = true;
    return;
  }
  favEmpty.style.display = 'none';
  favFooter.hidden = false;
  favList.innerHTML = active.map(it => `
    <div class="fav-item">
      <img src="${it.foto}" alt="${it.titulo}" />
      <div>
        <div class="fav-item-name">${it.titulo}</div>
        <div class="fav-item-team">${it.equipo}</div>
        <div class="fav-item-price">${it.precio}€</div>
      </div>
      <button class="fav-item-remove" type="button" data-remove="${it.slug}" aria-label="Quitar">✕</button>
    </div>
  `).join('');
  favList.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => toggle(btn.getAttribute('data-remove')));
  });
}

favCta?.addEventListener('click', () => {
  const items = JSON.parse(drawer.dataset.items || '[]');
  const itemsBySlug = new Map(items.map(it => [it.slug, it]));
  const active = load().map(s => itemsBySlug.get(s)).filter(Boolean);
  if (active.length === 0) return;
  const lista = active.map(it => `• ${it.titulo} (${it.equipo}) - ${it.precio}€`).join('\n');
  const template = drawer.dataset.template;
  const phone = drawer.dataset.whatsapp;
  const msg = template.replace('{lista}', lista);
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
});

favClear?.addEventListener('click', () => save([]));

window.addEventListener('favoritos-changed', () => {
  updateHearts();
  if (drawer?.classList.contains('open')) renderDrawer();
});

updateHearts();
```

- [ ] **Step 2: Commit**

```bash
git add src/scripts/favoritos.js
git commit -m "feat(scripts): favoritos localStorage + drawer + badge"
```

---

## PART 9 — Assemble page + checkpoint 1

### Task 29: `index.astro` composition

**Files:**
- Create: `src/pages/index.astro`
- Modify: `src/layouts/BaseLayout.astro` (mount drawer + FAB + load scripts)

- [ ] **Step 1: Update `BaseLayout.astro` to include scripts and slots for global components**

Replace the body section of `src/layouts/BaseLayout.astro` with:

```astro
<body>
  <slot />
  <slot name="globals" />
  <script>
    window.addEventListener('load', () => {
      const loader = document.getElementById('loader');
      if (loader) setTimeout(() => loader.classList.add('gone'), 1400);
    });
  </script>
  <script src="/scripts/reveal.js" defer></script>
  <script src="/scripts/nav-mobile.js" defer></script>
  <script src="/scripts/countdown.js" defer></script>
  <script src="/scripts/sorteo-grid.js" defer></script>
  <script src="/scripts/personalizer.js" defer></script>
  <script src="/scripts/favoritos.js" defer></script>
</body>
```

- [ ] **Step 2: Move client scripts to `public/scripts/` so they're served as-is**

```bash
mkdir -p public/scripts
mv src/scripts/*.js public/scripts/
rmdir src/scripts
```

- [ ] **Step 3: Write `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getCollection, getEntry } from 'astro:content';
import Loader from '../components/Loader.astro';
import TopMarquee from '../components/TopMarquee.astro';
import Nav from '../components/Nav.astro';
import Hero from '../components/Hero.astro';
import TrustBar from '../components/TrustBar.astro';
import Coleccion from '../components/Coleccion.astro';
import CinematicBanner from '../components/CinematicBanner.astro';
import SorteoSection from '../components/SorteoSection.astro';
import Steps from '../components/Steps.astro';
import Personalizer from '../components/Personalizer.astro';
import Footer from '../components/Footer.astro';
import FloatingWhatsApp from '../components/FloatingWhatsApp.astro';
import FavoritosDrawer from '../components/FavoritosDrawer.astro';
import { getSorteoActivo, getSorteosFinalizados } from '../lib/sorteos';

const inicio = (await getEntry('settings', 'inicio')).data;
if (inicio.tipo !== 'inicio') throw new Error('settings/inicio.md tiene tipo incorrecto');
const contacto = (await getEntry('settings', 'contacto')).data;
if (contacto.tipo !== 'contacto') throw new Error('settings/contacto.md tiene tipo incorrecto');
const camisetas = await getCollection('camisetas');
const sorteos = await getCollection('sorteos');
const sorteoActivo = getSorteoActivo(sorteos);
const sorteosFinalizados = getSorteosFinalizados(sorteos);
---
<BaseLayout>
  <Loader />
  <TopMarquee mensajes={inicio.marquee} />
  <Nav />
  <Hero data={inicio} whatsapp={contacto.whatsapp} templateGenerico={contacto.template_generico} />
  <TrustBar items={inicio.trust_bar} />
  <Coleccion camisetas={camisetas} templates={contacto} whatsapp={contacto.whatsapp} />
  <CinematicBanner data={inicio} whatsapp={contacto.whatsapp} templateGenerico={contacto.template_generico} />
  <SorteoSection sorteo={sorteoActivo} finalizados={sorteosFinalizados} templates={contacto} whatsapp={contacto.whatsapp} seccionVisible={inicio.sorteo_seccion_visible} />
  <Steps steps={inicio.steps} />
  <Personalizer data={inicio} templates={contacto} whatsapp={contacto.whatsapp} />
  <Footer contacto={contacto} />

  <Fragment slot="globals">
    <FloatingWhatsApp whatsapp={contacto.whatsapp} templateGenerico={contacto.template_generico} />
    <FavoritosDrawer camisetas={camisetas} templates={contacto} whatsapp={contacto.whatsapp} />
  </Fragment>
</BaseLayout>
```

- [ ] **Step 4: Build to catch errors before dev**

Run: `npm run build`
Expected: `Server built in <time>ms` with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro src/layouts/BaseLayout.astro public/scripts/
git commit -m "feat: assemble index.astro with all sections"
```

### Task 30: 🛑 CHECKPOINT 1 — visual review

- [ ] **Step 1: Start dev server**

Run: `npm run dev` (run in background, port 4321)

- [ ] **Step 2: Pause for human review**

Tell the user:
> 🛑 **Checkpoint 1.** Dev server corriendo en `http://localhost:4321/`. Abre la URL y compárala lado a lado con `index.html` (puedes abrir `index.html` directamente con doble clic en el explorador). Comprueba:
> 1. ¿Se ven las 12 fotos correctamente? (6 destacadas en colección, 1 en hero, 1 en banner, 1 fondo sorteo)
> 2. ¿El loader desaparece tras ~1.5s?
> 3. ¿El countdown del sorteo cuenta hacia 2026-07-15?
> 4. ¿Al pulsar un número disponible se marca y aparece el CTA WhatsApp?
> 5. ¿El personalizador actualiza el nombre/dorsal en vivo?
> 6. ¿Los ♡ de los productos cambian a dorado y persisten tras refrescar?
> 7. ¿El drawer de favoritos se abre desde el ♡ de la nav?
> 8. Reduce el ancho del navegador a 375px (móvil): ¿aparece el ☰? ¿abre el menú vertical?
> 9. ¿Hay overflow horizontal en cualquier breakpoint?
>
> Dime: ✅ continuamos al CMS, o ✏️ con la lista de ajustes.

- [ ] **Step 3: Apply user fixes (if any)**

Loop: read each fix, edit the relevant file, refresh browser, confirm, commit. Do NOT proceed to Part 10 until the user explicitly approves.

---

## PART 10 — Sveltia CMS

### Task 31: Sveltia bootstrap + config

**Files:**
- Create: `public/admin/index.html`
- Create: `public/admin/config.yml`

- [ ] **Step 1: Create admin directory**

```bash
mkdir -p public/admin
```

- [ ] **Step 2: Write `public/admin/index.html`**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Camisetas FQ · Admin</title>
</head>
<body>
  <script type="module" src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
</body>
</html>
```

- [ ] **Step 3: Write `public/admin/config.yml`** (use the GitHub username captured in Task 0)

```yaml
backend:
  name: github
  repo: CORTADE/camisetas-fq
  branch: main
  base_url: https://sveltia-cms-auth.netlify.app
  auth_endpoint: oauth

media_folder: public/uploads
public_folder: /uploads

i18n:
  structure: single_file
  locales: [es]
  default_locale: es

collections:
  - name: camisetas
    label: "🎽 Camisetas"
    label_singular: "Camiseta"
    folder: src/content/camisetas
    create: true
    slug: "{{slug}}"
    extension: md
    format: yaml-frontmatter
    fields:
      - { name: titulo, label: "Título", widget: string }
      - { name: equipo, label: "Equipo / subtítulo", widget: string }
      - { name: eyebrow, label: "Eyebrow (competición)", widget: string }
      - { name: foto, label: "Foto principal", widget: image }
      - { name: precio, label: "Precio (€)", widget: number, value_type: int, min: 1 }
      - { name: precio_anterior, label: "Precio anterior (€) — opcional", widget: number, required: false, value_type: int }
      - name: badge
        label: "Badge (etiqueta sobre la foto)"
        widget: object
        required: false
        fields:
          - { name: texto, label: "Texto", widget: string, hint: 'Ej: DÉCIMA, VINTAGE, ÚLTIMA, NUEVA' }
          - { name: color, label: "Color", widget: select, options: [{label: "Dorado", value: gold}, {label: "Rojo vintage", value: red-vintage}, {label: "Naranja última", value: orange-last}], default: gold }
      - { name: stock, label: "Hay stock", widget: boolean, default: true }
      - { name: tallas, label: "Tallas disponibles", widget: select, multiple: true, options: [S, M, L, XL, XXL], default: [S, M, L, XL, XXL] }
      - { name: destacada, label: "Destacar en home", widget: boolean, default: false }
      - { name: orden, label: "Orden (menor = primero)", widget: number, value_type: int, default: 100 }
      - { name: body, label: "Descripción larga (opcional)", widget: markdown, required: false }

  - name: sorteos
    label: "🎰 Sorteos"
    label_singular: "Sorteo"
    folder: src/content/sorteos
    create: true
    slug: "{{slug}}"
    extension: md
    format: yaml-frontmatter
    fields:
      - { name: titulo, label: "Título", widget: string }
      - { name: eyebrow, label: "Eyebrow", widget: string }
      - { name: descripcion, label: "Descripción", widget: text }
      - { name: imagen_fondo, label: "Imagen de fondo", widget: image }
      - { name: precio_numero, label: "Precio por número (€)", widget: number, value_type: float, min: 0.5, default: 1 }
      - { name: premio_descripcion, label: "Premio (descripción)", widget: string }
      - name: estado
        label: "Estado"
        widget: select
        options:
          - { label: "📝 Borrador (no se muestra)", value: borrador }
          - { label: "🟢 Activo (sólo uno a la vez)", value: activo }
          - { label: "🏁 Finalizado", value: finalizado }
        default: borrador
        hint: "Recuerda: solo UN sorteo puede estar activo. Si marcas dos, sólo se muestra uno."
      - name: tipo_finalizacion
        label: "Cómo termina"
        widget: select
        options:
          - { label: "Por fecha límite", value: por_fecha }
          - { label: "Al completar los 100 números", value: por_completarse }
          - { label: "Por fecha O al completarse", value: por_fecha_o_completarse }
      - { name: fecha_limite, label: "Fecha límite", widget: datetime, required: false, hint: "Obligatorio si el tipo incluye fecha" }
      - { name: mensaje_whatsapp_custom, label: "Mensaje WhatsApp personalizado (opcional)", widget: text, required: false, hint: "Vacío = usa el global de Contacto. Variables: {numero}, {titulo_sorteo}, {precio}" }
      - name: vendidos
        label: "Números vendidos"
        label_singular: "Venta"
        widget: list
        required: false
        hint: "Sólo añade los vendidos. El resto son automáticamente 'disponibles'."
        fields:
          - { name: numero, label: "Número (00-99)", widget: string, pattern: ['^\d{2}$', 'Dos dígitos'] }
          - { name: comprador, label: "Nombre del comprador", widget: string }
      - name: reservados
        label: "Números reservados (pendientes de pago)"
        widget: list
        required: false
        field: { name: numero, label: "Número (00-99)", widget: string, pattern: ['^\d{2}$', 'Dos dígitos'] }
      - { name: mostrar_timeline_vendidos, label: "Mostrar lista de últimos pillados en directo", widget: boolean, default: true, hint: "Si desactivado, no se muestra la sección 'EN DIRECTO · ÚLTIMOS PILLADOS' para este sorteo." }
      - { name: ganador_nombre, label: "Ganador — Nombre (sólo si finalizado)", widget: string, required: false }
      - { name: ganador_numero, label: "Ganador — Número (sólo si finalizado)", widget: string, required: false, pattern: ['^\d{2}$', 'Dos dígitos'] }
      - { name: ganador_foto, label: "Ganador — Foto (opcional)", widget: image, required: false }

  - name: settings
    label: "⚙️ Configuración"
    files:
      - name: inicio
        label: "Página de inicio"
        file: src/content/settings/inicio.md
        format: yaml-frontmatter
        fields:
          - { name: tipo, widget: hidden, default: inicio }
          - { name: hero_eyebrow, label: "Hero — Eyebrow", widget: string }
          - { name: hero_titulo_linea1, label: "Hero — Línea 1", widget: string }
          - { name: hero_titulo_linea2, label: "Hero — Línea 2 (cursiva)", widget: string }
          - { name: hero_titulo_linea3, label: "Hero — Línea 3", widget: string }
          - { name: hero_titulo_linea3_palabra_dorada, label: "Hero — Palabra dorada de la línea 3", widget: string }
          - { name: hero_parrafo, label: "Hero — Párrafo", widget: text }
          - { name: hero_jersey_foto, label: "Hero — Camiseta que flota", widget: image }
          - { name: hero_stat_1_numero, label: "Stat 1 — Número", widget: string, hint: 'Ej: "+500"' }
          - { name: hero_stat_1_etiqueta, label: "Stat 1 — Etiqueta", widget: string, hint: 'Ej: "Clientes"' }
          - { name: hero_stat_2_numero, label: "Stat 2 — Número", widget: string, hint: 'Ej: "+1.2K"' }
          - { name: hero_stat_2_etiqueta, label: "Stat 2 — Etiqueta", widget: string, hint: 'Ej: "Camisetas"' }
          - { name: marquee, label: "Marquee superior — Mensajes", widget: list, field: { name: mensaje, widget: string } }
          - name: trust_bar
            label: "Trust bar (4 items)"
            widget: list
            min: 4
            max: 4
            fields:
              - { name: icono, widget: string }
              - { name: titulo, widget: string }
              - { name: subtitulo, widget: string }
          - { name: cinematic_titulo_linea1, label: "Banner cinemático — Línea 1", widget: string }
          - { name: cinematic_titulo_linea2, label: "Banner cinemático — Línea 2", widget: string }
          - { name: cinematic_subtitulo, label: "Banner cinemático — Subtítulo", widget: text }
          - { name: cinematic_imagen, label: "Banner cinemático — Imagen de fondo", widget: image }
          - { name: cinematic_cta_texto, label: "Banner cinemático — Texto botón", widget: string, default: "Pedir mi camiseta" }
          - name: steps
            label: "Cómo comprar (3 pasos)"
            widget: list
            min: 3
            max: 3
            fields:
              - { name: numero, widget: string }
              - { name: titulo, widget: string }
              - { name: texto, widget: text }
          - { name: personalizer_titulo, label: "Personalizador — Título", widget: string }
          - { name: personalizer_nombre_default, label: "Personalizador — Nombre por defecto", widget: string, default: "CAMPEÓN" }
          - { name: personalizer_dorsal_default, label: "Personalizador — Dorsal por defecto", widget: string, default: "10" }
          - { name: personalizer_precio_extra, label: "Personalizador — Precio extra (€)", widget: number, value_type: int, default: 12 }
          - { name: sorteo_seccion_visible, label: "Mostrar sección de sorteos en la web", widget: boolean, default: true, hint: "Si lo desactivas, la sección Sorteo entera (incluido 'Sorteos anteriores') desaparece de la home, aunque haya datos guardados." }

      - name: contacto
        label: "Contacto y plantillas WhatsApp"
        file: src/content/settings/contacto.md
        format: yaml-frontmatter
        fields:
          - { name: tipo, widget: hidden, default: contacto }
          - { name: whatsapp, label: "Número WhatsApp", widget: string, pattern: ['^\d{8,15}$', 'Solo dígitos, formato internacional sin "+"'], hint: 'Ej: 34600000000' }
          - { name: instagram, label: "Usuario Instagram", widget: string, hint: "Sin @" }
          - { name: email, label: "Email", widget: string, required: false, hint: "Vacío hasta tener uno real. Si vacío, no se muestra en el footer." }
          - { name: tiktok, label: "Usuario TikTok (opcional)", widget: string, required: false }
          - { name: footer_descripcion, label: "Footer — Descripción de la marca", widget: text }
          - { name: footer_anio, label: "Footer — Año copyright", widget: number, value_type: int }
          - { name: template_camiseta, label: "Plantilla — Pedir camiseta", widget: text, hint: "Variables: {nombre}, {equipo}, {precio}, {talla}" }
          - { name: template_personalizacion, label: "Plantilla — Personalización", widget: text, hint: "Variables: {nombre}, {dorsal}, {talla}" }
          - { name: template_sorteo, label: "Plantilla — Reservar nº sorteo", widget: text, hint: "Variables: {numero}, {titulo_sorteo}, {precio}" }
          - { name: template_favoritos, label: "Plantilla — Pedir favoritos", widget: text, hint: "Variable: {lista}" }
          - { name: template_generico, label: "Plantilla — Mensaje genérico (FAB)", widget: string }
```

> ✅ Username `CORTADE` already baked in from Task 0.

- [ ] **Step 4: Smoke-test local (no OAuth yet)**

Run: `npm run dev`
Navigate to: `http://localhost:4321/admin/`
Expected: Sveltia loads, shows "Login with GitHub" button. **Don't click login** — the OAuth app doesn't exist yet. Verify the UI shows the 3 collections (Camisetas, Sorteos, Configuración).

- [ ] **Step 5: Commit**

```bash
git add public/admin/
git commit -m "feat(cms): Sveltia bootstrap + config.yml"
```

### Task 32: `netlify.toml`

**Files:**
- Create: `netlify.toml`

- [ ] **Step 1: Write the file**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/admin"
  to = "/admin/index.html"
  status = 200

[[headers]]
  for = "/admin/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
```

- [ ] **Step 2: Commit**

```bash
git add netlify.toml
git commit -m "chore: netlify build configuration"
```

### Task 33: 🛑 CHECKPOINT 2 — CMS local review

- [ ] **Step 1: Tell user**

> 🛑 **Checkpoint 2.** Sveltia CMS configurado en local. Abre `http://localhost:4321/admin/` y verifica que aparece:
> 1. Botón "Login with GitHub" (NO le des; el OAuth todavía no existe)
> 2. En la barra lateral: "🎽 Camisetas", "🎰 Sorteos", "⚙️ Configuración"
> 3. La interfaz se ve bien (no errores de YAML en la consola del navegador)
>
> Si todo OK, dime ✅ y pasamos a deploy. Si ves algún error, ✏️ y lo ajusto.

- [ ] **Step 2: Apply fixes loop**

---

## PART 11 — Deploy

### Task 34: User creates empty GitHub repo

- [ ] **Step 1: Instruct the user**

> Para subir el código necesitas un repo vacío en GitHub. Hazlo así (te lleva 30 segundos):
> 1. Entra a https://github.com/new
> 2. Repository name: **`camisetas-fq`**
> 3. Description: "Tienda de camisetas de fútbol"
> 4. **Public** (Recommended para usar el plan gratuito de Netlify sin restricciones)
> 5. **NO marques** "Add a README", "Add .gitignore", ni "Choose a license" (el repo debe estar VACÍO)
> 6. Pulsa "Create repository"
> 7. Dime cuando esté creado.

- [ ] **Step 2: Wait for confirmation**

- [ ] **Step 3: Verify `public/admin/config.yml` already points to the right repo**

The username `CORTADE` was already written in Task 31. Verify:
```bash
grep "repo:" public/admin/config.yml
```
Expected output: `  repo: CORTADE/camisetas-fq`

If for any reason it shows the placeholder instead, fix:
```bash
sed -i 's|<GITHUB_USERNAME>|CORTADE|' public/admin/config.yml
git add public/admin/config.yml
git commit -m "chore: configure CMS repo target"
```

### Task 35: Push to GitHub

- [ ] **Step 1: Add remote**

```bash
git remote add origin https://github.com/CORTADE/camisetas-fq.git
```

- [ ] **Step 2: Push**

```bash
git push -u origin main
```

If this requires GitHub authentication (browser prompt or PAT), pause and ask the user to authenticate. After success:

- [ ] **Step 3: Verify on github.com**

Ask the user to open `https://github.com/CORTADE/camisetas-fq` and confirm the files are there.

### Task 36: Connect Netlify

- [ ] **Step 1: Instruct the user**

> Conectemos Netlify:
> 1. Entra a https://app.netlify.com/signup → "GitHub" → autoriza
> 2. Una vez dentro: "Add new site" → "Import an existing project"
> 3. Selecciona "GitHub" → autoriza Netlify a leer tus repos
> 4. Selecciona `camisetas-fq`
> 5. Build settings: deberían autorellenarse como:
>    - Build command: `npm run build`
>    - Publish directory: `dist`
> 6. Pulsa "Deploy site"
> 7. Espera ~90 segundos a que termine el primer deploy
> 8. Cuando termine, ve a "Site settings" → "Change site name" → escribe `camisetas-fq`
> 9. Pásame la URL final (será `https://camisetas-fq.netlify.app`)

- [ ] **Step 2: Wait for confirmation**

### Task 37: 🛑 CHECKPOINT 3 — web online review

- [ ] **Step 1: Tell user**

> 🛑 **Checkpoint 3.** Abre https://camisetas-fq.netlify.app/ y verifica:
> 1. ¿Se ve igual que en local?
> 2. ¿Las imágenes cargan?
> 3. ¿Los enlaces de WhatsApp abren con el número correcto y mensaje pre-rellenado?
> 4. ¿Lighthouse Performance ≥ 90? (Chrome DevTools → Lighthouse → Generate report, móvil)
>
> Si todo OK, último paso: activar el login de GitHub para el CMS.

### Task 38: GitHub OAuth + Sveltia register

- [ ] **Step 1: Create OAuth App in GitHub**

Instruct the user:
> 1. Entra a https://github.com/settings/developers → "OAuth Apps" → "New OAuth App"
> 2. Rellena:
>    - **Application name:** `Camisetas FQ Admin`
>    - **Homepage URL:** `https://camisetas-fq.netlify.app`
>    - **Authorization callback URL:** `https://sveltia-cms-auth.netlify.app/callback`
> 3. Pulsa "Register application"
> 4. En la página siguiente, pulsa "Generate a new client secret"
> 5. **Copia y guárdame** el Client ID y el Client Secret (tipo `Iv1.xxxxxxx` y un hex largo). NO los pegues aquí en el chat; guárdalos en un sitio seguro como tu gestor de contraseñas y avísame cuando los tengas.

- [ ] **Step 2: Register Client ID/Secret in Sveltia's public proxy**

> Ahora vas a registrar tu Client ID/Secret en el proxy público:
> 1. Visita https://sveltia-cms-auth.netlify.app (sin path, página principal)
> 2. Sigue las instrucciones que muestre (suele ser pegar Client ID + Secret en un form, recibirás confirmación inmediata)
>
> Si la URL/proceso ha cambiado, dimelo y miro la doc actualizada: https://github.com/sveltia/sveltia-cms-auth

- [ ] **Step 3: Test login**

> Ve a https://camisetas-fq.netlify.app/admin/ → pulsa "Login with GitHub" → autoriza la app → debe entrar al panel.
> Si no funciona, dime el error exacto que ves (en el navegador y en la consola DevTools).

### Task 39: End-to-end validation

- [ ] **Step 1: Editor edits a price from /admin**

Guide the user:
> Para validar el flujo completo:
> 1. En `/admin`, abre cualquier camiseta (ej. "Final Lisboa 2014")
> 2. Cambia el precio (ej. de 69 → 70)
> 3. Pulsa "Save"
> 4. Sveltia hará un commit a GitHub automáticamente
> 5. Netlify detectará el commit y reconstruirá (~60s — verás el progreso en https://app.netlify.com)
> 6. Refresca https://camisetas-fq.netlify.app/ → debe mostrar 70€

Wait for confirmation.

- [ ] **Step 2: Verify all "Done" criteria from spec section 16**

Run through the 9 done-criteria from spec section 16 with the user. Note any gaps as follow-up tasks.

- [ ] **Step 3: Tag v1**

```bash
git tag -a v1.0.0 -m "Camisetas FQ v1.0.0 — first production release"
git push origin v1.0.0
```

- [ ] **Step 4: Celebrate 🎉**

---

## Done criteria recap (from spec §16)

Cross off each as the user verifies during Task 39:

- [ ] Home pública pixel-perfect vs `index.html`
- [ ] Mobile ≤768px: hamburger funciona, sin scroll horizontal
- [ ] Editor edita precio en `/admin`, cambio en producción <90s
- [ ] Editor crea nuevo sorteo, lo marca activo, aparece en home
- [ ] Cualquier "Pedir"/"Reservar" abre WhatsApp con mensaje correcto
- [ ] Favoritos: marca 3, refresca, siguen; drawer abre, "Pedir todas" funciona
- [ ] Sorteo: click en número disponible → CTA → WhatsApp con número+título
- [ ] Lighthouse Performance ≥ 90 (móvil)
- [ ] Cero errores en consola producción

---

## Notes for the implementing engineer

- **YAGNI:** no añadir Tailwind, no añadir frameworks, no añadir image optimization. Si el CSS de `global.css` cubre el caso, no escribir CSS nuevo salvo donde el plan lo indique.
- **DRY:** todas las URLs `wa.me` se construyen con `buildWaUrl()` del lib. Todas las plantillas se renderizan con `renderTemplate()`.
- **TDD:** sólo aplica al directorio `src/lib/`. Los componentes Astro y los scripts del cliente se prueban visualmente en los checkpoints.
- **Commits frecuentes:** un commit por tarea (o más). Mensajes en formato Conventional Commits.
- **NO commits con `--no-verify`**, NO `git push --force`.
- **Checkpoints son bloqueantes:** detener ejecución y esperar OK humano explícito antes de continuar.
