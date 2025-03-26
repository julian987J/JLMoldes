import Execute from "models/functions";
import { useState, useEffect } from "react";

const Calculadora = ({ codigo, nome, onCodigoChange, onNomeChange }) => {
  const [dadosR1, setDadosR1] = useState(0);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const resultado = await Execute.reciveFromR1JustBSA(codigo);
        console.log("Dados brutos:", resultado);

        // Soma todos os valores
        const somaTotal =
          Number(resultado.total_base || 0) +
          Number(resultado.total_sis || 0) +
          Number(resultado.total_alt || 0);

        setDadosR1(somaTotal);
      } catch (error) {
        console.error("Erro:", error);
        setDadosR1(0);
      }
    };
    buscarDados();
  }, [codigo]);
  // Apenas codigo como dependência

  return (
    <div className="flex flex-col">
      <form>
        {/* Inputs superiores */}
        <div className="join z-2">
          <input
            type="text"
            placeholder="Nome"
            className="input input-warning input-xs w-32 join-item"
            value={nome}
            onChange={(e) => onNomeChange(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="CODIGO"
            className="input input-warning input-xs w-23.5 join-item"
            value={codigo}
            onChange={(e) => onCodigoChange(e.target.value)}
            required
          />
          <div className="badge badge-outline badge-warning join-item">7</div>
        </div>
        <div className="grid grid-cols-6 w-fit">
          {Array.from({ length: 36 }).map((_, i) => (
            <input
              key={i}
              min="0"
              type="number"
              className="input input-info input-xs w-10.5 text-center"
            />
          ))}
        </div>
        <div>
          <input
            min="0"
            type="number"
            placeholder="SOMA"
            value={dadosR1 || 0}
            className="input input-warning input-xs w-63 z-3 text-center text-warning font-bold"
            readOnly
          />
        </div>
        <div className="join grid grid-cols-3 mt-0.5 w-63.5">
          <input
            min="0"
            step={0.01}
            type="number"
            placeholder="Pix"
            className="input input-secondary input-lg z-2 text-center join-item"
          />
          <input
            min="0"
            step={0.01}
            type="number"
            placeholder="Troco"
            className="input input-defaut input-lg text-center join-item"
          />
          <input
            min="0"
            step={0.01}
            type="number"
            placeholder="Real"
            className="input input-secondary input-lg z-2 text-center join-item"
          />
          <button type="submit" className="btn px-31.5 btn-secondary">
            Salvar
          </button>
        </div>
        <input
          type="text"
          placeholder="Comentário"
          className="input input-defaut w-63.5 input-xs"
          required
        />
      </form>
    </div>
  );
};

export default Calculadora;
