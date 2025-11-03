import Coluna1 from "./Coluna-1.js";
import Coluna2 from "./Coluna-2.js";
import Coluna3 from "./Coluna-3.js";
import C1Finalizado from "./C1Finalizado.js";
import C2Finalizado from "./C2Finalizado.js";
import C3Finalizado from "./C3Finalizado.js";

const Ccontent = ({ r }) => {
  return (
    <div>
      <div className="flex flex-cols-3 gap-3 items-start">
        <div className="flex-1">
          <Coluna1 r={r} />
        </div>
        <div className="flex-1">
          <Coluna2 r={r} />
        </div>
        <div className="flex-1">
          <Coluna3 r={r} />
        </div>
      </div>
      <div className="divider divider-neutral">Itens Finalizados</div>
      <div className="flex flex-cols-3 gap-3 mt-2 items-start">
        <div className="flex-1">
          <C1Finalizado r={r} />
        </div>
        <div className="flex-1">
          <C2Finalizado r={r} />
        </div>
        <div className="flex-1">
          <C3Finalizado r={r} />
        </div>
      </div>
    </div>
  );
};

export default Ccontent;
