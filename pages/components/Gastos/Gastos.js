import Pessoal from "pages/components/Gastos/Pessoal.js";
import Oficina from "pages/components/Gastos/Oficina";

const Ccontent = ({ letras }) => {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <Pessoal letras={letras} />
        <Oficina />
      </div>
    </div>
  );
};

export default Ccontent;
