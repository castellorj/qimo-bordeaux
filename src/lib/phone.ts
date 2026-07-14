export function phoneDigits(value?: string | null): string {
  return (value || "").replace(/\D/g, "");
}

export function normalizePhone(value?: string | null): string {
  let digits = phoneDigits(value);
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  return digits;
}

export function phoneVariants(value?: string | null): string[] {
  const normalized = normalizePhone(value);
  const raw = phoneDigits(value);
  return Array.from(new Set([
    normalized,
    raw,
    normalized ? `55${normalized}` : "",
    normalized ? `+55${normalized}` : "",
  ].filter(Boolean)));
}
