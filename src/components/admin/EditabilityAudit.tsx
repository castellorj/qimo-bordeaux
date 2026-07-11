"use client";

import { Icon } from "@/components/Icon";
import clsx from "clsx";

type Status = "complete" | "partial" | "blocked";

interface Area {
  title: string;
  status: Status;
  where: string;
  editable: string[];
  gaps: string[];
}

const AREAS: Area[] = [
  {
    title: "Roteiro e programacao",
    status: "complete",
    where: "Programacao",
    editable: ["dias", "fotos", "portos", "agenda do navio", "atividades", "horarios", "capacidade e visibilidade"],
    gaps: [],
  },
  {
    title: "Fichas do Descobrir",
    status: "complete",
    where: "Fichas",
    editable: ["cidades", "vinicolas", "restaurantes", "vinhos", "gastronomia", "experiencias", "compras", "chef", "fotos e ordem"],
    gaps: [],
  },
  {
    title: "Menus, botoes e textos curtos",
    status: "complete",
    where: "Menus e textos",
    editable: ["abas principais", "menus internos", "hero/titulos de secoes", "textos da home", "botoes de reserva", "rotulos da programacao"],
    gaps: [],
  },
  {
    title: "Fotos fixas do site",
    status: "complete",
    where: "Fotos e concierge",
    editable: ["telas de entrada", "topos de secao", "cards do Descobrir", "cards da viagem", "pagina do navio"],
    gaps: [],
  },
  {
    title: "Concierge",
    status: "complete",
    where: "Fotos e concierge",
    editable: ["contatos", "telefone/link", "tipo de acao", "icone", "ordem", "visibilidade"],
    gaps: [],
  },
  {
    title: "Paginas extras",
    status: "complete",
    where: "Paginas",
    editable: ["paginas novas", "titulo", "icone", "blocos", "ordem", "publicacao"],
    gaps: [],
  },
  {
    title: "Informacoes uteis",
    status: "partial",
    where: "Menus e textos / codigo",
    editable: ["titulo da pagina", "foto do topo", "alguns rotulos globais"],
    gaps: ["cards de moeda/idioma/fuso/tomadas/gorjeta ainda estao no arquivo da pagina", "lista de etiqueta ainda vem de src/content/concierge.ts"],
  },
  {
    title: "Compras / Tax Free",
    status: "partial",
    where: "Fichas / codigo",
    editable: ["fichas de compras", "fotos e ordem dos itens"],
    gaps: ["bloco Tax Free ainda vem de src/content/shopping.ts"],
  },
  {
    title: "Documentos",
    status: "partial",
    where: "Tela Documentos",
    editable: ["upload/remocao pelo proprio cliente no aparelho"],
    gaps: ["categorias e texto explicativo ainda estao fixos na pagina", "nao ha biblioteca central de documentos para a equipe publicar"],
  },
  {
    title: "Dados globais da viagem",
    status: "partial",
    where: "codigo",
    editable: ["alguns textos derivados aparecem em Menus e textos"],
    gaps: ["nome da viagem, navio, datas e contagem ainda aparecem em constants/arquivos"],
  },
];

const STATUS_META: Record<Status, { label: string; icon: string; cls: string }> = {
  complete: { label: "Editavel", icon: "CircleCheck", cls: "bg-olive/15 text-olive-deep" },
  partial: { label: "Parcial", icon: "AlertTriangle", cls: "bg-gold/15 text-gold-deep" },
  blocked: { label: "Fixo", icon: "X", cls: "bg-black/5 text-muted" },
};

export function EditabilityAudit() {
  const complete = AREAS.filter((area) => area.status === "complete").length;
  const partial = AREAS.filter((area) => area.status === "partial").length;

  return (
    <div className="space-y-6">
      <div className="rounded-[12px] border p-5" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
        <p className="kicker-muted">Cobertura do CMS</p>
        <h2 className="mt-1 font-serif text-2xl font-light">O que ja da para editar</h2>
        <p className="mt-2 max-w-3xl font-sans text-[13px] leading-relaxed text-muted">
          Este mapa mostra onde cada parte do guia e editada e quais blocos ainda precisam virar CMS para tudo ficar 100% controlavel pelo painel.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 font-sans text-[11px]">
          <span className="rounded-full bg-olive/15 px-3 py-1 text-olive-deep">{complete} areas editaveis</span>
          <span className="rounded-full bg-gold/15 px-3 py-1 text-gold-deep">{partial} areas parciais</span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {AREAS.map((area) => {
          const meta = STATUS_META[area.status];
          return (
            <section key={area.title} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-xl font-light">{area.title}</h3>
                  <p className="mt-1 font-sans text-[12px] text-muted">Editar em: {area.where}</p>
                </div>
                <span className={clsx("inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-sans text-[11px]", meta.cls)}>
                  <Icon name={meta.icon} size={12} /> {meta.label}
                </span>
              </div>

              <div className="mt-4">
                <p className="kicker-muted mb-2">Hoje editavel</p>
                <div className="flex flex-wrap gap-1.5">
                  {area.editable.map((item) => (
                    <span key={item} className="rounded-full bg-black/5 px-2.5 py-1 font-sans text-[11px] text-muted">{item}</span>
                  ))}
                </div>
              </div>

              {area.gaps.length > 0 && (
                <div className="mt-4 rounded-[10px] border p-3" style={{ borderColor: "var(--line)" }}>
                  <p className="kicker-muted mb-2">Falta transformar</p>
                  <ul className="space-y-1.5">
                    {area.gaps.map((gap) => (
                      <li key={gap} className="flex gap-2 font-sans text-[12px] leading-relaxed text-muted">
                        <Icon name="AlertTriangle" size={13} className="mt-0.5 shrink-0 text-gold-deep" />
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
