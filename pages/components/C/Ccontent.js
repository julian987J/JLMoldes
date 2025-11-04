import Coluna1 from "./Coluna-1.js";
import Coluna2 from "./Coluna-2.js";
import Coluna3 from "./Coluna-3.js";
import C1Finalizado from "./C1Finalizado.js";
import C2Finalizado from "./C2Finalizado.js";
import C3Finalizado from "./C3Finalizado.js";

const Ccontent = ({ r }) => {
  return (
    <div>
      <div className="grid grid-cols-20 gap-3 items-start">
        <div className="col-span-4">
          <Coluna1 r={r} />
        </div>
        <div className="col-span-8">
          <Coluna2 r={r} />
        </div>
        <div className="col-span-8">
          <Coluna3 r={r} />
        </div>
      </div>
      <div className="divider divider-neutral">Itens Finalizados</div>
      <div className="grid grid-cols-20 gap-3 mt-2 items-start">
        <div className="col-span-4">
          <C1Finalizado r={r} />
        </div>
        <div className="col-span-8">
          <C2Finalizado r={r} />
        </div>
        <div className="col-span-8">
          <C3Finalizado r={r} />
        </div>
      </div>
    </div>
  );
};

export default Ccontent;
