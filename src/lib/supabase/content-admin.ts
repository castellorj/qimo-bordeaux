"use client";

import { supabase } from "./client";
import {
  cities, wineries, restaurants, appellations, gastronomy, experiences, shopping, chefExperiences,
  infoFacts, etiquetteTips, ship, documentCategories,
} from "@/content";

// O Navio é um registro único (slug fixo) — permite editar a página /barco no painel.
export const SHIP_SLUG = "ss-bon-voyage";
export const shipRecord = { slug: SHIP_SLUG, ...ship };

export const CONTENT_KINDS = [
  { kind: "city", label: "Cidades", file: cities },
  { kind: "winery", label: "Vinícolas", file: wineries },
  { kind: "restaurant", label: "Restaurantes", file: restaurants },
  { kind: "wine", label: "Vinhos", file: appellations },
  { kind: "gastronomy", label: "Gastronomia", file: gastronomy },
  { kind: "experience", label: "Experiências", file: experiences },
  { kind: "shopping", label: "Compras", file: shopping },
  { kind: "chef", label: "Chef (Troisgros)", file: chefExperiences },
  { kind: "ship", label: "Navio", file: [shipRecord] },
  { kind: "info_fact", label: "Info úteis", file: infoFacts },
  { kind: "etiquette_tip", label: "Etiqueta", file: etiquetteTips },
  { kind: "document_category", label: "Documentos", file: documentCategories },
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

// Valor "vazio" com o MESMO formato do exemplo (string→"", número→0, lista→[],
// objeto→sub-campos vazios). Preserva o tipo para o editor desenhar o campo certo.
function emptyLike(v: any): any {
  if (Array.isArray(v)) return [];
  if (v && typeof v === "object") {
    const o: Record<string, any> = {};
    for (const k in v) o[k] = emptyLike(v[k]);
    return o;
  }
  if (typeof v === "number") return 0;
  if (typeof v === "boolean") return false;
  return "";
}

// Esqueleto de TODOS os campos possíveis de um tipo (união das chaves de todos os
// itens do arquivo). Usado para: (1) criar ficha nova já com todos os campos e
// (2) revelar campos faltantes ao editar uma ficha existente.
export function kindSkeleton(kind: string): Record<string, any> {
  const src = (CONTENT_KINDS.find((k) => k.kind === kind)?.file as any[]) || [];
  const skel: Record<string, any> = {};
  for (const item of src) {
    for (const [k, v] of Object.entries(item)) {
      if (v == null) continue;
      if (!(k in skel)) {
        skel[k] = emptyLike(v);
      } else if (skel[k] && typeof skel[k] === "object" && !Array.isArray(skel[k]) && typeof v === "object" && !Array.isArray(v)) {
        // une as sub-chaves de objetos aninhados (ex.: practical, scores)
        for (const sk in v as Record<string, any>) if (!(sk in skel[k])) skel[k][sk] = emptyLike((v as any)[sk]);
      }
    }
  }
  return skel;
}

export async function listContent(kind: string): Promise<ContentRow[]> {
  const { data } = await supabase().from("bordeaux_content").select("*").eq("kind", kind).order("sort");
  return (data as ContentRow[]) || [];
}

export async function upsertContent(kind: string, slug: string, data: any, sort: number, published = true) {
  await snapshotVersion(kind, slug);
  return supabase().from("bordeaux_content").upsert({ kind, slug, data, sort, published }, { onConflict: "kind,slug" }).select().single();
}

// ---- Histórico de versões (Undo) ----
export interface VersionRow { id: string; kind: string; slug: string; data: any; saved_by: string | null; created_at: string }

// Salva o estado ATUAL de um item antes de sobrescrevê-lo (para permitir desfazer).
export async function snapshotVersion(kind: string, slug: string) {
  const sb = supabase();
  const { data: row } = await sb.from("bordeaux_content").select("data").eq("kind", kind).eq("slug", slug).maybeSingle();
  if (!row?.data) return;
  const { data: auth } = await sb.auth.getUser();
  await sb.from("bordeaux_content_versions").insert({ kind, slug, data: row.data, saved_by: auth?.user?.email ?? null });
}

export async function listVersions(kind: string, slug: string, limit = 15): Promise<VersionRow[]> {
  const { data } = await supabase()
    .from("bordeaux_content_versions")
    .select("*").eq("kind", kind).eq("slug", slug)
    .order("created_at", { ascending: false }).limit(limit);
  return (data as VersionRow[]) || [];
}

// Restaura uma versão (fazendo antes um snapshot do estado atual — o restore também é reversível).
export async function restoreVersion(v: VersionRow) {
  const sb = supabase();
  await snapshotVersion(v.kind, v.slug);
  const { data: row } = await sb.from("bordeaux_content").select("sort,published").eq("kind", v.kind).eq("slug", v.slug).maybeSingle();
  return sb.from("bordeaux_content").upsert(
    { kind: v.kind, slug: v.slug, data: v.data, sort: (row as any)?.sort ?? 999, published: (row as any)?.published ?? true },
    { onConflict: "kind,slug" }
  );
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

// ---- Edição inline: patch de um único campo ----
export async function updateContentField(kind: string, slug: string, field: string, value: any) {
  const sb = supabase();
  const { data: row } = await sb.from("bordeaux_content").select("data,sort,published").eq("kind", kind).eq("slug", slug).maybeSingle();
  if ((row as any)?.data) {
    const { data: auth } = await sb.auth.getUser();
    await sb.from("bordeaux_content_versions").insert({ kind, slug, data: (row as any).data, saved_by: auth?.user?.email ?? null });
  }
  const base = (row as any)?.data || { slug };
  const merged = { ...base, [field]: value };
  return sb.from("bordeaux_content").upsert(
    { kind, slug, data: merged, sort: (row as any)?.sort ?? 999, published: (row as any)?.published ?? true },
    { onConflict: "kind,slug" }
  );
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

// ---- Páginas customizadas (construtor de blocos) ----
import type { Block } from "@/lib/blocks";
export interface PageRow {
  id: string; slug: string; title: string; icon: string;
  blocks: Block[]; published: boolean; sort: number; updated_at: string;
}

export async function listPages(): Promise<PageRow[]> {
  const { data } = await supabase().from("bordeaux_pages").select("*").order("sort");
  return (data as PageRow[]) || [];
}

export async function createPage(): Promise<PageRow | null> {
  const slug = `pagina-${Math.random().toString(36).slice(2, 7)}`;
  const { data } = await supabase().from("bordeaux_pages")
    .insert({ slug, title: "Nova página", icon: "FileText", blocks: [], published: false, sort: 999 })
    .select().single();
  return (data as PageRow) || null;
}

export async function savePage(p: PageRow) {
  return supabase().from("bordeaux_pages")
    .update({ slug: p.slug, title: p.title, icon: p.icon, blocks: p.blocks, published: p.published, sort: p.sort, updated_at: new Date().toISOString() })
    .eq("id", p.id);
}

export async function setPagePublished(id: string, published: boolean) {
  return supabase().from("bordeaux_pages").update({ published }).eq("id", id);
}

export async function deletePage(id: string) {
  return supabase().from("bordeaux_pages").delete().eq("id", id);
}

export async function updatePageSort(id: string, sort: number) {
  return supabase().from("bordeaux_pages").update({ sort }).eq("id", id);
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
