import { api } from "./api";

// Map a backend product to the shape the storefront components expect.
export function mapProduct(p) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    cat: p.category,
    sub: p.subcategory,
    price: p.price,            // KES
    badge: p.badge || undefined,
    rating: p.rating,
    reviews: p.reviews,
    img: p.image_url || "",
    desc: p.description,
    specs: p.specs || {},
    stock: p.stock,
  };
}

export const productService = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const data = await api.get(`/api/products${qs ? "?" + qs : ""}`);
    return data.products.map(mapProduct);
  },
  async detail(slug) {
    const data = await api.get(`/api/products/${slug}`);
    return { product: mapProduct(data.product), related: data.related.map(mapProduct) };
  },
  categories: () => api.get("/api/categories"),
};
