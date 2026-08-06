"use client";

import { Icon } from "@/components/Icon";
import { PhotoCarousel } from "@/components/PhotoCarousel";

// Pré-visualização do card do Chef como o hóspede verá — usada no editor do admin.
// Espelha o layout de src/app/chef/page.tsx (carrossel + detalhes + reserva).
export function ChefPreview({ data }: { data: any }) {
  const name: string = data?.name || "Sem nome";
  const gallery: string[] = (Array.isArray(data?.gallery) ? data.gallery : []).filter(Boolean);
  const imgs = gallery.length ? gallery : data?.heroImage ? [data.heroImage] : [];
  const description: string = data?.description || "";
  const highlights: string[] = Array.isArray(data?.highlights) ? data.highlights.filter(Boolean) : [];

  // divide a descrição em frase de abertura + parágrafos (igual ao guia)
  const sentences = description.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const lead = sentences[0] || description;
  const body = sentences.slice(1);

  const rsv = data?.reserva || {};
  const vagas = Math.max(0, parseInt(String(rsv.vagas ?? 0)) || 0);
  const dia = rsv.dia === "" || rsv.dia == null || Number.isNaN(parseInt(String(rsv.dia))) ? null : parseInt(String(rsv.dia));
  const horario = String(rsv.horario || "").trim();
  const temReserva = dia != null || !!horario || vagas > 0 || rsv.vagas === 0;
  const quando = [dia != null ? `Dia ${dia}` : null, horario || null].filter(Boolean).join(" · ");
  const vagasLabel = vagas > 0 ? `${vagas} ${vagas === 1 ? "vaga" : "vagas"}` : "lista de espera";

  return (
    <div className="overflow-hidden rounded-[20px] border shadow-card" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
      {imgs.length > 0 ? (
        <div className="p-3 pb-0 sm:p-4 sm:pb-0">
          <PhotoCarousel images={imgs} alt={name} />
        </div>
      ) : (
        <div className="m-3 grid aspect-[16/10] place-items-center rounded-[16px] bg-black/[0.04] text-muted">
          <span className="flex items-center gap-2 font-sans text-[13px]"><Icon name="Image" size={16} /> adicione fotos na galeria</span>
        </div>
      )}

      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          {data?.category && <span className="font-sans text-[10px] font-semibold uppercase tracking-luxe text-gold-deep">{data.category}</span>}
          {data?.qimoSelect && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/12 px-2.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wide2 text-gold-deep">
              <Icon name="Star" size={10} /> Seleção QIMO
            </span>
          )}
        </div>

        <h3 className="mt-2 font-serif text-2xl font-light leading-tight text-petrol-700 sm:text-[28px]">{name}</h3>
        {data?.chef && <p className="mt-1 font-serif text-[15px] font-light italic text-muted">com {data.chef}</p>}

        {data?.tagline && (
          <p className="mt-4 font-serif text-[20px] font-light italic leading-snug text-petrol-700 sm:text-[22px]">{data.tagline}</p>
        )}

        <div className="gold-rule mt-4" />

        {description && (
          <div className="mt-4 space-y-3">
            <p className="font-sans text-[14px] leading-relaxed" style={{ color: "var(--text)" }}>{lead}</p>
            {body.map((p, i) => (
              <p key={i} className="font-sans text-[13px] leading-relaxed text-muted">{p}</p>
            ))}
          </div>
        )}

        {highlights.length > 0 && (
          <div className="mt-5 rounded-[14px] border bg-white/40 p-4 sm:p-5" style={{ borderColor: "var(--line)" }}>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-wide2 text-muted">O que torna especial</p>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 font-sans text-[13px] leading-snug">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-deep"><Icon name="Check" size={12} /></span>
                  <span style={{ color: "var(--text)" }}>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {temReserva && quando && <span className="chip"><Icon name="CalendarCheck" size={13} /> {quando}</span>}
          {data?.duration && <span className="chip"><Icon name="Clock" size={13} /> {data.duration}</span>}
          {data?.price && <span className="chip"><Icon name="Coins" size={13} /> {data.price}</span>}
        </div>

        {temReserva ? (
          <div className="btn-primary mt-5 w-full !rounded-[10px] !px-4 !py-3 !tracking-wide text-[12px]">
            <Icon name="CalendarCheck" size={15} /> Reservar <span className="font-normal opacity-80">· {vagasLabel}</span>
          </div>
        ) : (
          <div className="btn-primary mt-5 w-full !rounded-[10px] !px-4 !py-3 !tracking-wide text-[12px]">
            <Icon name="CalendarCheck" size={15} /> Falar com o concierge
          </div>
        )}
      </div>
    </div>
  );
}
