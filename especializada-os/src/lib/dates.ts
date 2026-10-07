import type { ISODate } from "@/domain/types";

/** Data de referência ("hoje") — a DEMO gera datas relativas a ela. */
export function todayISO(): ISODate {
  const d = new Date();
  return toISO(d);
}
export function toISO(d: Date): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(iso: string, n: number): ISODate {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}
export function addMonths(iso: string, n: number): ISODate {
  const d = parseISO(iso);
  d.setMonth(d.getMonth() + n);
  return toISO(d);
}
/** b - a em dias */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);
}
export function daysFromToday(iso: string, today = todayISO()): number {
  return daysBetween(today, iso);
}
export function ageOn(birth: string, on = todayISO()): number {
  const b = parseISO(birth);
  const o = parseISO(on);
  let age = o.getFullYear() - b.getFullYear();
  if (o.getMonth() < b.getMonth() || (o.getMonth() === b.getMonth() && o.getDate() < b.getDate())) age--;
  return age;
}
export function nowISO(): string {
  return new Date().toISOString();
}
