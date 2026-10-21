import { createFileRoute } from "@tanstack/react-router";
import { LinePage } from "@/components/LinePage";

export const Route = createFileRoute("/women")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Women — Ciao D Milano" },
      { name: "description", content: "Women's collection items, prices and sizes." },
      { property: "og:title", content: "Women — Ciao D Milano" },
      { property: "og:description", content: "Women's collection items, prices and sizes." },
    ],
  }),
  component: () => <LinePage line="women" title="Women" />,
});
