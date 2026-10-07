"use client";
/**
 * Mapa (adapter de UI). DEMO: Leaflet + tiles OpenStreetMap (sem chave).
 * Produção: trocar o provedor de tiles/geocoding por Google Maps ou Mapbox
 * mantendo esta mesma interface de props.
 */
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { escapeHtml } from "@/lib/security";
import type { Map as LMap, LayerGroup } from "leaflet";

export interface MapPoint { id: string; lat: number; lng: number; color: string; label: string; sub?: string; size?: number; ring?: string }

export function MapView({ points, home, radiusKm, height = 460, onSelect, selectedId }: { points: MapPoint[]; home?: { lat: number; lng: number; label: string }; radiusKm?: number; height?: number; onSelect?: (id: string) => void; selectedId?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const L = useRef<typeof import("leaflet") | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const leaflet = await import("leaflet");
      if (cancelled || !el.current || map.current) return;
      L.current = leaflet;
      map.current = leaflet.map(el.current, { zoomControl: true, scrollWheelZoom: true }).setView([home?.lat ?? -22.95, home?.lng ?? -43.25], 12);
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap" }).addTo(map.current);
      layer.current = leaflet.layerGroup().addTo(map.current);
      draw();
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const leaflet = L.current;
    if (!leaflet || !map.current || !layer.current) return;
    layer.current.clearLayers();
    const bounds: [number, number][] = [];
    if (home) {
      if (radiusKm) leaflet.circle([home.lat, home.lng], { radius: radiusKm * 1000, color: "#1f4fe0", weight: 1, fillOpacity: 0.05 }).addTo(layer.current);
      leaflet.circleMarker([home.lat, home.lng], { radius: 9, color: "#fff", weight: 3, fillColor: "#0f172a", fillOpacity: 1 }).bindTooltip(escapeHtml(home.label), { direction: "top" }).addTo(layer.current);
      bounds.push([home.lat, home.lng]);
    }
    for (const p of points) {
      const m = leaflet.circleMarker([p.lat, p.lng], { radius: (p.size ?? 7) + (p.id === selectedId ? 3 : 0), color: p.ring ?? "#fff", weight: p.ring ? 3 : 2, fillColor: p.color, fillOpacity: 0.95 });
      // nomes podem vir de arquivos importados: sempre escapar antes de montar HTML
      m.bindTooltip(`<b>${escapeHtml(p.label)}</b>${p.sub ? `<br/><span style="color:#64748b">${escapeHtml(p.sub)}</span>` : ""}`, { direction: "top" });
      if (onSelect) m.on("click", () => onSelect(p.id));
      m.addTo(layer.current);
      bounds.push([p.lat, p.lng]);
    }
    if (bounds.length > 1) map.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    else if (bounds.length === 1) map.current.setView(bounds[0], 14);
  }

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points), home?.lat, home?.lng, radiusKm, selectedId]);

  return <div ref={el} style={{ height }} className="z-0 w-full overflow-hidden rounded-xl border border-line bg-line-soft" />;
}

export const TYPE_COLOR: Record<string, string> = { hospital: "#e11d48", maternidade: "#db2777", laboratorio: "#7c3aed", clinica: "#0891b2", "pronto-socorro": "#ea580c" };
export const TYPE_LABEL: Record<string, string> = { hospital: "Hospital", maternidade: "Maternidade", laboratorio: "Laboratório", clinica: "Clínica", "pronto-socorro": "Pronto-socorro" };
