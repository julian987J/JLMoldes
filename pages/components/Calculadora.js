import Execute from "models/functions";
import { useState, useEffect } from "react";

const Calculadora = ({ codigo, nome, onCodigoChange, onNomeChange }) => {
  const [dadosR1, setDadosR1] = useState(0);
  const [multiplier, setMultiplier] = useState(7);
  const [values, setValues] = useState(Array(28).fill(""));
  const [pix, setPix] = useState("");
  const [real, setReal] = useState("");

  const total = values.some((val) => val !== "")
    ? values.reduce((sum, current) => {
        const num = current === "" ? 0 : Number(current);
        return sum + num * multiplier;
      }, 0)
    : "";

  // Calcula a soma bruta dos valores (novo cálculo)
  const sumValues = values.reduce((sum, current) => {
    const num = current === "" ? 0 : Number(current);
    return sum + num;
  }, 0);

  const handleMultiplierChange = (e) => {
    setMultiplier(Number(e.target.value));
  };

  const handleValueChange = (index, e) => {
    const newValue = e.target.value;
    const newValues = [...values];
    newValues[index] = newValue;
    setValues(newValues);
  };
  const totalGeral = (Number(dadosR1) || 0) + sumValues * multiplier;

  const totalTroco =
    (Number(dadosR1) || 0) +
    sumValues * multiplier -
    (Number(pix) || 0) -
    (Number(real) || 0);

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
            className="input input-warning input-xs w-23 join-item"
            value={codigo}
            onChange={(e) => onCodigoChange(e.target.value)}
            required
          />
          <input
            type="number"
            className="input input-warning text-warning input-xs w-7.5 join-item"
            value={multiplier}
            onChange={handleMultiplierChange}
          />
        </div>
        <div className="grid grid-cols-4 mt-0.5 w-fit">
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className="relative">
              <input
                min="0"
                step="0.01"
                type="number"
                className="input input-info input-xs w-15.5 appearance-none"
                value={values[i]}
                onChange={(e) => handleValueChange(i, e)}
              />
            </div>
          ))}
        </div>
        <div>
          <input
            type="text" // Mudei para type="text" para permitir valor vazio
            placeholder="Total"
            value={typeof total === "number" ? total.toFixed(2) : ""}
            className="input input-warning input-xs w-62 z-3 text-center text-warning font-bold"
            readOnly
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="SOMA TOTAL"
            value={totalGeral !== 0 ? totalGeral.toFixed(2) : ""}
            className="input input-success input-xl w-62 z-3 text-center text-success mt-0.5 font-bold"
            readOnly
          />
        </div>
        <div className="join grid grid-cols-3 mt-0.5 w-62">
          <input
            min="0"
            step={0.01}
            type="number"
            placeholder="Pix"
            className="input input-secondary input-lg z-2 text-secondary font-bold join-item"
            value={pix}
            onChange={(e) => setPix(e.target.value)}
          />
          <input
            min="0"
            type="text"
            placeholder="Troco"
            value={totalTroco !== 0 ? totalTroco.toFixed(2) : ""}
            className="input input-defaut input-lg join-item font-bold"
          />
          <input
            min="0"
            step={0.01}
            type="number"
            placeholder="Real"
            className="input input-secondary input-lg z-2 text-secondary font-bold join-item"
            value={real}
            onChange={(e) => setReal(e.target.value)}
          />
          <button type="submit" className="btn px-30.5 btn-secondary">
            Salvar
          </button>
        </div>
        <input
          type="text"
          placeholder="Comentário"
          className="input input-defaut w-62 input-xs"
        />
      </form>
    </div>
  );
};

export default Calculadora;
