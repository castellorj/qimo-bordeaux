"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import clsx from "clsx";

const DEVICES = [
  { key: "mobile", label: "Mobile", icon: "Smartphone", w: 390 },
  { key: "tablet", label: "Tablet", icon: "Tablet", w: 768 },
  { key: "desktop", label: "Desktop", icon: "Monitor", w: 0 },
] as const;

const ROUTES = [
  { path: "/", label: "Início" },
  { path: "/programacao", label: "Programação" },
  { path: "/cidades", label: "Cidades" },
  { path: "/vinicolas", label: "Vinícolas" },
  { path: "/restaurantes", label: "Restaurantes" },
  { path: "/vinhos", label: "Vinhos" },
  { path: "/experiencias", label: "Experiências" },
];

export function PreviewPane() {
  const [device, setDevice] = useState<(typeof DEVICES)[number]["key"]>("mobile");
  const [route, setRoute] = useState("/");
  const ref = useRef<HTMLIFrameElement>(null);
  const dev = DEVICES.find((d) => d.key === device)!;

  const reload = () => { if (ref.current) ref.current.src = route; };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {DEVICES.map((d) => (
            <button key={d.key} onClick={() => setDevice(d.key)}
              className={clsx("flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-[12px] transition-colors",
                device === d.key ? "border-gold text-gold-deep" : "text-muted hover:text-petrol-600")}
              style={{ borderColor: device === d.key ? undefined : "var(--line)" }}>
              <Icon name={d.icon} size={14} /> {d.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select value={route} onChange={(e) => setRoute(e.target.value)}
            className="rounded-full border bg-transparent px-3 py-1.5 font-sans text-[12px] outline-none focus:border-gold" style={{ borderColor: "var(--line)" }}>
            {ROUTES.map((r) => <option key={r.path} value={r.path}>{r.label}</option>)}
          </select>
          <button onClick={reload} className="btn-ghost !px-3 !py-1.5"><Icon name="ArrowRight" size={13} /> Recarregar</button>
        </div>
      </div>

      <div className="mt-4 grid place-items-center rounded-[16px] bg-black/[0.03] p-4 sm:p-8">
        <div
          className="overflow-hidden rounded-[20px] border bg-white shadow-lg transition-all"
          style={{ width: dev.w ? dev.w : "100%", maxWidth: "100%", borderColor: "var(--line)" }}
        >
          <iframe
            ref={ref}
            src={route}
            title="Pré-visualização do guia"
            className="block w-full border-0"
            style={{ height: device === "desktop" ? 720 : 760 }}
          />
        </div>
      </div>
      <p className="mt-3 text-center font-sans text-[11px] text-muted">
        As edições de conteúdo aparecem aqui em tempo real — recarregue para ver as últimas alterações.
      </p>
    </div>
  );
}
