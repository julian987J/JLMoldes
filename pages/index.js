import Mcontent from "./components/M/Mcontent.js";
import NavBar from "./components/NavBar.js";
import cadastro from "./components/Cadastro.js";
import Rcontent from "./components/R/RContent.js";
import Ccontent from "./components/C/Ccontent.js";
import Gastos from "./components/Gastos/Gastos.js";
import Tcontent from "./components/T/Tcontent.js";

const Home = () => {
  return (
    <div>
      <NavBar
        Rcontent={Rcontent}
        MContent={Mcontent}
        Ccontent={Ccontent}
        Cadastro={cadastro}
        Gastos={Gastos}
        Tcontent={Tcontent}
      />
      {/* <Footer /> */}
    </div>
  );
};

export default Home;
