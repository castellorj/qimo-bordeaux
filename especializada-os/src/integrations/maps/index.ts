/**
 * Mapas & geocodificação. DEMO: geocoder local (bairros do Rio/Niterói) +
 * tiles OpenStreetMap via Leaflet. Produção: GoogleMapsGeocoder ou MapboxGeocoder
 * (chaves apenas no servidor, resultados cacheados no Postgres/PostGIS).
 */
export interface GeoPoint { lat: number; lng: number }
export interface GeocodeResult extends GeoPoint { label: string; precision: "endereco" | "bairro" | "cidade"; provider: string }
export interface Geocoder { geocode(query: string): Promise<GeocodeResult | null> }

const DISTRICTS: Record<string, GeoPoint & { cepPrefix: string[] }> = {
  leblon: { lat: -22.984, lng: -43.223, cepPrefix: ["22430", "22440", "22450"] },
  ipanema: { lat: -22.9838, lng: -43.2045, cepPrefix: ["22410", "22420"] },
  copacabana: { lat: -22.9711, lng: -43.1822, cepPrefix: ["22010", "22020", "22030", "22040", "22050", "22060", "22070"] },
  botafogo: { lat: -22.9519, lng: -43.1842, cepPrefix: ["22250", "22260", "22270", "22280", "22290"] },
  flamengo: { lat: -22.933, lng: -43.176, cepPrefix: ["22210", "22220", "22230"] },
  laranjeiras: { lat: -22.937, lng: -43.187, cepPrefix: ["22240"] },
  humaita: { lat: -22.956, lng: -43.198, cepPrefix: ["22261"] },
  lagoa: { lat: -22.973, lng: -43.205, cepPrefix: ["22470"] },
  "jardim botanico": { lat: -22.966, lng: -43.224, cepPrefix: ["22460"] },
  gavea: { lat: -22.979, lng: -43.233, cepPrefix: ["22451"] },
  "sao conrado": { lat: -22.999, lng: -43.268, cepPrefix: ["22610"] },
  "barra da tijuca": { lat: -23.0004, lng: -43.3659, cepPrefix: ["22620", "22630", "22631", "22640", "22790", "22793"] },
  recreio: { lat: -23.018, lng: -43.463, cepPrefix: ["22790", "22795"] },
  tijuca: { lat: -22.925, lng: -43.233, cepPrefix: ["20510", "20520", "20530", "20540"] },
  centro: { lat: -22.9068, lng: -43.1729, cepPrefix: ["20010", "20020", "20030", "20040", "20050"] },
  icarai: { lat: -22.906, lng: -43.11, cepPrefix: ["24220", "24230"] },
  niteroi: { lat: -22.8833, lng: -43.1036, cepPrefix: ["240", "241", "242"] },
};

function strip(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export const demoGeocoder: Geocoder = {
  async geocode(query) {
    const q = strip(query);
    const cep = q.replace(/\D/g, "");
    if (cep.length >= 5) {
      for (const [name, d] of Object.entries(DISTRICTS)) {
        if (d.cepPrefix.some((p) => cep.startsWith(p))) return { lat: d.lat, lng: d.lng, label: `CEP ${query} · ${name}`, precision: "bairro", provider: "demo-geocoder" };
      }
    }
    for (const [name, d] of Object.entries(DISTRICTS)) {
      if (q.includes(name)) return { lat: d.lat, lng: d.lng, label: name.replace(/\b\w/g, (c) => c.toUpperCase()), precision: "bairro", provider: "demo-geocoder" };
    }
    return null;
  },
};

