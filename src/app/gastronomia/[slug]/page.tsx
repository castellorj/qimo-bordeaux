import type { Metadata } from "next";
import { getGastronomy, getGastronomyItem } from "@/lib/content-db";
import { GastronomyView } from "./GastronomyView";

export async function generateStaticParams() {
  const items = await getGastronomy();
  return items.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = await getGastronomyItem(slug);
  return { title: g?.name ?? "Gastronomia", description: g?.description?.slice(0, 150) };
}

export default async function GastronomyDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GastronomyView slug={slug} />;
}
