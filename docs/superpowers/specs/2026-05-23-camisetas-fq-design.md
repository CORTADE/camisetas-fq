# Camisetas FQ — Diseño técnico

**Fecha:** 2026-05-23
**Autor:** Roberto Cortade (con asistencia de Claude)
**Estado:** Borrador para revisión final antes de implementación

---

## 0. Resumen ejecutivo

Tienda/web estática de camisetas de fútbol con:
- **Frontend:** Astro 5 (HTML estático), CSS heredado tal cual del `index.html` actual (sin Tailwind).
- **Compras:** flujo 100% WhatsApp (sin carrito real, sin pasarela de pago). Cada producto, cada número de sorteo, cada lista de favoritos genera un enlace `wa.me` con mensaje pre-rellenado.
- **CMS:** Sveltia CMS en `/admin/`, login con cuenta GitHub, contenido guardado como Markdown en el propio repo. Editor (hermano del propietario, no programador) edita: camisetas, sorteos, textos del home, datos de contacto, plantillas WhatsApp.
- **Hosting:** Netlify (plan gratis). Subdominio `camisetas-fq.netlify.app` de salida; dominio propio se conectará más adelante.
- **Persistencia de favoritos:** `localStorage` del navegador del visitante. Sin cuentas, sin login para visitantes.

## 1. Stack y decisiones

| Decisión | Elección | Motivo |
|---|---|---|
| Framework | Astro 5 | HTML estático, build rápido, cero JS innecesario, integración nativa con Netlify y Content Collections con validación TypeScript. |
| CMS | Sveltia CMS | Mantenido en 2026, UX muy superior a Decap, compatible con `config.yml` de Decap (migración trivial si hiciera falta). |
| Login CMS | GitHub OAuth via proxy público `sveltia-cms-auth.netlify.app` | Netlify Identity está deprecated para sitios nuevos. GitHub OAuth + proxy público = setup en 5 minutos. |
| Hosting | Netlify free | Deploy automático en cada push, build hooks gratis, integración Sveltia nativa. |
| CSS | Inline desde `index.html` actual | Garantiza paridad 100% con el diseño aprobado. Sin reescribir nada. |
| TypeScript | Solo en `src/content/config.ts` (schemas) y `src/lib/` | Validación de contenido en build time. No TS en componentes para simplicidad. |
| Imágenes | `public/imagenes/` (las 12 iniciales) + `public/uploads/` (las que suba el CMS) | Servidas tal cual, sin pipeline de optimización en v1 (se puede añadir Astro `<Image>` en v2 si hace falta). |
| Compras | Solo WhatsApp con plantillas editables | Coincide con el modelo actual del negocio. |

## 2. Estructura de carpetas

```
camisetas-fq/
├── public/
│   ├── imagenes/                    # 12 fotos iniciales (movidas desde ./imagenes/)
│   ├── uploads/                     # Imágenes subidas desde el CMS (vacío al inicio)
│   ├── admin/
│   │   ├── index.html               # Bootstrap de Sveltia CMS
│   │   └── config.yml               # Config del CMS (colecciones, campos)
│   └── favicon.svg
│
├── src/
│   ├── content/
│   │   ├── config.ts                # Schemas Zod de TODAS las colecciones
│   │   ├── camisetas/               # 10 archivos .md pre-poblados
│   │   ├── sorteos/                 # 1 archivo demo pre-poblado
│   │   └── settings/
│   │       ├── inicio.md            # Textos del home (hero, marquee, trust, cinematic, steps)
│   │       └── contacto.md          # Contacto + plantillas WhatsApp
│   │
│   ├── components/
│   │   ├── Loader.astro
│   │   ├── TopMarquee.astro
│   │   ├── Nav.astro                # Responsive: hamburguesa en mobile
│   │   ├── Hero.astro
│   │   ├── TrustBar.astro
│   │   ├── Coleccion.astro
│   │   ├── ProductCard.astro
│   │   ├── CinematicBanner.astro
│   │   ├── SorteoSection.astro
│   │   ├── SorteoGrid.astro
│   │   ├── SorteosAnteriores.astro
│   │   ├── Steps.astro
│   │   ├── Personalizer.astro
│   │   ├── Footer.astro
│   │   ├── FloatingWhatsApp.astro
│   │   └── FavoritosDrawer.astro
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro
│   │
│   ├── styles/
│   │   └── global.css               # CSS extraído íntegramente de index.html + estilos responsive nuevos
│   │
│   ├── scripts/
│   │   ├── favoritos.js             # Lógica localStorage + drawer + badge
│   │   ├── sorteo-grid.js           # Grid interactivo 100 números
│   │   ├── countdown.js             # Countdown del sorteo
│   │   ├── reveal.js                # IntersectionObserver de scroll reveal
│   │   ├── nav-mobile.js            # Toggle del menú hamburguesa
│   │   └── personalizer.js          # Live preview del personalizador
│   │
│   ├── lib/
│   │   ├── whatsapp.ts              # renderTemplate(plantilla, vars) + helpers wa.me URL
│   │   └── sorteos.ts               # getSorteoActivo(), getSorteosFinalizados(), validateUnicoActivo()
│   │
│   └── pages/
│       └── index.astro              # Home: monta todos los componentes
│
├── astro.config.mjs
├── netlify.toml
├── package.json
├── tsconfig.json
├── .gitignore
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-05-23-camisetas-fq-design.md   # Este archivo
```

