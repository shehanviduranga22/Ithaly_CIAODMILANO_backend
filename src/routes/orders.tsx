import { createFileRoute } from "@tanstack/react-router";
import { Shell, StatCard, Table } from "@/components/admin";
import { eur, useMongoCollection, type OrderRecord } from "@/lib/store";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Orders — Ciao D Milano" },
      { name: "description", content: "All client orders and their status." },
      { property: "og:title", content: "Orders — Ciao D Milano" },
      { property: "og:description", content: "All client orders and their status." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const orders = useMongoCollection<OrderRecord>("orders");
  const delivered = orders.items.filter((order) => order.status?.toLowerCase() === "delivered").length;
  const inProgress = orders.items.filter((order) => ["processing", "shipped"].includes(order.status?.toLowerCase() ?? "")).length;

  return (
    <Shell title="Orders">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total Orders" value={orders.loading ? "—" : orders.total} dark number="01" />
        <StatCard label="Delivered" value={orders.loading ? "—" : delivered} number="02" />
        <StatCard label="In progress" value={orders.loading ? "—" : inProgress} number="03" />
      </div>
      <div className="mt-7 flex items-baseline justify-between border-t pt-5"><h2 className="font-display text-2xl">Order journal</h2><span className="eyebrow text-muted-foreground">{orders.total} entries</span></div>
      {orders.error && <p role="alert" className="mt-4 text-sm text-destructive">{orders.error}</p>}
      {orders.loading && <p role="status" className="mt-4 text-sm text-muted-foreground">Loading orders...</p>}
      <Table head={["Order", "Customer", "Item", "Total", "Status", "Date"]}
        rows={orders.items.map((order) => {
          const status = order.status || "—";
          const customer = [order.shippingAddress?.firstName, order.shippingAddress?.lastName].filter(Boolean).join(" ") || order.accountEmail || order.contactInformation?.email || "—";
          const item = order.purchasedItems?.map((product) => product.name).filter(Boolean).join(", ") || "—";
          const date = order.createdAt && !Number.isNaN(Date.parse(order.createdAt)) ? new Date(order.createdAt).toISOString().slice(0, 10) : "—";
          return [
            <span className="text-muted-foreground">{order.id}</span>,
            customer,
            <span className="font-display text-base">{item}</span>,
            eur(order.totalAmount ?? 0),
            <span className={`order-status ${status === "Delivered" ? "status-complete" : status === "Cancelled" ? "status-cancelled" : "status-pending"}`}><span />{status}</span>,
            date,
          ];
        })} />
    </Shell>
  );
}
