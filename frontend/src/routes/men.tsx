import { createFileRoute } from "@tanstack/react-router";
import { LinePage } from "@/components/LinePage";

export const Route = createFileRoute("/men")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Men — Ciao D Milano" },
      { name: "description", content: "Men's collection items, prices and sizes." },
      { property: "og:title", content: "Men — Ciao D Milano" },
      { property: "og:description", content: "Men's collection items, prices and sizes." },
    ],
  }),
  component: () => <LinePage line="men" title="Men" />,
});
