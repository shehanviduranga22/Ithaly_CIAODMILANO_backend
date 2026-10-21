import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, ShoppingBag, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddItemDialog, CollectionCard, LineCounts, Shell, StatCard } from "@/components/admin";
import { eur, isNew, useItems, useMongoCollection, type CustomerRecord, type Line, type OrderRecord } from "@/lib/store";
import s1 from "@/assets/slide1.jpg";
import s2 from "@/assets/slide2.jpg";
import s3 from "@/assets/slide3.jpg";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [
    { title: "Dashboard — Ciao D Milano" },
    { name: "description", content: "Overview of orders, customers and collections." },
    { property: "og:title", content: "Dashboard — Ciao D Milano" },
    { property: "og:description", content: "Overview of orders, customers and collections." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Dashboard,
});

const SLIDES = [
  { img: s1, kicker: "Uomo", title: "The Brera Tailoring" },
  { img: s2, kicker: "Donna", title: "Notte in Galleria" },
  { img: s3, kicker: "Accessori", title: "Silk, Leather, Cashmere" },
];

function Dashboard() {
  const itemCollection = useItems();
  const items = itemCollection.items;
  const customers = useMongoCollection<CustomerRecord>("customers");
  const orders = useMongoCollection<OrderRecord>("orders");
  const [i, setI] = useState(0);
  const [open, setOpen] = useState<Line | null>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);
  const count = (l: Line) => items.filter((x) => x.line === l).length;
  const counts: Record<Line, number> = { men: count("men"), women: count("women"), accessories: count("accessories") };

  return (
    <Shell title="Dashboard">
      <div className="campaign-banner relative overflow-hidden bg-ink">
        {SLIDES.map((s, k) => <div key={s.title} aria-hidden={k !== i} className={`absolute inset-0 transition-opacity duration-1000 ${k === i ? "opacity-100" : "opacity-0"}`}>
          <img src={s.img} alt={s.title} width={1600} height={640} className="h-full w-full object-cover" />
          <div className="campaign-shade absolute inset-0" />
          <div className="campaign-copy absolute text-ink-foreground"><p className="eyebrow mb-3 opacity-80">Ciao D Milano / {s.kicker}</p><p className="font-display text-4xl">{s.title}</p></div>
        </div>)}
        <div className="absolute bottom-5 right-5 flex gap-1">{SLIDES.map((s, k) => <Button variant="ghost" size="icon" key={s.title} title={s.title} aria-label={`Slide ${k + 1}`} aria-pressed={k === i} onClick={() => setI(k)} className="h-7 w-7 rounded-none text-ink-foreground hover:bg-ink-foreground/10"><span className={`h-px w-5 bg-ink-foreground ${k === i ? "opacity-100" : "opacity-40"}`} /></Button>)}</div>
      </div>

      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Atelier totals">
        <StatCard label="Orders" value={orders.loading ? "—" : orders.total} dark icon={<ShoppingBag size={16} strokeWidth={1.4} />} number="01" />
        <StatCard label="Customers" value={customers.loading ? "—" : customers.total} icon={<Users size={16} strokeWidth={1.4} />} number="02" />
        <StatCard label="New arrivals" value={itemCollection.loading ? "—" : items.filter(isNew).length} icon={<Sparkles size={16} strokeWidth={1.4} />} number="03" />
      </section>
      {(itemCollection.error || customers.error || orders.error) && <p role="alert" className="mt-3 text-sm text-destructive">{itemCollection.error ?? customers.error ?? orders.error}</p>}

      <section className="mt-3" aria-label="Items per collection">
        <LineCounts counts={counts} />
      </section>

      <section className="mt-7 border-t pt-5">
        <div className="mb-4 flex items-baseline justify-between"><h2 className="font-display text-2xl">The collections</h2><span className="eyebrow text-muted-foreground">{itemCollection.total} pieces in the atelier</span></div>
        <div className="collection-grid grid gap-3">
          <CollectionCard title="Men" count={count("men")} image={s1} to="/men" number="01 / Uomo" />
          <CollectionCard title="Women" count={count("women")} image={s2} to="/women" number="02 / Donna" />
          <CollectionCard title="Accessories" count={count("accessories")} image={s3} to="/accessories" number="03 / Accessori" />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="atelier" onClick={() => setOpen("men")}><Plus />Add Men's Item</Button>
          <Button variant="editorial" onClick={() => setOpen("women")}><Plus />Add Women's Item</Button>
          <Button variant="editorial" onClick={() => setOpen("accessories")}><Plus />Add Accessories Item</Button>
        </div>
      </section>
      <section className="mt-7 border-t pt-5">
        <div className="mb-4 flex items-baseline justify-between gap-4"><h2 className="font-display text-2xl">Fresh from the atelier</h2><span className="eyebrow text-muted-foreground">Latest pieces</span></div>
        <div className="arrival-list">{[...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3).map((item, index) => <Link key={item.id} to={item.line === "men" ? "/men" : item.line === "women" ? "/women" : "/accessories"} className="arrival-row"><span className="font-display text-xl text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><span className="eyebrow text-muted-foreground">{item.line} / {item.category}</span><h3 className="font-display mt-1 text-lg">{item.name}</h3></div><span className="ml-auto shrink-0 text-xs">{eur(item.price)}</span></Link>)}</div>
      </section>
      {open && <AddItemDialog line={open} onClose={() => setOpen(null)} />}
    </Shell>
  );
}
