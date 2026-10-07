import { parseISO, daysFromToday } from "./dates";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brl0 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("pt-BR");

export const money = (v: number | undefined | null) => (v == null ? "—" : brl.format(v));
export const money0 = (v: number | undefined | null) => (v == null ? "—" : brl0.format(v));
export const moneyK = (v: number) =>
  v >= 1_000_000 ? `R$ ${(v / 1_000_000).toFixed(1).replace(".", ",")} mi` : v >= 10_000 ? `R$ ${Math.round(v / 1000)} mil` : brl0.format(v);
export const n = (v: number) => num.format(v);
export const pct = (v: number, digits = 0) => `${(v * 100).toFixed(digits).replace(".", ",")}%`;

export function date(iso?: string) {
  if (!iso) return "—";
  return parseISO(iso).toLocaleDateString("pt-BR");
}
export function dateShort(iso?: string) {
  if (!iso) return "—";
  return parseISO(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}
export function dateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
export function relDays(iso: string) {
  const d = daysFromToday(iso);
  if (d === 0) return "hoje";
  if (d === 1) return "amanhã";
  if (d === -1) return "ontem";
  return d > 0 ? `em ${d} dias` : `há ${-d} dias`;
}
export function relTime(isoDateTime: string) {
  const diff = Date.now() - new Date(isoDateTime).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} dia${d > 1 ? "s" : ""}`;
}
export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}
export function firstName(name: string) {
  return name.split(" ")[0];
}
export const digits = (s: string) => s.replace(/\D/g, "");
export function maskCPF(cpf: string) {
  const d = digits(cpf);
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf;
}
/** CPF parcialmente oculto (minimização de exposição em listas) */
export function hideCPF(cpf: string) {
  const d = digits(cpf);
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : cpf;
}
export function maskCNPJ(c: string) {
  const d = digits(c);
  return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : c;
}
export function phone(p?: string) {
  if (!p) return "—";
  const d = digits(p);
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return p;
}