## 3. Content Collections — Schemas TypeScript

`src/content/config.ts`:

```typescript
import { defineCollection, z } from 'astro:content';

// ===================== CAMISETAS =====================
const camisetas = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    titulo: z.string(),
    equipo: z.string(),
    eyebrow: z.string().describe('Competición o liga, en mayúsculas. Ej: "UEFA CHAMPIONS LEAGUE"'),
    foto: z.string().describe('Ruta absoluta tipo /imagenes/jersey-x.jpg o /uploads/...'),
    precio: z.number().int().positive(),
    precio_anterior: z.number().int().positive().optional(),
    badge: z.object({
      texto: z.string(),
      color: z.enum(['gold', 'red-vintage', 'orange-last']).default('gold'),
    }).optional(),
    stock: z.boolean().default(true),
    tallas: z.array(z.enum(['S', 'M', 'L', 'XL', 'XXL'])).default(['S','M','L','XL','XXL']),
    destacada: z.boolean().default(false).describe('Si true, aparece en la sección "Colección Destacada" del home'),
    orden: z.number().int().default(100).describe('Orden de aparición entre las destacadas. Menor = primero'),
  }),
});

// ===================== SORTEOS =====================
const sorteos = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    titulo: z.string(),
    eyebrow: z.string(),
    descripcion: z.string(),
    imagen_fondo: z.string(),
    precio_numero: z.number().positive(),
    premio_descripcion: z.string(),
    estado: z.enum(['borrador', 'activo', 'finalizado']),
    tipo_finalizacion: z.enum(['por_fecha', 'por_completarse', 'por_fecha_o_completarse']),
    fecha_limite: z.coerce.date().optional()
      .describe('Obligatorio si tipo_finalizacion incluye "por_fecha"'),
    mensaje_whatsapp_custom: z.string().optional()
      .describe('Si vacío, usa la plantilla global de contacto.md. Variables: {numero}, {titulo_sorteo}, {precio}'),
    vendidos: z.array(z.object({
      numero: z.string().regex(/^\d{2}$/, '"00" a "99"'),
      comprador: z.string(),
    })).default([]),
    reservados: z.array(z.string().regex(/^\d{2}$/)).default([]),
    mostrar_timeline_vendidos: z.boolean().default(true)
      .describe('Si false, no se muestra la sección "EN DIRECTO · ÚLTIMOS PILLADOS" para este sorteo.'),
    ganador_nombre: z.string().optional(),
    ganador_numero: z.string().regex(/^\d{2}$/).optional(),
    ganador_foto: z.string().optional(),
  }).superRefine((data, ctx) => {
    if ((data.tipo_finalizacion === 'por_fecha' ||
         data.tipo_finalizacion === 'por_fecha_o_completarse')
        && !data.fecha_limite) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'fecha_limite es obligatoria para este tipo de finalización',
        path: ['fecha_limite'],
      });
    }
    if (data.estado === 'finalizado' && (!data.ganador_nombre || !data.ganador_numero)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Sorteo finalizado requiere ganador_nombre y ganador_numero',
        path: ['ganador_nombre'],
      });
    }
  }),
});

// ===================== SETTINGS =====================
const settings = defineCollection({
  type: 'content',
  schema: z.discriminatedUnion('tipo', [

    // settings/inicio.md
    z.object({
      tipo: z.literal('inicio'),
      hero_eyebrow: z.string(),
      hero_titulo_linea1: z.string(),
      hero_titulo_linea2: z.string(),
      hero_titulo_linea3: z.string(),
      hero_titulo_linea3_palabra_dorada: z.string()
        .describe('La palabra del final que va en color dorado. Ej: "MUNDO"'),
      hero_parrafo: z.string(),
      hero_jersey_foto: z.string().describe('Camiseta que flota en el hero'),
      hero_stat_1_numero: z.string().describe('Ej: "+500"'),
      hero_stat_1_etiqueta: z.string().describe('Ej: "Clientes"'),
      hero_stat_2_numero: z.string().describe('Ej: "+1.2K"'),
      hero_stat_2_etiqueta: z.string().describe('Ej: "Camisetas"'),
      marquee: z.array(z.string()).min(3),
      trust_bar: z.array(z.object({
        icono: z.string(),
        titulo: z.string(),
        subtitulo: z.string(),
      })).length(4),
      cinematic_titulo_linea1: z.string(),
      cinematic_titulo_linea2: z.string(),
      cinematic_subtitulo: z.string(),
      cinematic_imagen: z.string(),
      cinematic_cta_texto: z.string().default('Pedir mi camiseta'),
      steps: z.array(z.object({
        numero: z.string(),
        titulo: z.string(),
        texto: z.string(),
      })).length(3),
      personalizer_titulo: z.string(),
      personalizer_nombre_default: z.string().default('CAMPEÓN'),
      personalizer_dorsal_default: z.string().default('10'),
      personalizer_precio_extra: z.number().int().default(12),
      sorteo_seccion_visible: z.boolean().default(true)
        .describe('Toggle global: si false, la sección Sorteo (incluido el bloque "Sorteos anteriores") desaparece de la home, aunque haya sorteos activos o finalizados en el repo.'),
    }),

    // settings/contacto.md
    z.object({
      tipo: z.literal('contacto'),
      whatsapp: z.string().regex(/^\d{8,15}$/, 'Sólo dígitos, formato internacional sin "+". Ej: 34600000000'),
      instagram: z.string().describe('Sin @, solo el usuario'),
      email: z.union([z.string().email(), z.literal('')]).default('')
        .describe('Opcional. Vacío hasta tener email real. Si está vacío, el enlace de email no se muestra en el footer.'),
      tiktok: z.string().optional(),
      footer_descripcion: z.string(),
      footer_anio: z.number().int(),
      template_camiseta: z.string()
        .describe('Variables: {nombre}, {equipo}, {precio}, {talla}'),
      template_personalizacion: z.string()
        .describe('Variables: {nombre}, {dorsal}, {talla}'),
      template_sorteo: z.string()
        .describe('Variables soportadas: {numeros} (lista "#07, #22, #45"), {cantidad_texto} ("el número" o "los N números"), {total} (importe agregado en €), {titulo_sorteo}, {precio} (unitario). Alias retrocompat: {numero} = primer número del array sin "#". Diseñada para selección múltiple del lado del cliente; se envía la lista entera por WhatsApp y mi hermano marca vendidos/reservados después.'),
      template_favoritos: z.string()
        .describe('Variables: {lista} — se sustituye por bullets con cada camiseta'),
      template_generico: z.string()
        .describe('Mensaje del FAB y de los CTAs genéricos. Sin variables.'),
    }),

  ]),
});

export const collections = { camisetas, sorteos, settings };
```

