"use client";

import { useEffect, useRef, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";

interface Doc {
  id: string;
  category: string;
  name: string;
  dataUrl?: string;
  mime?: string;
  note?: string;
}

const CATEGORIES = [
  { key: "Passaporte", icon: "FileText" },
  { key: "Seguro viagem", icon: "ShieldCheck" },
  { key: "Passagens", icon: "Ticket" },
  { key: "Vouchers", icon: "QrCode" },
  { key: "Outros", icon: "FileText" },
];

const KEY = "qimo:docs";

export default function DocumentosPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setDocs(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {}
  }, []);

  const persist = (next: Doc[]) => {
    setDocs(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      alert("Espaço de armazenamento local cheio. Remova algum documento pesado.");
    }
  };

  const onFile = (category: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const doc: Doc = {
        id: `${category}-${file.name}-${docs.length}`,
        category,
        name: file.name,
        dataUrl: reader.result as string,
        mime: file.type,
      };
      persist([...docs, doc]);
    };
    reader.readAsDataURL(file);
  };

  const remove = (id: string) => persist(docs.filter((d) => d.id !== id));

  return (
    <>
      <PageHero section="documentos" small />

      <div className="container-editorial py-14">
        <div className="mb-8 flex items-start gap-3 rounded-[3px] border p-4" style={{ borderColor: "var(--line)" }}>
          <Icon name="Shield" size={18} className="mt-0.5 shrink-0 text-gold" />
          <p className="font-sans text-[13px] leading-relaxed text-muted">
            Seus documentos ficam armazenados <strong>apenas neste aparelho</strong> (nada é enviado para a
            internet) e continuam disponíveis mesmo sem conexão. Recomendamos manter também as vias oficiais.
          </p>
        </div>

        <div className="space-y-6">
          {CATEGORIES.map((cat) => {
            const items = docs.filter((d) => d.category === cat.key);
            const openInput = active === cat.key;
            return (
              <section key={cat.key} className="card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-3 font-serif text-xl font-light">
                    <Icon name={cat.icon} size={18} className="text-gold" />
                    {cat.key}
                  </h2>
                  <button
                    onClick={() => {
                      setActive(cat.key);
                      setTimeout(() => fileRef.current?.click(), 0);
                    }}
                    className="btn-ghost !px-4 !py-2"
                  >
                    <Icon name="Plus" size={14} /> Adicionar
                  </button>
                </div>

                {items.length > 0 && (
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {items.map((d) => (
                      <div key={d.id} className="flex items-center gap-3 rounded-[3px] border p-3" style={{ borderColor: "var(--line)" }}>
                        <Icon name={d.mime?.includes("pdf") ? "FileText" : "Camera"} size={18} className="shrink-0 text-gold" />
                        <span className="min-w-0 flex-1 truncate font-sans text-[13px]">{d.name}</span>
                        {d.dataUrl && (
                          <a href={d.dataUrl} download={d.name} target="_blank" rel="noopener noreferrer" aria-label="Abrir" className="text-muted hover:text-gold">
                            <Icon name="Download" size={16} />
                          </a>
                        )}
                        <button onClick={() => remove(d.id)} aria-label="Remover" className="text-muted hover:text-[#8f2f2f]">
                          <Icon name="X" size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {items.length === 0 && (
                  <p className="mt-3 font-sans text-[13px] text-muted">Nenhum documento adicionado.</p>
                )}

                {openInput && (
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,application/pdf"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onFile(cat.key, f);
                      e.target.value = "";
                    }}
                  />
                )}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
