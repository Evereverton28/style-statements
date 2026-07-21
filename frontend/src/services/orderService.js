import { api } from "./api";

export const orderService = {
  checkout: (payload) => api.post("/api/orders/checkout", payload, true),
  myOrders: () => api.get("/api/orders", true),
  track: (orderNumber) => api.get(`/api/orders/${orderNumber}`),

  // admin
  analyticsSummary: () => api.get("/api/analytics/summary", true),
  allOrders: (status) => api.get(`/api/admin/orders${status ? "?status=" + status : ""}`, true),
  updateStatus: (id, status) => api.patch(`/api/admin/orders/${id}`, { status }, true),
};
