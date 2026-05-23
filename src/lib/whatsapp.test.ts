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