## 4. Configuración Sveltia CMS

`public/admin/index.html` (3 líneas):
```html
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Camisetas FQ · Admin</title></head>
<body><script type="module" src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script></body></html>
```

`public/admin/config.yml` (extracto — el completo lo genero en implementación):
```yaml
backend:
  name: github
  repo: USUARIO/camisetas-fq          # Se rellena cuando el usuario cree el repo
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
          - { name: color, label: "Color", widget: select, options: [ {label: "Dorado", value: gold}, {label: "Rojo vintage", value: red-vintage}, {label: "Naranja última", value: orange-last} ], default: gold }
      - { name: stock, label: "Hay stock", widget: boolean, default: true }
      - { name: tallas, label: "Tallas disponibles", widget: select, multiple: true, options: [S, M, L, XL, XXL], default: [S, M, L, XL, XXL] }
      - { name: destacada, label: "Destacar en home", widget: boolean, default: false }
      - { name: orden, label: "Orden (menor = primero)", widget: number, value_type: int, default: 100 }
      - { name: body, label: "Descripción larga (opcional)", widget: markdown, required: false }

  - name: sorteos
    label: "🎰 Sorteos"
    folder: src/content/sorteos
    create: true
    fields:
      - { name: titulo, widget: string, hint: 'Frase principal. Se rompe en líneas según el diseño.' }
      - { name: eyebrow, widget: string }
      - { name: descripcion, widget: text }
      - { name: imagen_fondo, widget: image }
      - { name: precio_numero, widget: number, value_type: float, min: 0.5, default: 1 }
      - { name: premio_descripcion, widget: string }
      - name: estado
        widget: select
        options:
          - { label: "📝 Borrador (no se muestra)", value: borrador }
          - { label: "🟢 Activo (sólo uno a la vez — el resto vuelve a borrador)", value: activo }
          - { label: "🏁 Finalizado", value: finalizado }
        default: borrador
      - name: tipo_finalizacion
        widget: select
        options:
          - { label: "Por fecha límite", value: por_fecha }
          - { label: "Al completar los 100 números", value: por_completarse }
          - { label: "Por fecha O al completarse (lo primero que ocurra)", value: por_fecha_o_completarse }
      - { name: fecha_limite, widget: datetime, required: false, hint: 'Obligatorio si el tipo incluye fecha' }
      - { name: mensaje_whatsapp_custom, widget: text, required: false, hint: 'Vacío = usa el global de contacto.md. Variables: {numero}, {titulo_sorteo}, {precio}' }
      - name: vendidos
        label: "Números vendidos"
        label_singular: "Venta"
        widget: list
        hint: 'Sólo añade los que se hayan vendido. El resto son automáticamente "disponibles".'
        fields:
          - { name: numero, widget: string, pattern: ['^\\d{2}$', 'Dos dígitos: 00–99'] }
          - { name: comprador, widget: string }
      - name: reservados
        label: "Números reservados (pendientes de pago)"
        widget: list
        field: { name: numero, widget: string, pattern: ['^\\d{2}$', 'Dos dígitos: 00–99'] }
      - { name: mostrar_timeline_vendidos, label: "Mostrar lista de últimos pillados en directo", widget: boolean, default: true, hint: "Si desactivado, no se muestra la sección 'EN DIRECTO · ÚLTIMOS PILLADOS' para este sorteo." }
      - { name: ganador_nombre, widget: string, required: false }
      - { name: ganador_numero, widget: string, required: false, pattern: ['^\\d{2}$', 'Dos dígitos'] }
      - { name: ganador_foto, widget: image, required: false }

  - name: settings
    label: "⚙️ Configuración"
    files:
      - name: inicio
        label: "Página de inicio"
        file: src/content/settings/inicio.md
        fields:
          - { name: tipo, widget: hidden, default: inicio }
          - { name: hero_eyebrow, label: "Eyebrow del hero", widget: string }
          - { name: hero_titulo_linea1, widget: string }
          - { name: hero_titulo_linea2, widget: string }
          - { name: hero_titulo_linea3, widget: string }
          - { name: hero_titulo_linea3_palabra_dorada, widget: string, hint: "La palabra del final que aparece en dorado" }
          - { name: hero_parrafo, widget: text }
          - { name: hero_jersey_foto, widget: image }
          - { name: hero_stat_1_numero, label: "Stat 1 — Número", widget: string, hint: 'Ej: "+500"' }
          - { name: hero_stat_1_etiqueta, label: "Stat 1 — Etiqueta", widget: string, hint: 'Ej: "Clientes"' }
          - { name: hero_stat_2_numero, label: "Stat 2 — Número", widget: string, hint: 'Ej: "+1.2K"' }
          - { name: hero_stat_2_etiqueta, label: "Stat 2 — Etiqueta", widget: string, hint: 'Ej: "Camisetas"' }
          - { name: marquee, label: "Mensajes del marquee superior", widget: list, field: { name: mensaje, widget: string } }
          - { name: sorteo_seccion_visible, label: "Mostrar sección de sorteos en la web", widget: boolean, default: true, hint: "Si lo desactivas, la sección Sorteo entera (incluido 'Sorteos anteriores') desaparece de la home, aunque haya datos guardados." }
          # ... resto de campos de inicio (trust_bar, cinematic, steps, personalizer)

      - name: contacto
        label: "Contacto y plantillas WhatsApp"
        file: src/content/settings/contacto.md
        fields:
          - { name: tipo, widget: hidden, default: contacto }
          - { name: whatsapp, label: "Número WhatsApp", widget: string, pattern: ['^\\d{8,15}$', 'Solo dígitos, formato internacional sin "+"'] }
          - { name: instagram, label: "Usuario Instagram", widget: string, hint: "Sin @" }
          - { name: email, label: "Email", widget: string, required: false, hint: "Puedes dejarlo vacío hasta tener uno. Si vacío, no se muestra el enlace en el footer." }
          - { name: tiktok, widget: string, required: false }
          # ... templates whatsapp y resto
```

