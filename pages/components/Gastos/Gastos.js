import Pessoal from "./Pessoal.js";
import Oficina from "./Oficina.js";
import SaidasPessoal from "./SaidasPessoal.js";
import SaidasOficina from "./SaidasOficina.js";

const Ccontent = ({ letras }) => {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <Pessoal letras={letras} />
        <Oficina letras={letras} />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <SaidasPessoal letras={letras} />
        <SaidasOficina letras={letras} />
      </div>
    </div>
  );
};

export default Ccontent;
