import { api } from "./api";

export const authService = {
  async login(email, password) {
    const data = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("ss_token", data.token);
    localStorage.setItem("ss_user", JSON.stringify(data.user));
    return data.user;
  },
  async register(payload) {
    const data = await api.post("/api/auth/register", payload);
    localStorage.setItem("ss_token", data.token);
    localStorage.setItem("ss_user", JSON.stringify(data.user));
    return data.user;
  },
  logout() {
    localStorage.removeItem("ss_token");
    localStorage.removeItem("ss_user");
  },
  currentUser() {
    try { return JSON.parse(localStorage.getItem("ss_user")); } catch { return null; }
  },
};
