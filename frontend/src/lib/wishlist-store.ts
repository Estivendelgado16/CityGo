import { useEffect, useState } from "react";

const KEY = "parche_wishlist";
const listeners = new Set<() => void>();

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
  listeners.forEach((l) => l());
}

export function useWishlist() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());
    const onChange = () => setIds(read());
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  const toggle = (id: string) => {
    const current = read();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    write(next);
  };

  return { ids, toggle, has: (id: string) => ids.includes(id) };
}
