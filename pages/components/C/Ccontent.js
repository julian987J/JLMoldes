import Coluna1 from "./Coluna-1.js";
import Coluna2 from "./Coluna-2.js";
import Coluna3 from "./Coluna-3.js";

const Ccontent = () => {
  return (
    <div>
      <div className="flex flex-cols-3 gap-3">
        <Coluna1 />
        <Coluna2 />
        <Coluna3 />
      </div>
    </div>
  );
};

export default Ccontent;
