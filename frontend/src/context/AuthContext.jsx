import { createContext, useContext, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.currentUser());

  const login = async (email, password) => {
    const u = await authService.login(email, password);
    setUser(u);
    return u;
  };
  const register = async (payload) => {
    const u = await authService.register(payload);
    setUser(u);
    return u;
  };
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAdmin: user && user.role !== "customer" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
