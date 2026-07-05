import { PageHero } from "@/components/PageHero";
import { HubGridIcons } from "@/components/Hub";
import { viagemLinks } from "@/lib/nav";

export default function ViagemPage() {
  return (
    <>
      <PageHero section="viagem" small />
      <div className="container-editorial py-10">
        <HubGridIcons items={viagemLinks} orderKey="viagem" />
      </div>
    </>
  );
}
