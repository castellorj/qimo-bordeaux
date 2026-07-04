const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function parseISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function weekday(iso: string) {
  return WEEKDAYS[parseISO(iso).getDay()];
}

export function weekdayShort(iso: string) {
  return weekday(iso).slice(0, 3);
}

export function dayMonth(iso: string) {
  const dt = parseISO(iso);
  return `${dt.getDate()} de ${MONTHS[dt.getMonth()]}`;
}

export function shortDate(iso: string) {
  const dt = parseISO(iso);
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

export function fullDate(iso: string) {
  return `${weekday(iso)}, ${dayMonth(iso)} de ${parseISO(iso).getFullYear()}`;
}
