"use client";
import Link from "next/link";
import { forwardRef, useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import * as Icons from "./icons";
import { cn } from "@/lib/cn";
import type { ProductLine } from "@/domain/types";
import { PRODUCT } from "@/domain/products";
import { initials as mkInitials, date as fmtDate } from "@/lib/format";

// ───────── Button
type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary: "bg-white text-ink border border-line hover:bg-canvas shadow-sm",
  ghost: "text-ink-soft hover:bg-line-soft hover:text-ink",
  danger: "bg-danger text-white hover:bg-red-700",
  subtle: "bg-brand-50 text-brand-700 hover:bg-brand-100",
};
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md"; icon?: ReactNode }>(
  function Button({ variant = "primary", size = "md", icon, className, children, ...p }, ref) {
    return (
      <button ref={ref} className={cn("inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400", size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3.5 text-sm", variants[variant], className)} {...p}>
        {icon}
        {children}
      </button>
    );
  },
);
export function LinkButton({ href, variant = "secondary", size = "md", icon, children, className, external }: { href: string; variant?: Variant; size?: "sm" | "md"; icon?: ReactNode; children: ReactNode; className?: string; external?: boolean }) {
  const cls = cn("inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors", size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3.5 text-sm", variants[variant], className);
  if (external) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{icon}{children}</a>;
  return <Link href={href} className={cls}>{icon}{children}</Link>;
}

// ───────── Badge
type Tone = "neutral" | "brand" | "ok" | "warn" | "danger" | "demo" | "violet";
const tones: Record<Tone, string> = {
  neutral: "bg-line-soft text-ink-soft ring-line",
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  ok: "bg-ok-soft text-ok-strong ring-emerald-100",
  warn: "bg-warn-soft text-warn-strong ring-amber-100",
  danger: "bg-danger-soft text-red-700 ring-red-100",
  demo: "bg-demo-soft text-demo ring-fuchsia-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
};
export function Badge({ tone = "neutral", children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-2xs font-medium ring-1 ring-inset", tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
export function DemoBadge({ className }: { className?: string }) {
  return <Badge tone="demo" className={cn("font-semibold tracking-wide", className)}>DEMO</Badge>;
}

// ───────── Card
export function Card({ children, className, title, action, subtitle, padded = true }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode; subtitle?: ReactNode; padded?: boolean }) {
  return (
    <section className={cn("rounded-xl border border-line bg-surface shadow-card", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-line-soft px-4 py-3">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold text-ink">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? "p-4" : ""}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, href, tone, icon }: { label: string; value: ReactNode; sub?: ReactNode; href?: string; tone?: "ok" | "warn" | "danger" | "brand"; icon?: ReactNode }) {
  const body = (
    <div className={cn("group h-full rounded-xl border border-line bg-surface p-4 shadow-card transition", href && "hover:border-brand-300 hover:shadow-pop")}>
      <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
        <span>{label}</span>
        <span className={cn(tone === "ok" && "text-ok", tone === "warn" && "text-warn", tone === "danger" && "text-danger", tone === "brand" && "text-brand-600")}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-muted">{sub}</div>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

// ───────── Page header
export function PageHeader({ title, subtitle, actions, icon, breadcrumb }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; icon?: ReactNode; breadcrumb?: { label: string; href: string }[] }) {
  return (
    <div className="mb-5">
      {breadcrumb && (
        <nav className="mb-1.5 flex items-center gap-1 text-xs text-ink-muted">
          {breadcrumb.map((b, i) => (
            <span key={b.href} className="flex items-center gap-1">
              {i > 0 && <Icons.ChevronRight className="h-3 w-3" />}
              <Link href={b.href} className="hover:text-ink">{b.label}</Link>
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {icon && <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icon}</div>}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-ink">{title}</h1>
            {subtitle && <div className="mt-0.5 text-sm text-ink-muted">{subtitle}</div>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

// ───────── Table
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}
export function Th({ children, className, onClick, active }: { children?: ReactNode; className?: string; onClick?: () => void; active?: boolean }) {
  return (
    <th onClick={onClick} className={cn("sticky top-0 z-[1] whitespace-nowrap border-b border-line bg-canvas px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-ink-muted", onClick && "cursor-pointer select-none hover:text-ink", active && "text-brand-700", className)}>
      {children}
    </th>
  );
}
export function Td({ children, className, colSpan }: { children?: ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={cn("border-b border-line-soft px-3 py-2.5 align-middle", className)}>{children}</td>;
}

// ───────── Inputs
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn("h-9 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100", className)} {...p} />;
});
export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("h-9 w-full rounded-lg border border-line bg-white px-2.5 text-sm text-ink focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100", className)} {...p}>{children}</select>;
}
export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100", className)} {...p} />;
}
export function Field({ label, children, hint, className, known }: { label: ReactNode; children: ReactNode; hint?: ReactNode; className?: string; known?: boolean }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
        {label}
        {known && <span title="Dado já conhecido — reaproveitado (digitar uma vez)" className="inline-flex items-center gap-0.5 rounded bg-ok-soft px-1 text-2xs font-medium text-ok-strong"><Icons.Check className="h-2.5 w-2.5" />já cadastrado</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-2xs text-ink-muted">{hint}</span>}
    </label>
  );
}
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="inline-flex items-center gap-2 text-sm text-ink-soft">
      <span className={cn("relative h-5 w-9 rounded-full transition", checked ? "bg-brand-600" : "bg-line")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition", checked ? "left-[18px]" : "left-0.5")} />
      </span>
      {label}
    </button>
  );
}
export function Segmented<T extends string>({ value, onChange, options, size = "md" }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; size?: "sm" | "md" }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-canvas p-0.5">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} className={cn("rounded-md font-medium transition", size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm", value === o.value ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ───────── Tabs
export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: ReactNode; count?: number }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <button key={t.value} onClick={() => onChange(t.value)} className={cn("-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition", value === t.value ? "border-brand-600 text-ink" : "border-transparent text-ink-muted hover:text-ink")}>
          {t.label}
          {t.count != null && <span className="rounded-full bg-line-soft px-1.5 text-2xs text-ink-muted">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ───────── Dialog / Drawer
export function Dialog({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 p-4 pt-[8vh] backdrop-blur-[1px]" onMouseDown={onClose}>
      <div className={cn("w-full rounded-xl bg-white shadow-pop", wide ? "max-w-3xl" : "max-w-lg")} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-ink-muted hover:bg-line-soft" aria-label="Fechar"><Icons.X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

// ───────── Misc
export function Empty({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-line-soft text-ink-muted">{icon ?? <Icons.Inbox className="h-5 w-5" />}</div>
      <p className="text-sm font-medium text-ink">{title}</p>
      {children && <p className="mt-1 max-w-sm text-xs text-ink-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export function Avatar({ name, size = "md", tone = "brand" }: { name: string; size?: "sm" | "md" | "lg"; tone?: "brand" | "neutral" }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", tone === "brand" ? "bg-brand-100 text-brand-700" : "bg-line-soft text-ink-soft", size === "sm" ? "h-6 w-6 text-2xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-8 w-8 text-xs")}>
      {mkInitials(name)}
    </span>
  );
}

export function LineIcon({ line, className }: { line: ProductLine; className?: string }) {
  const name = PRODUCT[line]?.icon ?? "Package";
  const Ico = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Package;
  return <Ico className={cn("h-4 w-4", className)} style={{ color: PRODUCT[line]?.color }} />;
}
export function LineBadge({ line }: { line: ProductLine }) {
  const p = PRODUCT[line];
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-white px-1.5 py-0.5 text-2xs font-medium text-ink-soft ring-1 ring-inset ring-line">
      <LineIcon line={line} className="h-3 w-3" />
      {p?.label ?? line}
    </span>
  );
}

/** Proveniência do dado: fonte + data (+ alerta se desatualizado). */
export function SourceChip({ source, at, stale, className }: { source: string; at?: string; stale?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs", stale ? "bg-warn-soft text-warn-strong" : "bg-line-soft text-ink-muted", className)} title="Origem do dado">
      {stale ? <Icons.AlertTriangle className="h-3 w-3" /> : <Icons.Database className="h-3 w-3" />}
      {source}
      {at && <> · {at.length > 10 ? fmtDate(at.slice(0, 10)) : fmtDate(at)}</>}
    </span>
  );
}

export function Confidence({ value }: { value: number }) {
  const tone = value >= 0.9 ? "bg-ok" : value >= 0.85 ? "bg-emerald-400" : value >= 0.7 ? "bg-warn" : "bg-danger";
  return (
    <span className="inline-flex items-center gap-1.5 text-2xs text-ink-muted" title="Confiança da extração">
      <span className="relative h-1.5 w-10 overflow-hidden rounded-full bg-line">
        <span className={cn("absolute inset-y-0 left-0", tone)} style={{ width: `${Math.round(value * 100)}%` }} />
      </span>
      {Math.round(value * 100)}%
    </span>
  );
}

export function Progress({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "ok" | "warn" }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-line-soft", className)}>
      <div className={cn("h-full rounded-full", tone === "ok" ? "bg-ok" : tone === "warn" ? "bg-warn" : "bg-brand-500")} style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} />
    </div>
  );
}

export function KeyVal({ k, v, mono }: { k: ReactNode; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <span className="shrink-0 text-ink-muted">{k}</span>
      <span className={cn("min-w-0 truncate text-right text-ink", mono && "font-mono text-xs")}>{v}</span>
    </div>
  );
}

export { Icons };
