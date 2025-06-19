import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Execute from "models/functions"; // Import the Execute object

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
    setLoading(true);
    try {
      const userDataFromApi = await Execute.loginUser(username, password);
      // Verifica se userDataFromApi e userDataFromApi.role existem
      if (!userDataFromApi || typeof userDataFromApi.role === "undefined") {
        throw new Error(
          "Resposta da API de login não contém o papel do usuário.",
        );
      }
      const userData = { ...userDataFromApi, role: userDataFromApi.role }; // Usa o role vindo da API

      localStorage.setItem("currentUser", JSON.stringify(userData));
      setUser(userData);
      setLoading(false);
      return userData;
    } catch (error) {
      setLoading(false);
      console.error("Falha no login:", error.message);
      throw new Error(error.message || "Credenciais inválidas.");
    }
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
