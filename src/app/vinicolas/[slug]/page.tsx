import type { Metadata } from "next";
import { getWineries, getWinery } from "@/lib/content-db";
import { WineryView } from "./WineryView";

export async function generateStaticParams() {
  const wineries = await getWineries();
  return wineries.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const w = await getWinery(slug);
  return { title: w?.name ?? "Vinícola", description: w?.history?.slice(0, 150) };
}

export default async function WineryDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <WineryView slug={slug} />;
}
