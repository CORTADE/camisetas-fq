export function renderTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return key in vars ? String(vars[key]) : match;
  });
}

export function buildWaUrl(phone: string, message: string): string {
  if (!message) return `https://wa.me/${phone}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
