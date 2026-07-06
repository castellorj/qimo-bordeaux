import type { Metadata } from "next";
import { getExperiences, getExperience } from "@/lib/content-db";
import { ExperienceView } from "./ExperienceView";

export async function generateStaticParams() {
  const experiences = await getExperiences();
  return experiences.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = await getExperience(slug);
  return { title: e?.name ?? "Experiência", description: e?.description?.slice(0, 150) };
}

export default async function ExperienceDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ExperienceView slug={slug} />;
}