**Sobre "único sorteo activo":** Sveltia no valida cross-file. Estrategia:
1. El select de `estado` lleva un `hint` explícito.
2. `src/lib/sorteos.ts` exporta `getSorteoActivo()`: filtra por `estado === 'activo'`, ordena por `data.fecha_limite` ascendente, devuelve el primero.
3. Si detecta más de uno, escribe `console.warn` en build (visible en logs Netlify) y `console.warn` runtime. En desarrollo (`import.meta.env.DEV`), pinta un banner rojo flotante: *"⚠️ Hay 2 sorteos activos: X, Y. Solo se muestra X."*

## 5. Datos pre-poblados — 10 camisetas

Las 6 primeras vienen literalmente del HTML actual. Las 4 últimas son entradas razonables basadas en los nombres de archivo de las imágenes restantes; el editor puede ajustar libremente.

### 5.1 `src/content/camisetas/lisboa-2014.md`
```yaml
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

### 5.2 `src/content/camisetas/moscu-2008.md`
```yaml
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

### 5.3 `src/content/camisetas/francia-98-zidane.md`
```yaml
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

### 5.4 `src/content/camisetas/barcelona-kappa.md`
```yaml
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

### 5.5 `src/content/camisetas/psg-jordan.md`
```yaml
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

### 5.6 `src/content/camisetas/brasil-2021-la-10.md`
```yaml
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

### 5.7 `src/content/camisetas/arsenal-highbury.md` *(plausible — basado en imagen `jersey-arsenal-o2.jpg`)*
```yaml
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

### 5.8 `src/content/camisetas/portugal-2016.md` *(plausible — basado en `jersey-portugal-17.jpg`)*
```yaml
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

### 5.9 `src/content/camisetas/spain-2010.md` *(plausible — basado en `jersey-spain-2010.jpg`)*
```yaml
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

### 5.10 `src/content/camisetas/cordoba-cf.md` *(plausible — basado en `jersey-cordoba.jpg`)*
```yaml
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

