import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Shell, StatCard, Table } from "@/components/admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectedOrder = orders.items.find((order) => order.id === selectedOrderId);
  const additionalOrderDetails = selectedOrder
    ? Object.fromEntries(
        Object.entries(selectedOrder).filter(
          ([key, value]) =>
            ![
              "id",
              "accountEmail",
              "contactInformation",
              "billingAddress",
              "shippingAddress",
              "purchasedItems",
              "totalAmount",
              "currency",
              "status",
              "createdAt",
            ].includes(key) &&
            value !== undefined &&
            value !== null &&
            value !== "",
        ),
      )
    : {};

  return (
    <Shell title="Orders">
      <div className="grid gap-3">
        <StatCard
          label="Total Orders"
          value={orders.loading ? "—" : orders.total}
          dark
          number="01"
        />
      </div>
      <div className="mt-7 flex items-baseline justify-between border-t pt-5">
        <h2 className="font-display text-2xl">Order journal</h2>
        <span className="eyebrow text-muted-foreground">{orders.total} entries</span>
      </div>
      {orders.error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {orders.error}
        </p>
      )}
      {orders.loading && (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          Loading orders...
        </p>
      )}
      <Table
        head={["Order", "Customer", "Item", "Total", "Status", "Date", ""]}
        rows={orders.items.map((order) => {
          const status = order.status || "—";
          const customer =
            [order.shippingAddress?.firstName, order.shippingAddress?.lastName]
              .filter(Boolean)
              .join(" ") ||
            order.accountEmail ||
            order.contactInformation?.email ||
            "—";
          const item =
            order.purchasedItems
              ?.map((product) => product.name)
              .filter(Boolean)
              .join(", ") || "—";
          const date =
            order.createdAt && !Number.isNaN(Date.parse(order.createdAt))
              ? new Date(order.createdAt).toISOString().slice(0, 10)
              : "—";
          return [
            <span className="text-muted-foreground">{order.id}</span>,
            customer,
            <span className="font-display text-base">{item}</span>,
            eur(order.totalAmount ?? 0),
            <span
              className={`order-status ${status === "Delivered" ? "status-complete" : status === "Cancelled" ? "status-cancelled" : "status-pending"}`}
            >
              <span />
              {status}
            </span>,
            date,
            <button
              type="button"
              className="text-primary underline-offset-4 hover:underline"
              onClick={() => setSelectedOrderId(order.id)}
              aria-haspopup="dialog"
              aria-expanded={selectedOrderId === order.id}
            >
              View details
            </button>,
          ];
        })}
      />
      <Dialog
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => {
          if (!open) setSelectedOrderId(null);
        }}
      >
        {selectedOrder && (
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader className="border-b pb-4 pr-8 text-left">
              <p className="eyebrow text-muted-foreground">Order details</p>
              <DialogTitle className="break-all font-display text-2xl">
                {selectedOrder.orderNumber || selectedOrder.id}
              </DialogTitle>
              <DialogDescription>Complete information for this order.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="eyebrow text-muted-foreground">Order summary</h3>
                <dl className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <DetailField label="Order ID">{selectedOrder.id}</DetailField>
                  <DetailField label="Status">{selectedOrder.status || "—"}</DetailField>
                  <DetailField label="Order date">
                    {selectedOrder.createdAt && !Number.isNaN(Date.parse(selectedOrder.createdAt))
                      ? new Date(selectedOrder.createdAt).toISOString().slice(0, 10)
                      : "—"}
                  </DetailField>
                  <DetailField label="Total">
                    {selectedOrder.totalAmount === undefined
                      ? "—"
                      : `${eur(selectedOrder.totalAmount)}${selectedOrder.currency && selectedOrder.currency !== "EUR" ? ` (${selectedOrder.currency})` : ""}`}
                  </DetailField>
                  <DetailField label="Account email">
                    {selectedOrder.accountEmail || selectedOrder.contactInformation?.email || "—"}
                  </DetailField>
                </dl>
              </section>
              {selectedOrder.contactInformation &&
                Object.keys(selectedOrder.contactInformation).length > 0 && (
                  <section className="border-t pt-5">
                    <h3 className="eyebrow text-muted-foreground">Contact information</h3>
                    <DetailEntries details={selectedOrder.contactInformation} />
                  </section>
                )}
              {selectedOrder.billingAddress &&
                Object.keys(selectedOrder.billingAddress).length > 0 && (
                  <section className="border-t pt-5">
                    <h3 className="eyebrow text-muted-foreground">Billing address</h3>
                    <DetailEntries details={selectedOrder.billingAddress} />
                  </section>
                )}
              {selectedOrder.shippingAddress &&
                Object.keys(selectedOrder.shippingAddress).length > 0 && (
                  <section className="border-t pt-5">
                    <h3 className="eyebrow text-muted-foreground">Shipping address</h3>
                    <DetailEntries details={selectedOrder.shippingAddress} />
                  </section>
                )}
              <section className="border-t pt-5">
                <h3 className="eyebrow text-muted-foreground">Items ordered</h3>
                {selectedOrder.purchasedItems?.length ? (
                  <ul className="mt-3 divide-y">
                    {selectedOrder.purchasedItems.map((item, index) => (
                      <li key={`${item.name ?? "item"}-${index}`} className="py-3 first:pt-0">
                        <OrderDetailValue value={item} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-muted-foreground">No item details available.</p>
                )}
              </section>
              {Object.keys(additionalOrderDetails).length > 0 && (
                <section className="border-t pt-5">
                  <h3 className="eyebrow text-muted-foreground">Additional order information</h3>
                  <DetailEntries details={additionalOrderDetails} />
                </section>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </Shell>
  );
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="eyebrow text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words">{children}</dd>
    </div>
  );
}

function DetailEntries({ details }: { details: Record<string, unknown> }) {
  const entries = Object.entries(details).filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
  );

  if (!entries.length) return <p className="mt-3 text-muted-foreground">No details available.</p>;

  return (
    <dl className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <DetailField key={key} label={formatLabel(key)}>
          <OrderDetailValue value={value} />
        </DetailField>
      ))}
    </dl>
  );
}

function OrderDetailValue({ value }: { value: unknown }): ReactNode {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) {
    return value.length ? (
      <ul className="space-y-1">
        {value.map((item, index) => (
          <li key={index}>
            <OrderDetailValue value={item} />
          </li>
        ))}
      </ul>
    ) : (
      "—"
    );
  }
  if (typeof value === "object") {
    return (
      <dl className="grid gap-3">
        {Object.entries(value).map(([key, nestedValue]) => (
          <DetailField key={key} label={formatLabel(key)}>
            <OrderDetailValue value={nestedValue} />
          </DetailField>
        ))}
      </dl>
    );
  }
  return String(value);
}

function formatLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
