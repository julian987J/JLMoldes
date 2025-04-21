import Coluna1 from "./Coluna-1.js";
import Coluna2 from "./Coluna-2.js";
import Coluna3 from "./Coluna-3.js";

const Ccontent = ({ r }) => {
  return (
    <div>
      <div className="flex flex-cols-3 gap-3">
        <Coluna1 r={r} />
        <Coluna2 r={r} />
        <Coluna3 r={r} />
      </div>
    </div>
  );
};

export default Ccontent;
