/**
 * Cliente HTTP para adapters de seguradora (somente servidor):
 * timeout, retry com backoff exponencial em erros transitórios, idempotency key,
 * circuit breaker simples por seguradora e log com dados pessoais mascarados.
 */
import { AdapterError } from "./contract";

const breaker = new Map<string, { failures: number; openUntil: number }>();
const FAILS_TO_OPEN = 5;
const OPEN_MS = 60_000;

/** Mascara CPF/CNPJ, e-mails e telefones antes de logar. */
export function redact(text: string) {
  return text
    .replace(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g, "***CPF***")
    .replace(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g, "***CNPJ***")
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "***EMAIL***")
    .replace(/\+?55?\s?\(?\d{2}\)?\s?9?\d{4}-?\d{4}/g, "***TEL***");
}

export interface RequestOptions { method?: "GET" | "POST" | "PUT"; headers?: Record<string, string>; body?: unknown; timeoutMs?: number; retries?: number; idempotencyKey?: string }

export async function insurerFetch<T>(insurerId: string, url: string, opts: RequestOptions = {}, log: (line: string) => void = () => {}): Promise<T> {
  const b = breaker.get(insurerId);
  if (b && b.openUntil > Date.now()) throw new AdapterError("unavailable", "Integração temporariamente suspensa (circuit breaker)", insurerId);
  const retries = opts.retries ?? 2;
  let attempt = 0;
  for (;;) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15_000);
    const started = Date.now();
    try {
      const res = await fetch(url, {
        method: opts.method ?? "GET",
        headers: { "content-type": "application/json", ...(opts.idempotencyKey ? { "idempotency-key": opts.idempotencyKey } : {}), ...opts.headers },
        body: opts.body != null ? JSON.stringify(opts.body) : undefined,
        signal: ctrl.signal,
      });
      const text = await res.text();
      log(`[${insurerId}] ${opts.method ?? "GET"} ${new URL(url).pathname} → ${res.status} em ${Date.now() - started}ms ${redact(text.slice(0, 300))}`);
      if (res.status === 401 || res.status === 403) throw new AdapterError("auth", "Credenciais recusadas pela seguradora", insurerId, false);
      if (res.status === 422 || res.status === 400) throw new AdapterError("validation", redact(text.slice(0, 500)), insurerId, false);
      if (res.status === 429) throw new AdapterError("rate_limited", "Limite de requisições da seguradora", insurerId);
      if (res.status >= 500) throw new AdapterError("unavailable", `Seguradora indisponível (${res.status})`, insurerId);
      breaker.set(insurerId, { failures: 0, openUntil: 0 });
      return (text ? JSON.parse(text) : null) as T;
    } catch (e) {
      const err = e instanceof AdapterError ? e : new AdapterError((e as Error).name === "AbortError" ? "timeout" : "unknown", (e as Error).message, insurerId);
      if (err.retryable) {
        const st = breaker.get(insurerId) ?? { failures: 0, openUntil: 0 };
        st.failures++;
        if (st.failures >= FAILS_TO_OPEN) st.openUntil = Date.now() + OPEN_MS;
        breaker.set(insurerId, st);
      }
      if (!err.retryable || attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
      attempt++;
    } finally {
      clearTimeout(timer);
    }
  }
}
