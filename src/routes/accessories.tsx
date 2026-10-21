import { createFileRoute } from "@tanstack/react-router";
import { LinePage } from "@/components/LinePage";

export const Route = createFileRoute("/accessories")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Accessories — Ciao D Milano" },
      { name: "description", content: "Accessories collection items, prices and sizes." },
      { property: "og:title", content: "Accessories — Ciao D Milano" },
      { property: "og:description", content: "Accessories collection items, prices and sizes." },
    ],
  }),
  component: () => <LinePage line="accessories" title="Accessories" />,
});