> **Nota al editor:** los datos de las camisetas 5.7-5.10 son sugerencias. Cualquier campo se puede editar desde `/admin` y los cambios se publican solos.

## 6. Sorteo demo pre-poblado

`src/content/sorteos/mundial-2026-espana.md`:

```yaml
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

## 7. Settings pre-poblados

### `src/content/settings/inicio.md`
```yaml
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

### `src/content/settings/contacto.md`
```yaml
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

## 8. Componentes Astro — props y responsabilidades

| Componente | Props (TypeScript) | Responsabilidad |
|---|---|---|
| `BaseLayout.astro` | `{ title?: string }` | `<html>`, `<head>`, preconnect fonts, `global.css`, slot del contenido, monta `Loader`, `FavoritosDrawer`, `FloatingWhatsApp` |
| `Loader.astro` | — | Loader inicial con escudo girando + texto "FUTBOL QUALITY". `Loader.gone` se aplica desde `BaseLayout` via inline script en window load |
| `TopMarquee.astro` | `{ mensajes: string[] }` | Renderiza 2x los mensajes (loop infinito) |
| `Nav.astro` | `{ favoritosBadge?: boolean }` | Desktop: logo + menú + ♡. Mobile (≤768px): logo + ☰ + ♡. El ☰ abre un overlay full-screen con los enlaces del menú. ♡ siempre dispara `window.dispatchEvent('open-favoritos')` |
| `Hero.astro` | `{ data: InferredFromSettings['inicio'] }` | Texto + camiseta flotante + 2 stats overlays leídos de `data.hero_stat_1_*` y `data.hero_stat_2_*` |
| `TrustBar.astro` | `{ items: TrustItem[] }` | Grid 4 columnas (desktop) → stack (mobile) |
| `Coleccion.astro` | `{ camisetas: Camiseta[], templates: Templates, whatsapp: string }` | Filtra `destacada === true`, ordena por `orden`, mapea a `ProductCard` |
| `ProductCard.astro` | `{ camiseta: Camiseta, templates: Templates, whatsapp: string }` | Renderiza tarjeta. Click abre `wa.me` con `template_camiseta` rellenado. Botón ♡ marca/desmarca favorito (lee/escribe localStorage vía `scripts/favoritos.js`) |
| `CinematicBanner.astro` | `{ data: CinematicData, whatsapp: string, templateGenerico: string }` | Banner con `background-image` + título + CTA |
| `SorteoSection.astro` | `{ sorteo: Sorteo, finalizados: Sorteo[], templates: Templates, whatsapp: string, seccionVisible: boolean }` | Si `seccionVisible === false` → no renderiza nada (toggle global de `inicio.sorteo_seccion_visible`). Si `sorteo === null` y `finalizados.length === 0` → no renderiza. Renderiza texto + countdown (si aplica) + barra progreso (si aplica) + timeline "últimos pillados" (solo si `sorteo.mostrar_timeline_vendidos === true`) + `SorteoGrid` + bloque CTA (grid-cta-wrap) con texto dinámico + botón "Limpiar selección" + `SorteosAnteriores` al final. Selección **múltiple cliente-side**: el script (`sorteo-grid.js`) mantiene un `Set` de números marcados en local, calcula el total = `size × precio_numero`, abre un mensaje WhatsApp con todos los números y limpia la selección al pulsar. No persiste en CMS (el editor marca vendidos/reservados manualmente). |
| `SorteoGrid.astro` | `{ vendidos: Venta[], reservados: string[], sorteoSlug: string }` | Hace render server-side de 100 celdas con la clase inicial correcta. Cliente carga `scripts/sorteo-grid.js` que añade interactividad |
| `SorteosAnteriores.astro` | `{ sorteos: SorteoFinalizado[] }` | Grid horizontal scroll con ganadores. Si lista vacía → no renderiza |
| `Steps.astro` | `{ steps: Step[] }` | 3 columnas → stack en mobile |
| `Personalizer.astro` | `{ data: PersonalizerData, templates: Templates, whatsapp: string }` | Live preview con inputs. `scripts/personalizer.js` actualiza el DOM. CTA usa `template_personalizacion` |
| `Footer.astro` | `{ contacto: Contacto, descripcion: string, anio: number }` | CTA WhatsApp + grid 4 columnas + bottom bar. Si `contacto.email === ''`, no se renderiza el enlace de email |
| `FloatingWhatsApp.astro` | `{ whatsapp: string, templateGenerico: string }` | FAB inferior derecho, siempre visible |
| `FavoritosDrawer.astro` | `{ camisetas: Camiseta[], templates: Templates, whatsapp: string }` | Renderiza el drawer server-side con TODAS las camisetas + sus datos en `data-*` attributes. `scripts/favoritos.js` lo abre, filtra por los slugs guardados en localStorage, pinta solo las activas. CTA "Pedir todas" arma mensaje con `template_favoritos` |

### Composición en `src/pages/index.astro`
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getCollection, getEntry } from 'astro:content';
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
import { getSorteoActivo, getSorteosFinalizados } from '../lib/sorteos';

const inicio = (await getEntry('settings', 'inicio')).data;
const contacto = (await getEntry('settings', 'contacto')).data;
const camisetas = await getCollection('camisetas');
const sorteos = await getCollection('sorteos');
const sorteoActivo = getSorteoActivo(sorteos);
const sorteosFinalizados = getSorteosFinalizados(sorteos);
---
<BaseLayout title="Camisetas FQ · Futbol Quality">
  <TopMarquee mensajes={inicio.marquee} />
  <Nav />
  <Hero data={inicio} />
  <TrustBar items={inicio.trust_bar} />
  <Coleccion camisetas={camisetas} templates={contacto} whatsapp={contacto.whatsapp} />
  <CinematicBanner data={inicio} whatsapp={contacto.whatsapp} templateGenerico={contacto.template_generico} />
  <SorteoSection sorteo={sorteoActivo} finalizados={sorteosFinalizados} templates={contacto} whatsapp={contacto.whatsapp} />
  <Steps steps={inicio.steps} />
  <Personalizer data={inicio} templates={contacto} whatsapp={contacto.whatsapp} />
  <Footer contacto={contacto} descripcion={contacto.footer_descripcion} anio={contacto.footer_anio} />
</BaseLayout>
```

