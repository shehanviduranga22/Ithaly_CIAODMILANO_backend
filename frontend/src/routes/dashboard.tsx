import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, ShoppingBag, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Area,
  AreaChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { AddItemDialog, CollectionCard, LineCounts, Shell, StatCard } from "@/components/admin";
import {
  eur,
  useDashboardAnalytics,
  useItems,
  useMongoCollection,
  type CustomerRecord,
  type Line,
  type OrderRecord,
} from "@/lib/store";
import s1 from "@/assets/slide1.jpg";
import s2 from "@/assets/slide2.jpg";
import s3 from "@/assets/slide3.jpg";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ciao D Milano" },
      { name: "description", content: "Overview of orders, customers and collections." },
      { property: "og:title", content: "Dashboard — Ciao D Milano" },
      { property: "og:description", content: "Overview of orders, customers and collections." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const SLIDES = [
  { img: s1, kicker: "Uomo", title: "The Brera Tailoring" },
  { img: s2, kicker: "Donna", title: "Notte in Galleria" },
  { img: s3, kicker: "Accessori", title: "Silk, Leather, Cashmere" },
];

const LINES: { line: Line; label: string }[] = [
  { line: "men", label: "Men" },
  { line: "women", label: "Women" },
  { line: "accessories", label: "Accessories" },
];
const CHART_COLORS = ["#20201e", "#8d7b62", "#c5b69d", "#a9a39a", "#ded6c9"];

function Dashboard() {
  const itemCollection = useItems();
  const items = itemCollection.items;
  const customers = useMongoCollection<CustomerRecord>("customers");
  const orders = useMongoCollection<OrderRecord>("orders");
  const analytics = useDashboardAnalytics();
  const [i, setI] = useState(0);
  const [open, setOpen] = useState<Line | null>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);
  const count = (l: Line) => itemCollection.lineCounts?.[l] ?? 0;
  const counts: Record<Line, number> = {
    men: count("men"),
    women: count("women"),
    accessories: count("accessories"),
  };
  const inventoryTotal = LINES.reduce(
    (total, { line }) => total + (analytics.data?.lineCounts[line] ?? 0),
    0,
  );
  const orderTotal =
    analytics.data?.ordersByMonth.reduce((total, month) => total + month.count, 0) ?? 0;

  return (
    <Shell title="Dashboard">
      <div className="campaign-banner relative overflow-hidden bg-ink">
        {SLIDES.map((s, k) => (
          <div
            key={s.title}
            aria-hidden={k !== i}
            className={`absolute inset-0 transition-opacity duration-1000 ${k === i ? "opacity-100" : "opacity-0"}`}
          >
            <img
              src={s.img}
              alt={s.title}
              width={1600}
              height={640}
              className="h-full w-full object-cover"
            />
            <div className="campaign-shade absolute inset-0" />
            <div className="campaign-copy absolute text-ink-foreground">
              <p className="eyebrow mb-3 opacity-80">Ciao D Milano / {s.kicker}</p>
              <p className="font-display text-4xl">{s.title}</p>
            </div>
          </div>
        ))}
        <div className="absolute bottom-5 right-5 flex gap-1">
          {SLIDES.map((s, k) => (
            <Button
              variant="ghost"
              size="icon"
              key={s.title}
              title={s.title}
              aria-label={`Slide ${k + 1}`}
              aria-pressed={k === i}
              onClick={() => setI(k)}
              className="h-7 w-7 rounded-none text-ink-foreground hover:bg-ink-foreground/10"
            >
              <span
                className={`h-px w-5 bg-ink-foreground ${k === i ? "opacity-100" : "opacity-40"}`}
              />
            </Button>
          ))}
        </div>
      </div>

      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Atelier totals">
        <StatCard
          label="Orders"
          value={orders.loading ? "—" : orders.total}
          dark
          icon={<ShoppingBag size={16} strokeWidth={1.4} />}
          number="01"
        />
        <StatCard
          label="Customers"
          value={customers.loading ? "—" : customers.total}
          icon={<Users size={16} strokeWidth={1.4} />}
          number="02"
        />
      </section>
      {(itemCollection.error || customers.error || orders.error || analytics.error) && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {itemCollection.error ?? customers.error ?? orders.error ?? analytics.error}
        </p>
      )}

      <section className="mt-3" aria-label="Items per collection">
        <LineCounts counts={counts} />
      </section>

      <section className="mt-7 border-t pt-5" aria-label="Collection and order analytics">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl">Atelier at a glance</h2>
          <span className="eyebrow text-muted-foreground">Live collection records</span>
        </div>
        {analytics.loading ? (
          <p className="py-8 text-sm text-muted-foreground">Loading collection analytics…</p>
        ) : analytics.data ? (
          <>
            <div className="dashboard-chart-grid">
              <article className="dashboard-chart-card dashboard-analytics-card">
                <div className="dashboard-analytics-heading">
                  <div className="dashboard-analytics-title">
                    <span className="dashboard-pie-index">01 / COLLECTION STUDY</span>
                    <h3 className="font-display text-xl">Inventory by collection</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Items currently recorded in each collection
                    </p>
                  </div>
                  <div
                    className="dashboard-chart-total"
                    aria-label={`${inventoryTotal} pieces total`}
                  >
                    <strong>{inventoryTotal}</strong>
                    <span>pieces</span>
                  </div>
                </div>
                <div
                  className="dashboard-chart dashboard-bar-chart"
                  role="img"
                  aria-label="Bar chart of inventory counts by collection"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={LINES.map(({ line, label }) => ({
                        name: label,
                        count: analytics.data?.lineCounts[line] ?? 0,
                      }))}
                      margin={{ top: 20, right: 12, left: -18, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--border)"
                        strokeDasharray="3 6"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                        dy={8}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                      />
                      <Tooltip
                        cursor={{ fill: "var(--muted)", opacity: 0.45 }}
                        formatter={(value) => [`${value} pieces`, "Inventory"]}
                        contentStyle={{
                          border: "1px solid var(--border)",
                          borderRadius: 0,
                          backgroundColor: "var(--card)",
                          fontSize: 11,
                        }}
                      />
                      <Bar
                        dataKey="count"
                        name="Items"
                        background={{ fill: "var(--muted)", radius: 3 }}
                        barSize={42}
                        radius={[4, 4, 0, 0]}
                      >
                        {LINES.map((entry, barIndex) => (
                          <Cell key={entry.line} fill={CHART_COLORS[barIndex]} />
                        ))}
                        <LabelList
                          dataKey="count"
                          position="top"
                          fill="var(--foreground)"
                          fontSize={10}
                          offset={8}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
              <article className="dashboard-chart-card dashboard-analytics-card">
                <div className="dashboard-analytics-heading">
                  <div className="dashboard-analytics-title">
                    <span className="dashboard-pie-index">02 / ORDER RHYTHM</span>
                    <h3 className="font-display text-xl">Orders by month</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Based on recorded order dates · last 12 months
                    </p>
                  </div>
                  <div className="dashboard-chart-total" aria-label={`${orderTotal} orders total`}>
                    <strong>{orderTotal}</strong>
                    <span>orders</span>
                  </div>
                </div>
                <div
                  className="dashboard-chart"
                  role="img"
                  aria-label="Line chart of orders by recorded month for the last 12 months"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analytics.data.ordersByMonth}
                      margin={{ top: 20, right: 12, left: -18, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="ordersArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS[1]} stopOpacity={0.28} />
                          <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--border)"
                        strokeDasharray="3 6"
                      />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                        dy={8}
                        tickFormatter={(value: string) =>
                          new Date(`${value}-01T00:00:00Z`).toLocaleDateString("en", {
                            month: "short",
                            year: "2-digit",
                            timeZone: "UTC",
                          })
                        }
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                      />
                      <Tooltip
                        cursor={{ stroke: "var(--border)", strokeDasharray: "3 4" }}
                        formatter={(value) => [`${value} orders`, "Orders"]}
                        labelFormatter={(value: string) =>
                          new Date(`${value}-01T00:00:00Z`).toLocaleDateString("en", {
                            month: "long",
                            year: "numeric",
                            timeZone: "UTC",
                          })
                        }
                        contentStyle={{
                          border: "1px solid var(--border)",
                          borderRadius: 0,
                          backgroundColor: "var(--card)",
                          fontSize: 11,
                        }}
                      />
                      <ReferenceLine y={0} stroke="var(--border)" />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke={CHART_COLORS[1]}
                        strokeWidth={2.5}
                        fill="url(#ordersArea)"
                        activeDot={{
                          r: 5,
                          fill: "var(--card)",
                          stroke: CHART_COLORS[1],
                          strokeWidth: 2,
                        }}
                        dot={{
                          r: 2.5,
                          fill: "var(--card)",
                          stroke: CHART_COLORS[1],
                          strokeWidth: 1.5,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </div>
            <div className="dashboard-chart-grid dashboard-pie-grid">
              {LINES.map(({ line, label }, index) => {
                const categories = analytics.data?.categoryCounts[line] ?? [];
                const total = categories.reduce((sum, category) => sum + category.count, 0);
                const categorySummary = categories
                  .map((category) => `${category.name}: ${category.count}`)
                  .join(", ");
                return (
                  <article className="dashboard-chart-card dashboard-pie-card" key={line}>
                    <div className="dashboard-pie-heading">
                      <span className="dashboard-pie-index">
                        {String(index + 1).padStart(2, "0")} / COLLECTION
                      </span>
                      <h3 className="font-display text-xl">{label} item types</h3>
                      <p className="text-xs text-muted-foreground">A study in the details</p>
                    </div>
                    <div className="dashboard-pie-content">
                      {categories.length ? (
                        <>
                          <div className="dashboard-pie-chart-column">
                            <div
                              className="dashboard-pie-total"
                              aria-label={`${total} pieces total`}
                            >
                              <strong>{total}</strong>
                              <span>pieces</span>
                            </div>
                            <div
                              className="dashboard-pie-visual"
                              role="img"
                              aria-label={`${label} item types: ${total} items. ${categorySummary}`}
                            >
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={categories}
                                    dataKey="count"
                                    nameKey="name"
                                    innerRadius="52%"
                                    outerRadius="76%"
                                    paddingAngle={3}
                                    stroke="var(--card)"
                                    strokeWidth={3}
                                  >
                                    {categories.map((category, categoryIndex) => (
                                      <Cell
                                        key={category.name}
                                        fill={
                                          CHART_COLORS[
                                            (categoryIndex + index) % CHART_COLORS.length
                                          ]
                                        }
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value) => [`${value} items`, "Pieces"]} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                          <ul className="dashboard-pie-legend" aria-label={`${label} categories`}>
                            {categories.map((category, categoryIndex) => (
                              <li key={category.name}>
                                <span
                                  className="dashboard-pie-swatch"
                                  style={{
                                    backgroundColor:
                                      CHART_COLORS[(categoryIndex + index) % CHART_COLORS.length],
                                  }}
                                  aria-hidden="true"
                                />
                                <span className="dashboard-pie-category">{category.name}</span>
                                <span className="dashboard-pie-value">
                                  {total ? Math.round((category.count / total) * 100) : 0}%
                                </span>
                                <span className="dashboard-pie-count">{category.count}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p className="dashboard-pie-empty text-sm text-muted-foreground">
                          No categorized items recorded
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : null}
      </section>

      <section className="mt-7 border-t pt-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl">The collections</h2>
          <span className="eyebrow text-muted-foreground">
            {itemCollection.total} pieces in the atelier
          </span>
        </div>
        <div className="collection-grid grid gap-3">
          <CollectionCard
            title="Men"
            count={count("men")}
            image={s1}
            to="/men"
            number="01 / Uomo"
          />
          <CollectionCard
            title="Women"
            count={count("women")}
            image={s2}
            to="/women"
            number="02 / Donna"
          />
          <CollectionCard
            title="Accessories"
            count={count("accessories")}
            image={s3}
            to="/accessories"
            number="03 / Accessori"
          />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="atelier" onClick={() => setOpen("men")}>
            <Plus />
            Add Men's Item
          </Button>
          <Button variant="editorial" onClick={() => setOpen("women")}>
            <Plus />
            Add Women's Item
          </Button>
          <Button variant="editorial" onClick={() => setOpen("accessories")}>
            <Plus />
            Add Accessories Item
          </Button>
        </div>
      </section>
      <section className="mt-7 border-t pt-5">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl">Fresh from the atelier</h2>
          <span className="eyebrow text-muted-foreground">Latest pieces</span>
        </div>
        <div className="arrival-list">
          {[...items]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)
            .map((item, index) => (
              <Link
                key={item.id}
                to={
                  item.line === "men" ? "/men" : item.line === "women" ? "/women" : "/accessories"
                }
                className="arrival-row"
              >
                <span className="font-display text-xl text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <span className="eyebrow text-muted-foreground">
                    {item.line} / {item.category}
                  </span>
                  <h3 className="font-display mt-1 text-lg">{item.name}</h3>
                </div>
                <span className="ml-auto shrink-0 text-xs">{eur(item.price)}</span>
              </Link>
            ))}
        </div>
      </section>
      {open && <AddItemDialog line={open} onClose={() => setOpen(null)} />}
    </Shell>
  );
}
