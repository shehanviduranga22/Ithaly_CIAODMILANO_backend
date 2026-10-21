import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDownRight, ImagePlus, LayoutGrid, ShoppingBag, Users, Shirt, Gem, LogOut, Plus, X, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import s1 from "@/assets/slide1.jpg";
import s2 from "@/assets/slide2.jpg";
import s3 from "@/assets/slide3.jpg";
import { AUTH_KEY, CATEGORIES, LINE_LABEL, eur, isAuthed, notifyItemSaved, type Item, type Line } from "@/lib/store";

const SIZE_OPTIONS: Record<Line, string[]> = {
  men: ["XS", "S", "M", "L", "XL", "XXL", "39", "40", "41", "42", "43", "44", "45", "46", "One Size"],
  women: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "34", "36", "38", "40", "42", "44", "46", "48", "One Size"],
  accessories: ["One Size", "XS", "S", "M", "L", "XL"],
};

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/orders", label: "Orders", icon: ShoppingBag },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/men", label: "Men", icon: Shirt },
  { to: "/women", label: "Women", icon: Shirt },
  { to: "/accessories", label: "Accessories", icon: Gem },
] as const;

export function Shell({ title, children }: { title: string; children: ReactNode }) {
  const nav = useNavigate();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!isAuthed()) nav({ to: "/", replace: true });
    else setOk(true);
  }, [nav]);
  if (!ok) return null;
  return (
    <div className="admin-shell min-h-screen">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <Link to="/dashboard" className="font-display text-xl">CIAO D MILANO</Link>
          <div className="eyebrow mt-2 opacity-60">Atelier console</div><span className="sidebar-edition">Collection / Milano</span>
        </div>
        <nav className="sidebar-nav" aria-label="Console navigation">
          {NAV.map((n, i) => (
            <Link key={n.to} to={n.to} className={`sidebar-link ${i === 3 ? "collection-nav-start" : ""}`}
              activeProps={{ className: "sidebar-link-active" }}>
              <n.icon size={16} strokeWidth={1.4} /><span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p className="font-display text-lg italic">Milano, always.</p>
          <Button variant="ghost" onClick={() => { localStorage.removeItem(AUTH_KEY); nav({ to: "/", replace: true }); }}
            className="mt-4 justify-start px-0 text-xs opacity-65 hover:opacity-100"><LogOut size={14} />Sign out</Button>
        </div>
      </aside>
      <main className="admin-main min-w-0">
        <header className="page-header">
          <div><p className="eyebrow mb-2 text-muted-foreground">Ciao D Milano / Atelier</p>
          <h1 className="font-display text-4xl">{title}</h1></div>
          <span className="eyebrow hidden text-muted-foreground sm:block">The quiet luxury of Milan</span>
        </header>
        {children}
      </main>
    </div>
  );
}

export function StatCard({ label, value, dark, icon, number }: { label: string; value: ReactNode; dark?: boolean; icon?: ReactNode; number?: string }) {
  return (
    <div className={`metric-card ${dark ? "metric-dark" : "bg-card"}`}>
      <div className="flex items-center justify-between gap-3"><p className="eyebrow opacity-70">{label}</p><span className="opacity-55">{icon || <ArrowDownRight size={17} strokeWidth={1.3} />}</span></div>
      <div className="mt-3 flex items-end justify-between gap-3"><p className="metric-value font-display text-4xl leading-none">{value}</p><span className="eyebrow shrink-0 opacity-40">{number || "Atelier"}</span></div>
    </div>
  );
}

export function CollectionCard({ title, count, image, to, number }: { title: string; count: number; image: string; to: "/men" | "/women" | "/accessories"; number: string }) {
  return <Link to={to} className="collection-card group">
    <div className="collection-image"><img src={image} alt={`${title} collection`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
    <div className="flex min-w-0 flex-1 flex-col justify-between p-5">
      <div className="flex justify-between"><span className="eyebrow text-muted-foreground">{number}</span><ArrowDownRight size={16} strokeWidth={1.3} /></div>
      <div><h3 className="font-display text-2xl">{title}</h3><p className="mt-1 text-[10px] text-muted-foreground">{count} pieces</p></div>
    </div>
  </Link>;
}

const LINE_CELLS = [
  { line: "men", label: "Men", kicker: "Uomo", to: "/men", image: s1 },
  { line: "women", label: "Women", kicker: "Donna", to: "/women", image: s2 },
  { line: "accessories", label: "Accessories", kicker: "Accessori", to: "/accessories", image: s3 },
] as const;

export function LineCounts({ counts }: { counts: Record<Line, number> }) {
  return (
    <div className="counts-strip" aria-label="Items per collection">
      {LINE_CELLS.map((c) => (
        <Link key={c.line} to={c.to} className="counts-cell">
          <img src={c.image} alt="" aria-hidden className="counts-bg" />
          <span className="counts-scrim" aria-hidden />
          <span className="eyebrow relative z-10">{c.label} / {c.kicker}</span>
          <span className="relative z-10 flex items-baseline gap-2">
            <span className="counts-num font-display">{counts[c.line]}</span>
            <span className="eyebrow">{counts[c.line] === 1 ? "piece" : "pieces"}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="mt-6 overflow-x-auto border bg-card">
      <table className="w-full text-xs">
        <thead><tr className="border-b bg-muted/50">{head.map((h) => <th key={h} className="eyebrow px-5 py-4 text-left font-normal text-muted-foreground">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-b last:border-0 hover:bg-muted/50">{r.map((c, j) => <td key={j} className="px-5 py-4">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function ItemTable({ items, onEdit, onDelete, deletingId }: {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  deletingId: string | null;
}) {
  return <Table head={["Item", "Category", "Price", "Sizes", "Design", "Actions"]}
    rows={items.map((i) => [
      <span className="flex items-center gap-3">{i.image ? <img src={i.image} alt="" className="h-11 w-11 shrink-0 border object-cover" /> : <span className="h-11 w-11 shrink-0 border bg-muted" />}<span className="font-display text-lg">{i.name}</span></span>,
      i.category, eur(i.price), i.sizes, <span className="text-muted-foreground">{i.design}</span>,
      <span className="flex gap-2">
        <Button type="button" variant="editorial" size="sm" onClick={() => onEdit(i)}><Pencil />Update</Button>
        <Button type="button" variant="destructive" size="sm" disabled={deletingId === i.id} onClick={() => onDelete(i)}><Trash2 />{deletingId === i.id ? "Deleting..." : "Delete"}</Button>
      </span>,
    ])} />;
}

export function AddItemDialog({
  line,
  onClose,
  item: editingItem,
}: {
  line: Line;
  onClose: () => void;
  item?: Item;
}) {
  const cats = CATEGORIES[line];
  const [f, setF] = useState<{ name: string; price: string; sizes: string; design: string; category: string }>({
    name: editingItem?.name ?? "",
    price: editingItem ? String(editingItem.price) : "",
    sizes: editingItem?.sizes ?? "",
    design: editingItem?.design ?? "",
    category: editingItem?.category ?? cats[0] ?? "",
  });
  const [image, setImage] = useState(editingItem?.image ?? "");
  const [imageChanged, setImageChanged] = useState(false);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const selectedSizes = f.sizes
    .split(",")
    .map((size) => size.trim())
    .filter(Boolean);
  const sizeOptions = [...new Set([...SIZE_OPTIONS[line], ...selectedSizes])];
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const toggleSize = (size: string, checked: boolean) => {
    setF((current) => {
      const currentSizes = current.sizes
        .split(",")
        .map((currentSize) => currentSize.trim())
        .filter(Boolean);
      const sizes = checked
        ? [...currentSizes.filter((currentSize) => currentSize !== size), size]
        : currentSizes.filter((currentSize) => currentSize !== size);
      return { ...current, sizes: sizes.join(", ") };
    });
  };
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);
  const pickImage = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Please choose an image file (JPG, PNG, WebP…)."); return; }
    setErr("");
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 720;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const context = canvas.getContext("2d");
      if (!context) { URL.revokeObjectURL(url); setErr("Unable to process this image. Please try another photo."); return; }
      context.drawImage(img, 0, 0, w, h);
      setImage(canvas.toDataURL("image/jpeg", 0.82));
      setImageChanged(true);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(f.price);
    if (!f.name.trim() || !f.sizes.trim() || !f.design.trim() || !(price > 0)) {
      return setErr("Please complete name, a valid price, sizes and design text.");
    }
    const item = { line, name: f.name.trim().slice(0, 120), price, sizes: f.sizes.trim().slice(0, 80), design: f.design.trim().slice(0, 500), category: f.category };
    setSaving(true);
    setErr("");
    try {
      const payload = {
        ...item,
        ...(editingItem ? { id: editingItem.id } : {}),
        ...(imageChanged ? { image: image || null } : image ? { image } : {}),
      };
      const response = await fetch(editingItem ? `/api/items/${line}/${editingItem.id}` : "/api/items", {
        method: editingItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setErr(result.error ?? "Unable to save item.");
        return;
      }
      notifyItemSaved();
      onClose();
    } catch {
      setErr("Unable to save item. Please check the backend connection and try again.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={onClose}>
      <form role="dialog" aria-modal="true" aria-labelledby="add-item-title" onClick={(e) => e.stopPropagation()} onSubmit={submit} className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto bg-card p-7 sm:p-8">
        <Button type="button" variant="ghost" size="icon" aria-label="Close dialog" title="Close" className="absolute right-4 top-4" onClick={onClose}><X /></Button>
        <p className="eyebrow text-muted-foreground">{editingItem ? "Edit piece" : "New piece"}</p>
        <h2 id="add-item-title" className="font-display mb-7 mt-2 text-3xl">{editingItem ? `Update ${LINE_LABEL[line]} Item` : `Add ${LINE_LABEL[line]} Item`}</h2>
        <div className="space-y-5">
          <div>
            <span className="eyebrow">Item image</span>
            <div className="mt-3 flex items-center gap-4">
              <Button type="button" variant="editorial" onClick={() => fileRef.current?.click()} aria-label="Choose item image" className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-dashed border-border p-0 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
                {image ? <img src={image} alt="Item preview" className="h-full w-full object-cover" /> : <ImagePlus size={18} strokeWidth={1.3} />}
              </Button>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{image ? "Image added. Click the frame to replace it." : "Add a photo of the piece — optional."}</p>
                {image && <Button type="button" variant="editorial" size="sm" className="mt-2" onClick={() => { setImage(""); setImageChanged(true); }}>Remove image</Button>}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { pickImage(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
          <label className="block"><span className="eyebrow">Item name</span><input autoFocus className="field" value={f.name} onChange={set("name")} /></label>
          <label className="block"><span className="eyebrow">Price (€)</span><input type="number" min="0" step="any" className="field" value={f.price} onChange={set("price")} /></label>
          <fieldset>
            <legend className="eyebrow">Available sizes</legend>
            <p className="mt-2 text-xs text-muted-foreground">Select all that apply.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {sizeOptions.map((size) => (
                <label key={size} className="flex cursor-pointer items-center gap-2 text-xs">
                  <Checkbox
                    checked={selectedSizes.includes(size)}
                    onCheckedChange={(checked) => toggleSize(size, checked === true)}
                  />
                  {size}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block"><span className="eyebrow">Design text</span><textarea rows={2} className="field resize-none" value={f.design} onChange={set("design")} /></label>
          <div><span className="eyebrow">Category</span><div className="mt-3 flex flex-wrap gap-2">{cats.map((c) => <Button type="button" size="sm" variant={f.category === c ? "atelier" : "editorial"} key={c} aria-pressed={f.category === c} onClick={() => setF({ ...f, category: c })}>{c}</Button>)}</div></div>
        </div>
        {err && <p className="mt-5 text-sm text-destructive">{err}</p>}
        <div className="mt-7 flex justify-end gap-3"><Button type="button" variant="editorial" onClick={onClose} disabled={saving}>Cancel</Button><Button variant="atelier" disabled={saving}>{saving ? "Saving..." : editingItem ? "Update Item" : <><Plus />Save Item</>}</Button></div>
      </form>
    </div>
  );
}
