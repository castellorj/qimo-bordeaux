"use client";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function BarList({ items, format = (v) => String(v), color = "#3366f5" }: { items: { label: string; value: number; href?: string; color?: string; sub?: string }[]; format?: (v: number) => string; color?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2">
      {items.map((i) => {
        const row = (
          <div className="group">
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate text-ink-soft group-hover:text-ink">{i.label}{i.sub && <span className="ml-1 text-ink-faint">{i.sub}</span>}</span>
              <span className="shrink-0 font-medium tabular-nums text-ink">{format(i.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-line-soft">
              <div className="h-2 rounded-full transition-all" style={{ width: `${(i.value / max) * 100}%`, background: i.color ?? color }} />
            </div>
          </div>
        );
        return i.href ? <Link key={i.label} href={i.href} className="block">{row}</Link> : <div key={i.label}>{row}</div>;
      })}
    </div>
  );
}

/** Colunas agrupadas (ex.: comissão prevista × recebida) */
export function Columns({ data, series, format = (v) => String(v), height = 160 }: { data: { label: string; values: number[]; highlight?: boolean }[]; series: { name: string; color: string }[]; format?: (v: number) => string; height?: number }) {
  const max = Math.max(1, ...data.flatMap((d) => d.values));
  return (
    <div>
      <div className="flex items-end gap-3" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="flex h-full flex-1 flex-col justify-end">
            <div className="flex h-full items-end justify-center gap-1">
              {d.values.map((v, i) => (
                <div key={i} title={`${series[i].name}: ${format(v)}`} className="w-full max-w-[18px] rounded-t" style={{ height: `${(v / max) * 100}%`, background: series[i].color, minHeight: v > 0 ? 2 : 0 }} />
              ))}
            </div>
            <div className={cn("mt-1.5 text-center text-2xs text-ink-muted", d.highlight && "font-semibold text-ink")}>{d.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-2xs text-ink-muted">
        {series.map((s) => <span key={s.name} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />{s.name}</span>)}
      </div>
    </div>
  );
}

export function Funnel({ steps }: { steps: { label: string; value: number; amount?: string; href?: string }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <div className="space-y-1.5">
      {steps.map((s) => (
        <Link key={s.label} href={s.href ?? "#"} className="flex items-center gap-3 text-xs hover:opacity-90">
          <span className="w-28 shrink-0 truncate text-ink-soft">{s.label}</span>
          <div className="relative h-6 flex-1 rounded bg-line-soft">
            <div className="h-6 rounded bg-brand-200" style={{ width: `${Math.max(4, (s.value / max) * 100)}%` }} />
            <span className="absolute inset-y-0 left-2 flex items-center font-semibold text-brand-900">{s.value}</span>
          </div>
          <span className="w-20 shrink-0 text-right tabular-nums text-ink-muted">{s.amount}</span>
        </Link>
      ))}
    </div>
  );
}
