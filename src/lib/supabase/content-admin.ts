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
