import type { Metadata } from "next";
import { getRestaurants, getRestaurant } from "@/lib/content-db";
import { RestaurantView } from "./RestaurantView";

export async function generateStaticParams() {
  const restaurants = await getRestaurants();
  return restaurants.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = await getRestaurant(slug);
  return { title: r?.name ?? "Restaurante", description: r?.description?.slice(0, 150) };
}

export default async function RestaurantDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RestaurantView slug={slug} />;
}