## 9. Comportamientos JavaScript del cliente

| Script | Responsabilidad | Trigger |
|---|---|---|
| `favoritos.js` | Toggle ♡ en tarjetas, actualiza badge nav, abre/cierra drawer, escucha `'open-favoritos'`, persiste en `localStorage['camisetas-fq:favoritos']` (array de slugs). Emite `'favoritos-changed'` cuando cambia | Carga al hacer `DOMContentLoaded` |
| `sorteo-grid.js` | Selección múltiple: click en celda `.avail` la añade al `Set` `selectedNumbers`; click en `.selected` la quita (toggle). El bloque CTA muestra: 0 → oculto; 1 → "Has elegido el número #XX"; 2+ → "Has elegido N números: #X, #Y · Total: N€". Botón "Limpiar selección" vacía el Set. Botón principal abre `wa.me` con `template_sorteo` renderizado vía `renderSorteoTemplate()` (lógica replicada inline desde `lib/whatsapp.ts`) y **limpia la selección automáticamente** tras abrir el chat. | Solo carga si existe `#grid100` |
| `countdown.js` | Lee `data-fecha-limite` del DOM y actualiza cada segundo | Solo si existe `#cd` |
| `reveal.js` | `IntersectionObserver` añade `.in` a `.reveal` | Siempre |
| `nav-mobile.js` | Toggle `.nav-open` al pulsar ☰ | Siempre |
| `personalizer.js` | `oninput` en `#iname` y `#inum` actualiza `#pname` y `#pnum`. Click en `pers-add` → wa.me con template_personalizacion | Solo si existe `.personalizer` |

Todos se cargan con `<script>` al final del body. Sin frameworks. Sin bundler aparte del que ya trae Astro.

## 10. Responsive — breakpoints

| Breakpoint | Cambios |
|---|---|
| `≤ 1024px` | Hero pasa a 1 columna (texto arriba, jersey abajo). Sorteo pasa a 1 columna. |
| `≤ 768px` | Nav menú principal oculto; aparece ☰. Productos grid 2 col. Footer grid 2 col. Steps stack vertical. Personalizer stack. Trust bar wrap. |
| `≤ 480px` | Productos 1 col. Hero h1 reducido. Hero stats absolutos pasan a inline. Sorteo grid 100 mantiene 10x10 (cada celda ~30px). |

El CSS original ya define `@media (max-width: 1024px)` y `@media (max-width: 768px)`. Lo ampliamos para 480px y para el menú hamburguesa.

## 11. Migración de imágenes

```
Antes:                          Después:
./imagenes/                     ./public/imagenes/
  jersey-arsenal-o2.jpg           jersey-arsenal-o2.jpg
  jersey-barcelona-kappa.jpg      jersey-barcelona-kappa.jpg
  ... (12 archivos)               ... (mismos 12 archivos)
                                ./public/uploads/  (vacío, para CMS)
```

Referencias:
- En `.md`: `foto: /imagenes/jersey-x.jpg`
- En componentes: `<img src={camiseta.data.foto}>`
- Subidas nuevas desde CMS: van a `/uploads/`, mismo formato de referencia

Sin Astro `<Image>` en v1 (no hay procesamiento). Si más adelante hace falta optimización (WebP, srcset, lazy), se migra en una iteración corta sin tocar contenido.

## 12. Deploy — pasos

### Fase A · GitHub
1. Usuario crea `camisetas-fq` en github.com (vacío, sin README)
2. Asistente ejecuta `git init && git add . && git commit -m "..." && git remote add origin ... && git push -u origin main`
3. Verificación: usuario abre el repo en github.com y ve los archivos

