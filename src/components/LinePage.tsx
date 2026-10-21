import { useState } from "react";
import { Plus, Search, Grid2X2, List, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddItemDialog, ItemTable, Shell } from "@/components/admin";
import { PieceCard, PieceDetails } from "@/components/collection-items";
import { CATEGORIES, LINE_LABEL, eur, isNew, useMongoCollection, type Item, type Line } from "@/lib/store";
import menImage from "@/assets/slide1.jpg";
import womenImage from "@/assets/slide2.jpg";
import accessoriesImage from "@/assets/slide3.jpg";

const EDITORIAL = {
  men: { image: menImage, label: "01 / Uomo", title: "The art of tailoring" },
  women: { image: womenImage, label: "02 / Donna", title: "An expression of elegance" },
  accessories: { image: accessoriesImage, label: "03 / Accessori", title: "The finishing touch" },
};

export function LinePage({ line, title }: { line: Line; title: string }) {
  const collection = useMongoCollection<Item>(line);
  const items = collection.items;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All pieces");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState<Item | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const editorial = EDITORIAL[line];
  const shown = items.filter((item) => (category === "All pieces" || item.category === category) && `${item.name} ${item.design} ${item.category}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : sort === "name" ? a.name.localeCompare(b.name) : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const prices = items.map((item) => item.price);
  const deleteItem = async (item: Item) => {
    setDeletingId(item.id);
    setActionError("");
    try {
      const response = await fetch(`/api/items/${line}/${item.id}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to delete item.");
      if (selected?.id === item.id) setSelected(null);
      window.dispatchEvent(new Event("cdm:data-changed"));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to delete item.");
    } finally {
      setDeletingId(null);
    }
  };
  return (
    <Shell title={title}>
      <section className="collection-cover relative overflow-hidden bg-ink">
        <img src={editorial.image} alt={`${title} editorial collection`} className="absolute inset-0 h-full w-full object-cover" />
        <div className="campaign-shade absolute inset-0" />
        <div className="relative flex h-full flex-col justify-end p-6 text-ink-foreground sm:p-8"><p className="eyebrow mb-3">Ciao D Milano / {editorial.label}</p><h2 className="font-display max-w-md text-4xl">{editorial.title}</h2></div>
        <ArrowDownRight className="absolute right-6 top-6 text-ink-foreground" size={24} strokeWidth={1} />
      </section>
      {collection.error && <p role="alert" className="mt-4 text-sm text-destructive">{collection.error}</p>}
      {actionError && <p role="alert" className="mt-4 text-sm text-destructive">{actionError}</p>}
      {collection.loading && <p role="status" className="mt-4 text-sm text-muted-foreground">Loading collection...</p>}
      <div className="collection-facts grid grid-cols-3 border-b">
        <div><span className="eyebrow text-muted-foreground">Collection</span><p className="font-display text-2xl">{collection.total} <span className="text-sm">pieces</span></p></div>
        <div><span className="eyebrow text-muted-foreground">New arrivals</span><p className="font-display text-2xl">{items.filter(isNew).length}</p></div>
        <div><span className="eyebrow text-muted-foreground">Price range</span><p className="mt-2 text-xs">{prices.length ? `${eur(Math.min(...prices))} — ${eur(Math.max(...prices))}` : "—"}</p></div>
      </div>
      <div className="mb-5 mt-6 flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow mb-1 text-muted-foreground">The collection edit</p><h2 className="font-display text-2xl">All pieces <span className="ml-2 align-top font-sans text-xs text-muted-foreground">{shown.length.toString().padStart(2, "0")}</span></h2></div><Button variant="atelier" onClick={() => setOpen(true)}><Plus />Add {LINE_LABEL[line]} Item</Button></div>
      <div className="collection-toolbar flex flex-wrap items-center justify-between gap-3 border-y py-3">
        <label className="flex min-w-0 items-center gap-2"><Search size={14} className="text-muted-foreground" /><input aria-label="Search collection" placeholder="Search pieces…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-40 bg-transparent text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring" /></label>
        <div className="flex flex-wrap items-center gap-3"><select aria-label="Sort pieces" value={sort} onChange={(e) => setSort(e.target.value)} className="max-w-full bg-card p-2 text-xs"><option value="newest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A–Z</option></select><div className="flex border-l pl-2"><Button variant={view === "grid" ? "editorial" : "ghost"} size="icon" aria-label="Grid view" title="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}><Grid2X2 /></Button><Button variant={view === "list" ? "editorial" : "ghost"} size="icon" aria-label="List view" title="List view" aria-pressed={view === "list"} onClick={() => setView("list")}><List /></Button></div></div>
      </div>
      <div className="my-4 flex flex-wrap gap-2">{["All pieces", ...CATEGORIES[line]].map((c) => <Button key={c} size="sm" variant={c === category ? "atelier" : "ghost"} aria-pressed={c === category} onClick={() => setCategory(c)}>{c} <span className="opacity-50">{c === "All pieces" ? items.length : items.filter((item) => item.category === c).length}</span></Button>)}</div>
      {shown.length ? view === "grid" ? <div className="pieces-grid">{shown.map((item) => <PieceCard key={item.id} item={item} onSelect={() => setSelected(item)} onEdit={() => setEditing(item)} onDelete={() => setPendingDelete(item)} busy={deletingId === item.id} />)}</div> : <ItemTable items={shown} onEdit={setEditing} onDelete={setPendingDelete} deletingId={deletingId} /> : <div className="border-y py-12 text-center"><h3 className="font-display text-2xl">No pieces found</h3><Button variant="editorial" className="mt-4" onClick={() => { setQuery(""); setCategory("All pieces"); }}>Clear filters</Button></div>}
      <footer className="mt-8 flex justify-between gap-3 border-t pt-4 text-[10px] text-muted-foreground"><span>CIAO D MILANO · {editorial.label.split(" / ")[1]}</span><span>{shown.length} of {items.length} pieces</span></footer>
      {open && <AddItemDialog line={line} onClose={() => setOpen(false)} />}
      {editing && <AddItemDialog key={editing.id} line={line} item={editing} onClose={() => setEditing(null)} />}
      {selected && <PieceDetails item={selected} onClose={() => setSelected(null)} />}
      <AlertDialog open={pendingDelete !== null} onOpenChange={(isOpen) => { if (!isOpen) setPendingDelete(null); }}>
        <AlertDialogContent className="max-w-md rounded-none border-border bg-card p-7 shadow-2xl sm:p-8">
          <AlertDialogHeader className="space-y-3 text-left">
            <p className="eyebrow text-muted-foreground">Ciao D Milano / Collection edit</p>
            <AlertDialogTitle className="font-display text-3xl font-normal">
              Remove this piece?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {pendingDelete && (
                <>
                  <span className="font-medium text-foreground">{pendingDelete.name}</span>
                  {" will be removed from the "}
                  {title}
                  {" collection. This action cannot be undone."}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:space-x-0">
            <AlertDialogCancel asChild>
              <Button type="button" variant="editorial">Keep piece</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (pendingDelete) void deleteItem(pendingDelete);
                  setPendingDelete(null);
                }}
              >
                Remove piece
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}
