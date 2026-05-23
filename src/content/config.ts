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
