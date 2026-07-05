"use client";

import { supabase } from "./client";
import {
  cities, wineries, restaurants, appellations, gastronomy, experiences, shopping,
} from "@/content";

export const CONTENT_KINDS = [
  { kind: "city", label: "Cidades", file: cities },
  { kind: "winery", label: "Vinícolas", file: wineries },
  { kind: "restaurant", label: "Restaurantes", file: restaurants },
  { kind: "wine", label: "Vinhos", file: appellations },
  { kind: "gastronomy", label: "Gastronomia", file: gastronomy },
  { kind: "experience", label: "Experiências", file: experiences },
  { kind: "shopping", label: "Compras", file: shopping },
] as const;

export interface ContentRow {
  id: string;
  kind: string;
  slug: string;
  data: any;
  sort: number;
  published: boolean;
  updated_at: string;
}

export async function listContent(kind: string): Promise<ContentRow[]> {
  const { data } = await supabase().from("bordeaux_content").select("*").eq("kind", kind).order("sort");
  return (data as ContentRow[]) || [];
}

export async function upsertContent(kind: string, slug: string, data: any, sort: number, published = true) {
  return supabase().from("bordeaux_content").upsert({ kind, slug, data, sort, published }, { onConflict: "kind,slug" }).select().single();
}

export async function setPublished(id: string, published: boolean) {
  return supabase().from("bordeaux_content").update({ published }).eq("id", id);
}

export async function deleteContent(id: string) {
  return supabase().from("bordeaux_content").delete().eq("id", id);
}

// Importa o conteúdo atual dos arquivos para o banco (upsert). Não sobrescreve
// edições já feitas se skipExisting=true.
// ---- Fotos (Supabase Storage) ----
export async function uploadImage(file: File): Promise<string> {
  const sb = supabase();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from("bordeaux-media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return sb.storage.from("bordeaux-media").getPublicUrl(path).data.publicUrl;
}

// ---- Ordem ----
export async function updateSort(id: string, sort: number) {
  return supabase().from("bordeaux_content").update({ sort }).eq("id", id);
}

// ---- Textos / rótulos de botões (override do i18n) ----
export interface SettingVals { pt?: string; en?: string; es?: string }
export async function listSettings(): Promise<Record<string, SettingVals>> {
  const { data } = await supabase().from("bordeaux_settings").select("*");
  const m: Record<string, SettingVals> = {};
  (data || []).forEach((r: any) => (m[r.key] = { pt: r.pt, en: r.en, es: r.es }));
  return m;
}
export async function upsertSetting(key: string, vals: SettingVals, grp = "geral") {
  return supabase().from("bordeaux_settings").upsert({ key, ...vals, grp }, { onConflict: "key" });
}

// ---- Central de Operações: mudanças recentes ----
export interface ChangeRow {
  id: string; kind: string; slug: string; name: string; published: boolean; updated_at: string;
}
export async function listRecentChanges(limit = 12): Promise<ChangeRow[]> {
  const { data } = await supabase()
    .from("bordeaux_content")
    .select("id,kind,slug,data,published,updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data || []).map((r: any) => ({
    id: r.id, kind: r.kind, slug: r.slug,
    name: r.data?.name || r.slug, published: r.published, updated_at: r.updated_at,
  }));
}

// ---- Central de Operações: contadores por tipo ----
export interface KindCount { kind: string; label: string; total: number; hidden: number; noPhoto: number }
export async function contentCounts(): Promise<KindCount[]> {
  const { data } = await supabase().from("bordeaux_content").select("kind,published,data");
  const rows = (data || []) as any[];
  return CONTENT_KINDS.map((k) => {
    const mine = rows.filter((r) => r.kind === k.kind);
    const noPhoto = mine.filter((r) => !(r.data?.heroImage || r.data?.image || r.data?.photo)).length;
    return {
      kind: k.kind, label: k.label,
      total: mine.length,
      hidden: mine.filter((r) => !r.published).length,
      noPhoto,
    };
  });
}

// ---- Publicação (Netlify Build Hook) ----
export async function getBuildHookUrl(): Promise<string> {
  const { data } = await supabase().from("bordeaux_settings").select("pt").eq("key", "build_hook_url").maybeSingle();
  return (data as any)?.pt || "";
}
export async function setBuildHookUrl(url: string) {
  return supabase().from("bordeaux_settings").upsert({ key: "build_hook_url", pt: url, grp: "sistema" }, { onConflict: "key" });
}
export async function triggerPublish(): Promise<{ ok: boolean; error?: string }> {
  const url = await getBuildHookUrl();
  if (!url) return { ok: false, error: "no-hook" };
  try {
    await fetch(url, { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "network" };
  }
}

export async function importAllContent(): Promise<{ inserted: number }> {
  const sb = supabase();
  let count = 0;
  for (const group of CONTENT_KINDS) {
    const rows = (group.file as any[]).map((item, i) => ({
      kind: group.kind, slug: item.slug, data: item, sort: i * 10, published: true,
    }));
    if (rows.length) {
      const { error } = await sb.from("bordeaux_content").upsert(rows, { onConflict: "kind,slug", ignoreDuplicates: false });
      if (!error) count += rows.length;
    }
  }
  return { inserted: count };
}
