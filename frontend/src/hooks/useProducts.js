import { useEffect, useState } from "react";
import { productService } from "../services/productService";

// Fetches products from the backend. `fallback` (the built-in seed array) keeps
// the storefront rendering even when the API isn't running yet.
export function useProducts(fallback = []) {
  const [products, setProducts] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let alive = true;
    productService
      .list()
      .then((list) => { if (alive && list.length) { setProducts(list); setOnline(true); } })
      .catch(() => { /* keep fallback */ })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  return { products, loading, online };
}
