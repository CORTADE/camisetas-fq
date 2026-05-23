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
