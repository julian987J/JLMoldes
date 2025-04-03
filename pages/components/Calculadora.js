import Execute from "models/functions";
import { useState, useEffect } from "react";

const Calculadora = ({ codigo, nome, onCodigoChange, onNomeChange, data }) => {
  const [dadosR1, setDadosR1] = useState(0);
  const [idsArray, setIdsArray] = useState(0);
  const [valorDevo, setValorDevo] = useState(0);
  const [valorDeve, setValorDeve] = useState(0);
  const [multiplier, setMultiplier] = useState(7);
  const [plus, setPlus] = useState(0);
  const [values, setValues] = useState(Array(28).fill(""));
  const [pix, setPix] = useState("");
  const [real, setReal] = useState("");
  const [comentario, setComentario] = useState("");
  const [perdida, setPerdida] = useState("");
  const [base, setBase] = useState("");
  const [sis, setSis] = useState("");
  const [alt, setAlt] = useState("");

  // Calcula a soma bruta dos valores (novo cálculo)
  const sumValues = values.reduce((sum, current) => {
    const num = current === "" ? 0 : Number(current);
    return sum + num;
  }, 0);

  const handleMultiplierChange = (e) => {
    setMultiplier(Number(e.target.value));
  };
  const handlePlusChange = (e) => {
    setPlus(Number(e.target.value));
  };

  const handleValueChange = (index, e) => {
    const newValue = e.target.value;
    const newValues = [...values];
    newValues[index] = newValue;
    setValues(newValues);
  };

  // calculos da calculadora
  const comitions = plus * 5;
  const papel = values.some((val) => val !== "")
    ? values.reduce((sum, current) => {
        const num = current === "" ? 0 : Number(current);
        return sum + num * multiplier;
      }, 0)
    : "";

  const total = papel + comitions;

  const totalGeral =
    (Number(dadosR1) || 0) +
    sumValues * multiplier -
    valorDevo +
    valorDeve +
    comitions;

  const totalTroco = totalGeral - (Number(pix) || 0) - (Number(real) || 0);
  // fim dos calculos

  // No seu useEffect de busca de dados, atualize para garantir conversão numérica
  useEffect(() => {
    const buscarDados = async () => {
      try {
        const resultado = await Execute.reciveFromR1JustBSA(codigo);

        // Garantir conversão numérica correta
        const newBase = Number(resultado.total_base) || 0;
        const newSis = Number(resultado.total_sis) || 0;
        const newAlt = Number(resultado.total_alt) || 0;

        setIdsArray(resultado.ids || []);
        setBase(newBase);
        setSis(newSis);
        setAlt(newAlt);
        setDadosR1(newBase + newSis + newAlt);
      } catch (error) {
        console.error("Erro:", error);
        setBase(0);
        setSis(0);
        setAlt(0);
        setDadosR1(0);
        setIdsArray([]);
      }
    };
    buscarDados();
  }, [codigo]);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const resultado = await Execute.reciveFromDeveJustValor(codigo);
        console.log("Dados brutos:", resultado);

        // Soma todos os valores
        const somaTotal = Number(resultado.total_valor || 0);

        setValorDeve(somaTotal);
      } catch (error) {
        console.error("Erro:", error);
        setValorDeve(0);
      }
    };
    buscarDados();
  }, [codigo]);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const resultado = await Execute.reciveFromDevoJustValor(codigo);
        console.log("Dados brutos:", resultado);

        // Soma todos os valores
        const somaTotal = Number(resultado.total_valor || 0);

        setValorDevo(somaTotal);
      } catch (error) {
        console.error("Erro:", error);
        setValorDevo(0);
      }
    };
    buscarDados();
  }, [codigo]);

  const handleSave = async (editedData) => {
    try {
      const response = await fetch("/api/v1/tables/R1/calculadora", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) throw new Error("Erro ao atualizar");
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trocoValue = Number(totalTroco);

    try {
      if (trocoValue > 0 && trocoValue !== total) {
        await Execute.removeDevo(codigo);

        // Calcula o total atual e o excesso a ser removido
        const currentTotal = base + sis + alt;
        const excessoTotal = currentTotal - trocoValue;

        if (excessoTotal > 0) {
          // Cria array de valores para ajuste
          const valores = [
            { nome: "base", valor: base },
            { nome: "sis", valor: sis },
            { nome: "alt", valor: alt },
          ];
          valores.sort((a, b) => b.valor - a.valor);

          let resto = excessoTotal;
          for (const item of valores) {
            if (resto <= 0) break;
            const subtrair = Math.min(item.valor, resto);
            item.valor -= subtrair;
            resto -= subtrair;
          }

          // Atualiza os valores
          const novosDados = {
            base: valores.find((v) => v.nome === "base").valor,
            sis: valores.find((v) => v.nome === "sis").valor,
            alt: valores.find((v) => v.nome === "alt").valor,
            codigo,
          };

          // Executa o salvamento
          handleSave(novosDados);

          // Se houver resto (impossível se cálculos corretos), envia para Deve
          if (resto > 0) {
            await Execute.sendToDeve({
              nome,
              codigo,
              valor: resto,
            });
            await Execute.removeM1andR1(idsArray);
          }
        } else if (excessoTotal < 0) {
          // Se o trocoValue é maior que o total atual, envia a diferença para Deve
          const diferenca = trocoValue - currentTotal;
          await Execute.sendToDeve({
            nome,
            codigo,
            valor: diferenca,
          });
          // Zera os valores existentes
          handleSave({ base: 0, sis: 0, alt: 0, codigo });
          await Execute.removeM1andR1(idsArray);
        }

        console.log("caiu em troco Maior que 0");
      } else if (trocoValue < 0) {
        await Execute.removeDeve(codigo);
        await Execute.sendToDevo({
          nome,
          codigo,
          valor: Math.abs(trocoValue),
        });
        await Execute.removeM1andR1(idsArray);
      } else if (
        Number(pix) === total ||
        Number(real) === total ||
        Number(pix) + Number(real) === total
      ) {
        await Execute.sendToPapelC1({
          codigo,
          data: { type: "timestamptz", value: Date.now() },
          nome,
          multi: multiplier,
          papel: papel || 0,
          papelpix: Number(pix) > 0 ? Math.min(Number(pix), papel) : 0,
          papelreal:
            Number(real) > 0
              ? Math.min(
                  Number(real),
                  papel - (Number(pix) > 0 ? Math.min(Number(pix), papel) : 0),
                )
              : 0,
          encaixepix: Number(pix) > 0 ? Math.min(Number(pix), comitions) : 0,
          encaixereal:
            Number(real) > 0
              ? Math.min(
                  Number(real),
                  comitions -
                    (Number(pix) > 0 ? Math.min(Number(pix), comitions) : 0),
                )
              : 0,
          desperdicio: 0.06,
          util: sumValues,
          perdida: perdida || 0,
          comentario,
        });
      } else {
        await Execute.sendToC1({
          codigo,
          data,
          nome,
          sis,
          alt,
          base,
          real: Number(real),
          pix: Number(pix),
        });
        await Execute.sendToPapelC1({
          codigo,
          data,
          nome,
          multi: multiplier,
          papel: papel || 0,
          papelpix: Number(pix) > 0 ? Math.min(Number(pix), papel) : 0,
          papelreal:
            Number(real) > 0
              ? Math.min(
                  Number(real),
                  papel - (Number(pix) > 0 ? Math.min(Number(pix), papel) : 0),
                )
              : 0,
          encaixepix: Number(pix) > 0 ? Math.min(Number(pix), comitions) : 0,
          encaixereal:
            Number(real) > 0
              ? Math.min(
                  Number(real),
                  comitions -
                    (Number(pix) > 0 ? Math.min(Number(pix), comitions) : 0),
                )
              : 0,
          desperdicio: 0.06,
          util: sumValues,
          perdida: perdida || 0,
          comentario,
        });
        await Execute.removeDeve(codigo);
        await Execute.removeDevo(codigo);
        await Execute.removeM1andR1(idsArray);
      }

      // Limpar campos após o envio
      setPix("");
      setPlus(0);
      setReal("");
      setComentario("");
      setPerdida("");
      onNomeChange("");
      onCodigoChange("");
      setValues(Array(28).fill(""));
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar os dados!");
    }
  };

  return (
    <div className="flex flex-col">
      <form onSubmit={handleSubmit}>
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
            className="input input-warning text-warning text-left input-xs w-7.5 join-item"
            value={plus}
            placeholder={0}
            onChange={handlePlusChange}
          />
        </div>
        <input
          type="number"
          className="input input-warning hidden text-warning input-xs w-7.5"
          value={multiplier}
          onChange={handleMultiplierChange}
        />
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
        <div className="join">
          <input
            type="text"
            placeholder="Comentário"
            className="input input-defaut w-42 input-xs join-item"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
          <input
            min="0"
            step={0.01}
            type="number"
            placeholder="Desperdício"
            className="input input-defaut w-20 input-xs join-item"
            value={perdida}
            onChange={(e) => setPerdida(e.target.value)}
          />
        </div>
      </form>
    </div>
  );
};

export default Calculadora;
