import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Tenta carregar o usuário do localStorage ao iniciar
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Falha ao parsear usuário do localStorage", e);
        localStorage.removeItem("currentUser");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    if (username === "admin" && password === "987654321") {
      const userData = { username: "admin", role: "admin" };
      localStorage.setItem("currentUser", JSON.stringify(userData));
      setUser(userData);
      return userData;
    } else if (username === "user" && password === "123456789") {
      const userData = { username: "user", role: "user" };
      localStorage.setItem("currentUser", JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
    throw new Error("Credenciais inválidas");
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    setUser(null);
    router.push("/login");
  };

  if (loading) {
    return <div>Carregando autenticação...</div>;
  }

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
