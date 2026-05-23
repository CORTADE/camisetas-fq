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
