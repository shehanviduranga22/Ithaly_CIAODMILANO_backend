import { createFileRoute } from "@tanstack/react-router";
import { Shell, StatCard, Table } from "@/components/admin";
import { eur, useMongoCollection, type CustomerRecord, type OrderRecord } from "@/lib/store";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Customers — Ciao D Milano" },
      { name: "description", content: "Client directory and lifetime spend." },
      { property: "og:title", content: "Customers — Ciao D Milano" },
      { property: "og:description", content: "Client directory and lifetime spend." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const customers = useMongoCollection<CustomerRecord>("customers");
  const orders = useMongoCollection<OrderRecord>("orders");
  const cityFor = (customer: CustomerRecord) =>
    customer.city ||
    orders.items.find(
      (order) => order.accountEmail?.toLowerCase() === customer.email?.toLowerCase(),
    )?.shippingAddress?.city ||
    "—";
  const customerOrders = (customer: CustomerRecord) =>
    orders.items.filter(
      (order) => order.accountEmail?.toLowerCase() === customer.email?.toLowerCase(),
    );
  const cities = new Set(customers.items.map(cityFor).filter((city) => city !== "—"));
  const totalPurchases = customers.items.reduce((sum, customer) => {
    return sum + (customer.orders ?? customerOrders(customer).length);
  }, 0);

  return (
    <Shell title="Customers">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Customers"
          value={customers.loading ? "—" : customers.total}
          dark
          number="01"
        />
        <StatCard
          label="Cities represented"
          value={customers.loading || orders.loading ? "—" : cities.size}
          number="02"
        />
        <StatCard
          label="Client purchases"
          value={customers.loading || orders.loading ? "—" : totalPurchases}
          number="03"
        />
      </div>
      <div className="mt-7 flex items-baseline justify-between border-t pt-5">
        <h2 className="font-display text-2xl">The client book</h2>
        <span className="eyebrow text-muted-foreground">{customers.total} clients</span>
      </div>
      {(customers.error || orders.error) && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {customers.error ?? orders.error}
        </p>
      )}
      {customers.loading && (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          Loading customers...
        </p>
      )}
      <Table
        head={["Name", "Email", "City", "Orders", "Total Spent"]}
        rows={customers.items.map((customer) => {
          const name =
            customer.name ||
            [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
            "—";
          const customerOrdersList = customerOrders(customer);
          const purchases = customer.orders ?? customerOrdersList.length;
          const spent =
            customer.spent ??
            customer.totalSpent ??
            customerOrdersList.reduce((sum, order) => sum + (order.totalAmount ?? 0), 0);
          return [
            <span className="flex items-center gap-3">
              <span className="client-initials font-display">
                {name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </span>
              <span className="font-display text-lg">{name}</span>
            </span>,
            <span className="text-muted-foreground">{customer.email ?? "—"}</span>,
            <span className="text-muted-foreground">{cityFor(customer)}</span>,
            purchases,
            eur(spent),
          ];
        })}
      />
    </Shell>
  );
}
