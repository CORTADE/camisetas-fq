import { describe, it, expect } from 'vitest';
import { renderTemplate, buildWaUrl, renderSorteoTemplate } from './whatsapp';

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

describe('renderSorteoTemplate', () => {
  const tpl = '¡Hola! Quiero {cantidad_texto} del sorteo "{titulo_sorteo}":\n{numeros}\nTotal: {total}€';

  it('renders 1 number with new template variables (singular)', () => {
    const out = renderSorteoTemplate(tpl, ['07'], 'España 2026', 1);
    expect(out).toBe('¡Hola! Quiero el número del sorteo "España 2026":\n#07\nTotal: 1€');
  });

  it('renders 3 numbers with new template variables (plural + total)', () => {
    const out = renderSorteoTemplate(tpl, ['07', '22', '45'], 'España 2026', 1);
    expect(out).toBe('¡Hola! Quiero los 3 números del sorteo "España 2026":\n#07, #22, #45\nTotal: 3€');
  });

  it('renders 2 numbers, computes total with non-integer unit price', () => {
    const out = renderSorteoTemplate('Reserva: {numeros} = {total}€', ['10', '20'], 'X', 2.5);
    expect(out).toBe('Reserva: #10, #20 = 5€');
  });

  it('legacy {numero} alias works with 1 number (raw, no # prefix)', () => {
    const out = renderSorteoTemplate('Pillé el {numero}', ['08'], 'X', 1);
    expect(out).toBe('Pillé el 08');
  });

  it('legacy {numero} alias resolves to first number when multiple selected', () => {
    const out = renderSorteoTemplate('Primero: {numero}', ['08', '15', '22'], 'X', 1);
    expect(out).toBe('Primero: 08');
  });

  it('returns empty string for empty array (no message generated)', () => {
    expect(renderSorteoTemplate(tpl, [], 'X', 1)).toBe('');
  });

  it('exposes {titulo_sorteo} and {precio} unit', () => {
    const out = renderSorteoTemplate('{titulo_sorteo} a {precio}€/u', ['00'], 'Mundial', 2);
    expect(out).toBe('Mundial a 2€/u');
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