### Fase B · Netlify
1. Usuario crea cuenta Netlify con GitHub (1 clic)
2. "Import existing project" → autoriza Netlify a leer repos → selecciona `camisetas-fq`
3. Build settings autodetectados (Astro):
   - Build command: `npm run build`
   - Publish: `dist`
   - Node version: 20
4. Deploy. Sitio en `<random>.netlify.app` en ~90 segundos
5. Site settings → Change site name → `camisetas-fq`

### Fase C · GitHub OAuth para Sveltia
1. GitHub → Settings → Developer settings → OAuth Apps → New
   - Name: `Camisetas FQ Admin`
   - Homepage: `https://camisetas-fq.netlify.app`
   - Callback: `https://sveltia-cms-auth.netlify.app/callback`
2. Guarda Client ID + Client Secret
3. Visita `https://sveltia-cms-auth.netlify.app/register` (la URL real la verificamos en docs Sveltia el día de implementación), registra el Client ID/Secret
4. Editor entra a `https://camisetas-fq.netlify.app/admin/` → Login with GitHub → autoriza → CMS funciona

### Fase D · Validación end-to-end
1. Editor edita un precio desde `/admin`, pulsa Save
2. Sveltia hace commit en el repo
3. Netlify detecta push, builda, publica (~60s)
4. Editor refresca la web pública y ve el cambio

## 13. Orden de ejecución (tareas)

| # | Paso | Responsable | Estimado |
|---|---|---|---|
| 1 | `npm create astro@latest` → minimal, TS strict | Asistente | 5 min |
| 2 | Mover `./imagenes/` → `./public/imagenes/` | Asistente | 1 min |
| 3 | Crear `src/styles/global.css` con CSS extraído de `index.html` | Asistente | 5 min |
| 4 | Crear `BaseLayout.astro` (head, fonts, css, slot, scripts globales) | Asistente | 5 min |
| 5 | Definir `src/content/config.ts` (schemas Zod completos) | Asistente | 15 min |
| 6 | Crear los 10 .md de camisetas | Asistente | 10 min |
| 7 | Crear `sorteos/mundial-2026-espana.md` + 2 settings (`inicio.md`, `contacto.md`) | Asistente | 8 min |
| 8 | Componentes: Loader, TopMarquee, Nav, Hero, TrustBar, Coleccion, ProductCard | Asistente | 40 min |
| 9 | Componentes: CinematicBanner, SorteoSection, SorteoGrid, SorteosAnteriores | Asistente | 30 min |
| 10 | Componentes: Steps, Personalizer, Footer, FloatingWhatsApp, FavoritosDrawer | Asistente | 25 min |
| 11 | `lib/whatsapp.ts` (renderTemplate, buildWaUrl) + `lib/sorteos.ts` | Asistente | 15 min |
| 12 | Scripts cliente: favoritos.js, sorteo-grid.js, countdown.js, reveal.js, nav-mobile.js, personalizer.js | Asistente | 30 min |
| 13 | Ensamblar `src/pages/index.astro` | Asistente | 5 min |
| 14 | Estilos responsive nuevos (menú hamburguesa, 480px breakpoint) | Asistente | 15 min |
| 15 | **Checkpoint 1:** `npm run dev`, revisión visual con el usuario contra `index.html` | Usuario + Asistente | 15 min |
| 16 | Sveltia: `public/admin/index.html` + `public/admin/config.yml` completo | Asistente | 20 min |
| 17 | **Checkpoint 2:** probar CMS local en `localhost:4321/admin/` (modo local sin auth) | Asistente | 5 min |
| 18 | `astro.config.mjs`, `netlify.toml`, `.gitignore` | Asistente | 5 min |
| 19 | Usuario crea repo GitHub vacío `camisetas-fq` | Usuario | 2 min |
| 20 | Asistente: git init, commit, push | Asistente | 3 min |
| 21 | Usuario conecta Netlify | Usuario (guiado) | 10 min |
| 22 | **Checkpoint 3:** web online en Netlify, revisión visual | Usuario + Asistente | 5 min |
| 23 | GitHub OAuth App + registro en Sveltia proxy | Usuario (guiado) | 10 min |
| 24 | **Validación final:** editar una camiseta desde /admin en producción, verificar publicación | Usuario + Asistente | 5 min |

**Total:** ~3h 50min asistente + ~30min usuario en pasos compartidos.

