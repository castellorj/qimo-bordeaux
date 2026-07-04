import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { SmartImage } from "@/components/SmartImage";
import { ActionBar } from "@/components/ActionBar";
import { FavoriteButton, QimoSeal, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { restaurantActions } from "@/lib/reserve";
import { getRestaurants } from "@/lib/content-db";

export const metadata: Metadata = { title: "Restaurantes" };

export default async function RestaurantesPage() {
  const restaurants = await getRestaurants();
  return (
    <>
      <PageHero section="restaurantes" small />
      <div className="container-editorial py-10">
        <div className="grid gap-6 md:grid-cols-2">
          {restaurants.map((r) => (
            <article key={r.slug} id={r.slug} className="card scroll-mt-24 overflow-hidden">
              <div className="relative">
                <SmartImage src={r.heroImage} alt={r.name} label={r.name} ratio="aspect-[16/9]" />
                <div className="absolute right-3 top-3">
                  <FavoriteButton id={`resto:${r.slug}`} floating />
                </div>
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                  <Pill icon="MapPin">{r.city}</Pill>
                  {r.stars && <Pill icon="Star">{r.stars}</Pill>}
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-2xl font-light leading-tight">{r.name}</h2>
                  {r.qimoSelect && <QimoSeal />}
                </div>
                {r.chef && <p className="mt-1 font-sans text-[12px] text-gold-deep">{r.chef}</p>}
                <p className="mt-3 font-sans text-[13px] leading-relaxed text-muted">{r.description}</p>

                {/* Ficha rápida */}
                <div className="mt-4 space-y-1.5 font-sans text-[12px]" style={{ color: "var(--text-muted)" }}>
                  {r.specialty && (
                    <p className="flex items-center gap-2"><Icon name="UtensilsCrossed" size={13} className="text-gold-deep" /> {r.specialty}</p>
                  )}
                  {r.averageTicket && (
                    <p className="flex items-center gap-2"><Icon name="Wallet" size={13} className="text-gold-deep" /> {r.averageTicket}</p>
                  )}
                  {r.dressCode && (
                    <p className="flex items-center gap-2"><Icon name="Shirt" size={13} className="text-gold-deep" /> {r.dressCode}</p>
                  )}
                  {r.days && (
                    <p className="flex items-center gap-2"><Icon name="Clock" size={13} className="text-gold-deep" /> {r.days}</p>
                  )}
                  {r.reservationRequired && (
                    <p className="flex items-center gap-2"><Icon name="Check" size={13} className="text-gold-deep" /> Reserva recomendada</p>
                  )}
                </div>

                <div className="mt-5">
                  <ActionBar actions={restaurantActions(r)} channelLabel={r.bookingChannel} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
