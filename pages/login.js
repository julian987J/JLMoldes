import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/router";

import Password from "./components/Password.js";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showChangePasswordButton, setShowChangePasswordButton] =
    useState(false); // State for button visibility
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.ctrlKey &&
        event.altKey &&
        (event.key === "s" || event.key === "S")
      ) {
        event.preventDefault(); // Prevent any default browser action for this combo
        setShowChangePasswordButton((prevState) => !prevState); // Toggle visibility
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Cleanup the event listener when the component unmounts
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
      router.push("/");
    } catch (err) {
      setError(err.message || "Falha no login. Verifique suas credenciais.");
    }
  };

  if (loading || (!loading && isAuthenticated)) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center">Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-control">
              <input
                type="text"
                placeholder="Usuário"
                className="input input-bordered"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mt-2 form-control">
              <input
                type="password"
                placeholder="Senha"
                className="input input-bordered"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-error text-sm mt-2">{error}</p>}
            <div className="form-control mt-6">
              <button type="submit" className="btn btn-primary">
                Entrar
              </button>
            </div>
          </form>
          {showChangePasswordButton && (
            <>
              <button
                className="btn btn-secondary mt-4" // Added mt-4 for spacing
                onClick={() =>
                  document.getElementById("my_modal_5").showModal()
                }
              >
                Mudar Senhas
              </button>
              <dialog
                id="my_modal_5"
                className="modal modal-bottom sm:modal-middle"
              >
                <div className="modal-box">
                  <Password />
                  <div className="modal-action">
                    <form method="dialog">
                      <button className="btn">Fechar</button>
                    </form>
                  </div>
                </div>
              </dialog>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
