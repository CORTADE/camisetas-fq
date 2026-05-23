export function renderTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return key in vars ? String(vars[key]) : match;
  });
}

export function buildWaUrl(phone: string, message: string): string {
  if (!message) return `https://wa.me/${phone}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Renders the sorteo WhatsApp template with multi-select aware variables.
 * Empty array returns empty string (no message → no WhatsApp link).
 * Supports: {numeros} (e.g. "#07, #22"), {cantidad_texto} ("el número" / "los N números"),
 * {total} (numbers.length × precioUnitario), {titulo_sorteo}, {precio}.
 * Legacy: {numero} = first number raw (no "#" prefix).
 */
export function renderSorteoTemplate(
  template: string,
  numeros: string[],
  tituloSorteo: string,
  precioUnitario: number,
): string {
  if (numeros.length === 0) return '';
  const cantidadTexto = numeros.length === 1 ? 'el número' : `los ${numeros.length} números`;
  const numerosFormatted = numeros.map(n => `#${n}`).join(', ');
  const total = numeros.length * precioUnitario;
  return renderTemplate(template, {
    numero: numeros[0],
    numeros: numerosFormatted,
    cantidad_texto: cantidadTexto,
    total,
    titulo_sorteo: tituloSorteo,
    precio: precioUnitario,
  });
}
