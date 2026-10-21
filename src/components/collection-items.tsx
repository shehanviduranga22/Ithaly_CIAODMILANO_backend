import { ArrowUpRight, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { eur, isNew, type Item } from "@/lib/store";

export function PieceCard({
  item,
  onSelect,
  onEdit,
  onDelete,
  busy,
}: {
  item: Item;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return <article className="piece-card group">
    <Button variant="ghost" onClick={onSelect} className="piece-visual relative block h-auto w-full overflow-hidden p-0 text-left" aria-label={`View ${item.name}`}>
      {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="piece-placeholder"><span className="eyebrow text-muted-foreground">{item.category}</span><span className="font-display">{item.name.split(" ")[0]}</span><span className="eyebrow text-muted-foreground">Ciao D Milano</span></div>}
      {isNew(item) && <span className="absolute left-3 top-3 bg-card px-2 py-1 text-[9px] uppercase">New arrival</span>}
      <span className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center bg-card text-foreground"><ArrowUpRight size={14} /></span>
    </Button>
    <div className="pt-3"><div className="mb-2 flex items-center justify-between gap-2"><span className="eyebrow text-muted-foreground">{item.category}</span><span className="text-xs">{eur(item.price)}</span></div><h3 className="font-display text-xl leading-tight">{item.name}</h3><p className="mt-2 line-clamp-2 min-h-8 text-[11px] leading-relaxed text-muted-foreground">{item.design || "—"}</p><div className="mt-3 border-t pt-2 text-[10px] text-muted-foreground">Sizes · {item.sizes}</div>
      <div className="mt-3 flex gap-2">
        <Button type="button" variant="editorial" size="sm" disabled={busy} onClick={onEdit}><Pencil size={14} />Update</Button>
        <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={onDelete}><Trash2 size={14} />{busy ? "Deleting..." : "Delete"}</Button>
      </div>
    </div>
  </article>;
}

export function PieceDetails({ item, onClose }: { item: Item; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-labelledby="piece-title" className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-card p-6 sm:p-8" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <Button autoFocus variant="ghost" size="icon" aria-label="Close item details" onClick={onClose} className="absolute right-3 top-3"><X /></Button>
      <p className="eyebrow mb-5 text-muted-foreground">Collection / {item.category}</p>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="detail-visual">{item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-contain" /> : <div className="piece-placeholder"><span className="eyebrow text-muted-foreground">{item.category}</span><span className="font-display">{item.name.split(" ")[0]}</span><span className="eyebrow text-muted-foreground">Ciao D Milano</span></div>}</div>
        <div><h2 id="piece-title" className="font-display text-3xl">{item.name}</h2><p className="mt-4 text-lg">{eur(item.price)}</p><dl className="mt-7 space-y-5"><div className="border-t pt-4"><dt className="eyebrow text-muted-foreground">Design</dt><dd className="mt-2 text-sm leading-relaxed">{item.design || "—"}</dd></div><div className="border-t pt-4"><dt className="eyebrow text-muted-foreground">Available sizes</dt><dd className="mt-2 text-sm">{item.sizes}</dd></div><div className="border-t pt-4"><dt className="eyebrow text-muted-foreground">Item reference</dt><dd className="mt-2 break-all text-xs">{item.id}</dd></div></dl></div>
      </div>
    </section>
  </div>;
}