## 14. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| **Sveltia proxy público cae o cambia de URL** | Baja | Alto: editor no puede entrar al CMS | (1) Documentar la URL alternativa de docs Sveltia. (2) En 30 min se puede desplegar nuestro propio proxy en Netlify Functions (código está en repo Sveltia, abierto). |
| **Editor marca 2 sorteos como "activo"** | Media | Medio: solo se muestra uno, el otro queda "oculto" sin avisar | (1) Hint explícito en el campo del CMS. (2) Banner rojo en `/admin` local + warn en consola. (3) En la página `/admin` añadir un panel custom que verifique al cargar. |
| **El editor escribe `:` o `,` raros en un nombre de comprador y rompe el YAML** | Media | Alto: build falla, web no se actualiza | Sveltia escribe YAML válido automáticamente (escapa lo que haga falta). El riesgo real es si el editor toca el `.md` directamente; con el CMS está protegido. |
| **Faltan o sobran campos en un `.md` editado a mano** | Baja | Medio: build falla | El schema Zod valida en build. Netlify muestra error claro en su log y mantiene el deploy anterior funcionando. La web pública nunca queda "rota". |
| **Imagen muy pesada subida desde el CMS (>5MB)** | Media | Bajo: web lenta, no se rompe | (1) Sveltia permite limitar tamaño en config (lo dejaremos en 2MB max). (2) Doc al editor: "redimensiona las fotos a 1200px ancho antes de subir". |
| **Roberto pierde acceso a la cuenta GitHub** | Muy baja | Crítico: nadie puede editar el CMS, nadie puede desplegar | (1) Hermano editor tiene su propia cuenta GitHub con permisos de "collaborator" en el repo. (2) 2FA en ambas cuentas. (3) Token de Netlify guardado fuera de GitHub. |
| **Netlify límite de build minutes (300/mes en plan gratis)** | Muy baja | Bajo: el sitio no se actualiza hasta el mes siguiente, sigue online | Cada build es ~60s. 300 min ÷ 1 min = 300 deploys/mes. Realista: 20-30 deploys/mes. Margen 10x. |
| **GitHub OAuth App rate-limited si muchísimos editores** | Muy baja | Bajo | Solo 1-2 editores. No aplica. |
| **CSS del HTML original tiene bugs en mobile <480px** | Media | Medio: web "rota" visualmente en móviles antiguos | Auditamos en checkpoint 1 con devtools en 4 anchos: 360, 480, 768, 1280. Corregimos lo necesario. |
| **Grid 100 números no es accesible (teclado, lectores pantalla)** | Alta | Bajo (público objetivo navega con ratón/touch) | v1: añadimos `aria-label` por celda y `role="grid"`. Si más adelante se quiere a11y completa, iteración aparte. |
| **localStorage deshabilitado (incógnito estricto)** | Baja | Bajo: favoritos no persisten al refrescar | El código degrada a memoria. No rompe. |
| **El usuario quiere migrar a Decap o a otro CMS en el futuro** | Baja | Bajo | Sveltia es 100% compatible con `config.yml` de Decap. Cambiar el `<script>` de Sveltia por el de Decap es un commit de 1 línea. El contenido en `.md` es totalmente portable. |

## 15. Fuera de alcance v1 (explícito)

Para que no haya ambigüedad sobre qué NO va en esta versión:

- ❌ Pasarela de pago real (Stripe, Bizum integrado)
- ❌ Carrito de varios productos (las compras son 1 a 1 vía WhatsApp; los favoritos sí permiten "pedir varias" pero abre el chat)
- ❌ Sistema de cuentas de usuario / login para visitantes
- ❌ Buscador funcional (el icono se elimina)
- ❌ Reviews / comentarios / valoraciones
- ❌ Galería de Instagram (eliminada del alcance v1)
- ❌ Filtros por categorías (eliminado del alcance v1)
- ❌ Multi-idioma (solo español)
- ❌ Optimización avanzada de imágenes (Astro `<Image>` con WebP/srcset)
- ❌ PWA / instalable / offline
- ❌ Analytics avanzado (se puede añadir Plausible/GA en una iteración corta)
- ❌ Email automático al editor cuando alguien hace una compra (al ser vía WhatsApp, ya llega ahí)

Todo lo anterior es añadible en iteraciones posteriores sin tirar nada de lo construido en v1.

## 16. Criterios de "Hecho"

La v1 se considera entregada cuando:

1. ✅ La home en producción es **pixel-perfect** vs el `index.html` original (revisado por el usuario lado a lado)
2. ✅ Mobile (≤768px) funciona: hamburguesa abre menú, todas las secciones se ven sin scroll horizontal
3. ✅ Editor (no programador) puede entrar a `/admin`, editar el precio de una camiseta, guardar, y ver el cambio en ~90s en la web pública
4. ✅ Editor puede crear un nuevo sorteo desde cero, marcarlo activo, y aparece en la home (el anterior pasa a "finalizado" manualmente)
5. ✅ Click en cualquier botón "Pedir" o "Reservar" abre WhatsApp del propietario con el mensaje correctamente rellenado
6. ✅ Favoritos: marcar 3 camisetas, refrescar la página, siguen marcadas; abrir drawer, ver las 3, pulsar "Pedir todas" abre WhatsApp con las 3 listadas
7. ✅ Sorteo: click en un número disponible lo marca, click en CTA abre WhatsApp con número y título del sorteo en el mensaje
8. ✅ Lighthouse Performance ≥ 90 en home (móvil simulado)
9. ✅ Cero errores en consola del navegador en producción

---

**Fin del spec.** Tras tu aprobación se invoca la skill `writing-plans` para crear el plan de implementación detallado por archivo.
