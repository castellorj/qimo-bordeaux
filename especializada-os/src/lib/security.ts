/** Utilitários de segurança usados pela UI. */

/** Escapa texto para inserção em HTML (ex.: tooltips do Leaflet, que aceitam HTML). */
export function escapeHtml(s: string) {
  return s.replace(/[&<>"'`]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" })[c]!);
}

/**
 * Neutraliza injeção de fórmula em CSV/planilhas (CWE-1236): células que começam com
 * = + - @ TAB CR são prefixadas com apóstrofo para o Excel tratá-las como texto.
 */
export function neutralizeFormula(s: string) {
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

/** Limites de upload (DEMO: no navegador; produção: também validados no servidor). */
export const UPLOAD_LIMITS = {
  documentBytes: 15 * 1024 * 1024,
  textReadBytes: 2 * 1024 * 1024,
  spreadsheetBytes: 5 * 1024 * 1024,
};

export function tooLarge(file: File, maxBytes: number) {
  return file.size > maxBytes;
}
