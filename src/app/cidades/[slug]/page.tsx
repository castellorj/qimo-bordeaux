import type { Metadata } from "next";
import { getCities, getCity } from "@/lib/content-db";
import { CityView } from "./CityView";

export async function generateStaticParams() {
  const cities = await getCities();
  return cities.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCity(slug);
  return { title: c?.name ?? "Cidade", description: c?.tagline };
}

export default async function CityDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CityView slug={slug} />;
}
