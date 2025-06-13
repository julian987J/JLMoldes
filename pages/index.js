import Mcontent from "./components/M/Mcontent.js";
import NavBar from "./components/NavBar.js";
import cadastro from "./components/Cadastro.js";
import Rcontent from "./components/R/RContent.js";
import Ccontent from "./components/C/Ccontent.js";
import Gastos from "./components/Gastos/Gastos.js";
import Tcontent from "./components/T/Tcontent.js";
import AnualContent from "./components/Anual/AnualContent.js";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/router";
import { useEffect } from "react";

const Home = () => {
  const { isAuthenticated, loading } = useAuth(); // Adicionado 'user' para manter a saudação se desejar, ou pode remover
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return <div>Carregando...</div>; // Ou um componente de loader
  }

  return (
    <div>
      <NavBar
        Rcontent={Rcontent}
        MContent={Mcontent}
        Ccontent={Ccontent}
        Cadastro={cadastro}
        Gastos={Gastos}
        Tcontent={Tcontent}
        AnualContent={AnualContent}
      />
    </div>
  );
};

export default Home;
