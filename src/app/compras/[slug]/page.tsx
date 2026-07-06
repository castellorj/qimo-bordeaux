import type { Metadata } from "next";
import { getShopping, getShoppingItem } from "@/lib/content-db";
import { ShoppingView } from "./ShoppingView";

export async function generateStaticParams() {
  const items = await getShopping();
  return items.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = await getShoppingItem(slug);
  return { title: s?.name ?? "Compras", description: s?.description?.slice(0, 150) };
}

export default async function ShoppingDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ShoppingView slug={slug} />;
}
