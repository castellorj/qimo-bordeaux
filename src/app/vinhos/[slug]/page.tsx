import type { Metadata } from "next";
import { getWines, getWine } from "@/lib/content-db";
import { WineView } from "./WineView";

export async function generateStaticParams() {
  const appellations = await getWines();
  return appellations.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await getWine(slug);
  return { title: a?.name ?? "Vinho", description: a?.tagline };
}

export default async function WineDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <WineView slug={slug} />;
}
