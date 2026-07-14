"use client";

import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { ActivityReserve } from "@/components/ActivityReserve";
import { useReservations } from "@/components/providers";

export default function ReservasPage() {
  const { mine, guest } = useReservations();
  const items = Array.from(mine.values()).sort(
    (a, b) => (a.dayNumber ?? 99) - (b.dayNumber ?? 99) || (a.startTime || "").localeCompare(b.startTime || "")
  );
  const nextReservation = items[0];
  const confirmedCount = items.filter((item) => item.status === "confirmed").length;
  const waitlistCount = items.filter((item) => item.status !== "confirmed").length;
  const seatCount = items.reduce((sum, item) => sum + (item.seats || item.party.length || 1), 0);
  const dayGroups = items.reduce<Array<{ day: number | null; items: typeof items }>>((groups, item) => {
    const day = item.dayNumber ?? null;
    const group = groups.find((g) => g.day === day);
    if (group) group.items.push(item);
    else groups.push({ day, items: [item] });
    return groups;
  }, []);

  return (
    <>
      <PageHero section="reservas" small />

      <div className="container-editorial py-14">
        {items.length === 0 ? (
          <div className="mx-auto max-w-md py-12 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border" style={{ borderColor: "var(--line)" }}>
              <Icon name="CalendarCheck" size={26} className="text-gold" />
            </span>
            <h2 className="display mt-6 text-2xl">Você ainda não reservou nada</h2>
            <p className="prose-luxe mx-auto mt-3 max-w-sm">
              Abra a programação, escolha um passeio e toque em <strong>Reservar</strong>. Você pode incluir acompanhantes na mesma reserva.
            </p>
            <Link href="/programacao" className="btn-primary mt-8">
              Ver a programação <Icon name="ArrowRight" size={15} />
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-[16px] border p-5 shadow-soft" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="kicker">Minha agenda</p>
                  <h2 className="display mt-2 text-3xl sm:text-4xl">
                    {guest?.room ? `Quarto ${guest.room}` : "Reservas da viagem"}
                  </h2>
                  <p className="mt-3 max-w-xl font-sans text-[13px] leading-relaxed text-muted">
                    Suas escolhas ficam organizadas por dia. Se houver duas atividades no mesmo horário, o guia permite manter apenas uma opção por quarto.
                  </p>
                </div>
                <Link href="/programacao" className="btn-primary !px-4 !py-2.5 text-[12px]">
                  <Icon name="Plus" size={14} /> Reservar mais
                </Link>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <AgendaStat icon="CalendarCheck" label="Confirmadas" value={String(confirmedCount)} />
                <AgendaStat icon="Clock" label="Espera" value={String(waitlistCount)} />
                <AgendaStat icon="Users" label="Pessoas" value={String(seatCount)} />
                <AgendaStat icon="RefreshCw" label="Atualização" value="ao vivo" />
              </div>

              {nextReservation && (
                <div className="mt-4 rounded-[12px] border p-4" style={{ borderColor: "var(--gold)", background: "color-mix(in srgb, var(--gold) 9%, transparent)" }}>
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-wide2 text-gold-deep">Próxima escolha</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-serif text-xl font-light leading-snug">{nextReservation.title}</p>
                      <p className="mt-1 font-sans text-[12px] text-muted">
                        Dia {nextReservation.dayNumber ?? "a confirmar"} · {nextReservation.startTime || "horário a confirmar"}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 font-sans text-[11px] font-medium ${nextReservation.status === "confirmed" ? "bg-olive/15 text-olive-deep" : "bg-gold/15 text-gold-deep"}`}>
                      {nextReservation.status === "confirmed" ? "Confirmada" : "Lista de espera"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 space-y-6">
              {dayGroups.map((group) => (
                <section key={group.day ?? "sem-dia"}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-petrol-600/10 font-serif text-[15px] text-petrol-600">
                      {group.day ?? "?"}
                    </span>
                    <p className="font-sans text-[11px] font-semibold uppercase tracking-wide2 text-muted">
                      Dia {group.day ?? "sem data"} · {group.items.length} {group.items.length === 1 ? "item" : "itens"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((r) => (
                      <div key={r.reservationId} className="card p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-sans text-[11px] uppercase tracking-wide2 text-gold-deep">
                              {r.startTime || "Horário a confirmar"}
                            </p>
                            <h3 className="mt-1 font-serif text-xl font-light leading-snug">{r.title}</h3>
                          </div>
                          <span className={`shrink-0 rounded-full px-3 py-1 font-sans text-[11px] font-medium ${r.status === "confirmed" ? "bg-olive/15 text-olive-deep" : "bg-gold/15 text-gold-deep"}`}>
                            {r.status === "confirmed" ? "Confirmada" : "Lista de espera"}
                          </span>
                        </div>

                        {r.party.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {r.party.map((name, i) => (
                              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2.5 py-1 font-sans text-[12px]">
                                <Icon name={i === 0 ? "User" : "Users"} size={12} className="text-gold-deep" /> {name}
                              </span>
                            ))}
                          </div>
                        )}

                        {r.contentKey && <ActivityReserve contentKey={r.contentKey} />}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function AgendaStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-[12px] border bg-white/40 p-3" style={{ borderColor: "var(--line)" }}>
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-black/[0.04] text-gold-deep">
          <Icon name={icon} size={15} />
        </span>
        <div>
          <p className="font-serif text-xl font-light leading-none">{value}</p>
          <p className="mt-1 font-sans text-[10px] uppercase tracking-wide2 text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}
