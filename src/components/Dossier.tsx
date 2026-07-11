"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renderiza um dossiê editorial em Markdown (usado nos châteaux-ícone).
 * Estiliza títulos, tabelas, listas e citações no padrão premium do guia.
 */
export function Dossier({ md }: { md: string }) {
  return (
    <div className="dossier max-w-2xl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: () => null, // o nome já aparece no herói
          h2: ({ children }) => <h2 className="display mt-12 text-2xl sm:text-3xl">{children}</h2>,
          h3: ({ children }) => <h3 className="kicker mt-8">{children}</h3>,
          p: ({ children }) => <p className="mt-3 font-serif text-[17px] font-light leading-relaxed text-muted">{children}</p>,
          strong: ({ children }) => <strong className="font-medium" style={{ color: "var(--text)" }}>{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-petrol-600 underline decoration-gold/40 underline-offset-2 hover:text-petrol-500">{children}</a>,
          ul: ({ children }) => <ul className="mt-3 space-y-2">{children}</ul>,
          li: ({ children }) => (
            <li className="flex items-start gap-3 font-sans text-[14px] leading-relaxed text-muted">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" /><span className="min-w-0">{children}</span>
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mt-6 rounded-[14px] border p-5" style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--gold) 6%, transparent)" }}>
              {children}
            </blockquote>
          ),
          hr: () => <div className="hairline my-10" />,
          table: ({ children }) => (
            <div className="mt-4 overflow-x-auto rounded-[12px] border" style={{ borderColor: "var(--line)" }}>
              <table className="w-full border-collapse text-left font-sans text-[13px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-black/[0.03]">{children}</thead>,
          th: ({ children }) => <th className="border-b px-4 py-2.5 font-sans text-[11px] uppercase tracking-wide2 text-muted" style={{ borderColor: "var(--line)" }}>{children}</th>,
          td: ({ children }) => <td className="border-b px-4 py-2.5 align-top" style={{ borderColor: "var(--line)", color: "var(--text)" }}>{children}</td>,
        }}
      >
        {md}
      </ReactMarkdown>
    </div>
  );
}
