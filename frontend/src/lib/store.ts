import { useEffect, useState } from "react";

export type Line = "men" | "women" | "accessories";
export type Item = {
  id: string;
  line: Line;
  name: string;
  price: number;
  sizes: string;
  design: string;
  category: string;
  image?: string;
  createdAt: number | string;
};

export type CustomerRecord = {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  city?: string;
  orders?: number;
  spent?: number;
  totalSpent?: number;
};

export type OrderRecord = {
  id: string;
  accountEmail?: string;
  contactInformation?: { email?: string };
  shippingAddress?: { firstName?: string; lastName?: string; city?: string };
  purchasedItems?: { name?: string; quantity?: number }[];
  totalAmount?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
};

export type CollectionKey = "customers" | "orders" | "men" | "women" | "accessories" | "items";

type CollectionResponse<T> = { items: T[]; total: number };
type CollectionState<T> = CollectionResponse<T> & { loading: boolean; error: string | null };

export const CATEGORIES: Record<Line, string[]> = {
  men: ["Tailoring", "Knitwear", "Footwear", "Shorts", "T-Shirts"],
  women: ["Outerwear", "Evening", "Tailoring", "Leather Goods", "Knitwear"],
  accessories: ["Silk", "Leather", "Cashmere"],
};

export const LINE_LABEL: Record<Line, string> = {
  men: "Men's",
  women: "Women's",
  accessories: "Accessories",
};

export function useMongoCollection<T>(key: CollectionKey): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({
    items: [],
    total: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const response = await fetch(`/api/collections/${key}`);
        const result = (await response.json()) as CollectionResponse<T> & { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to load records.");
        if (!cancelled) setState({ ...result, loading: false, error: null });
      } catch (error) {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            loading: false,
            error: error instanceof Error ? error.message : "Unable to load records.",
          }));
        }
      }
    };

    const refresh = () => void load();
    void load();
    window.addEventListener("cdm:data-changed", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("cdm:data-changed", refresh);
    };
  }, [key]);

  return state;
}

export function useItems() {
  return useMongoCollection<Item>("items");
}

export function notifyItemSaved() {
  window.dispatchEvent(new Event("cdm:data-changed"));
}

export const isNew = (i: Item) => {
  const createdAt = typeof i.createdAt === "number" ? i.createdAt : Date.parse(i.createdAt);
  return Number.isFinite(createdAt) && Date.now() - createdAt < 14 * 86400000;
};
export const eur = (n: number) => "€" + n.toLocaleString("it-IT");

export const AUTH_KEY = "cdm-auth";
export const isAuthed = () => typeof window !== "undefined" && localStorage.getItem(AUTH_KEY) === "1";
