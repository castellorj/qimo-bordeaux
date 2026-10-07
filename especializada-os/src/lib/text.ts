/** Normalização para busca e matching (em produção: unaccent + pg_trgm). */
export function norm(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[''`´]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set(["hospital", "clinica", "laboratorio", "de", "da", "do", "das", "dos", "e", "rj", "rio", "janeiro", "unidade", "centro", "medico"]);

function tokens(s: string) {
  return norm(s).split(" ").filter((t) => t && !STOP.has(t));
}

function bigrams(s: string) {
  const t = norm(s).replace(/ /g, "");
  const out = new Map<string, number>();
  for (let i = 0; i < t.length - 1; i++) {
    const g = t.slice(i, i + 2);
    out.set(g, (out.get(g) ?? 0) + 1);
  }
  return out;
}

/** Similaridade Sørensen–Dice sobre bigramas (0..1) */
export function dice(a: string, b: string) {
  const A = bigrams(a);
  const B = bigrams(b);
  let inter = 0;
  let total = 0;
  A.forEach((v, k) => {
    total += v;
    inter += Math.min(v, B.get(k) ?? 0);
  });
  B.forEach((v) => (total += v));
  return total === 0 ? 0 : (2 * inter) / total;
}

/** Similaridade de nomes de estabelecimentos: ignora termos genéricos ("Hospital", "RJ"…). */
export function providerSimilarity(a: string, b: string) {
  const ta = tokens(a).join(" ");
  const tb = tokens(b).join(" ");
  if (!ta || !tb) return dice(a, b);
  if (ta === tb) return 1;
  return Math.max(dice(ta, tb), dice(a, b) * 0.9);
}

export function includesNorm(hay: string | undefined, needle: string) {
  if (!hay) return false;
  return norm(hay).includes(norm(needle));
}
