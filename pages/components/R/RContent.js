import { useState, useEffect, useRef, useCallback } from "react";
import Calculadora from "./Calculadora.js";
import Execute from "models/functions";
import BSTA from "./BSATable.js";
import Deve from "./Deve.js";
import Devo from "./Devo.js";
import Pendente from "./Pendente.js";
import PlanilhaDiaria from "./PlanilhaDiaria.js";
import Aviso from "./Aviso.js";
import ValoresColuna from "./ValoresColuna.js";
import PlotterStatus from "./PlotterStatus.js";
import PlotterTotals from "./PlotterTotals.js";

const Rcontent = ({ codigoExterno, nomeExterno, r }) => {
  const tablesToSearch = useRef(["R", "deve", "devo", "cadastro"]);

  // Se o codigoExterno for passado, não alteramos o estado de codigo
  const [codigo, setCodigo] = useState(codigoExterno || "");
  const [nome, setNome] = useState(nomeExterno || "");
  const [plusCalculadora, setPlusCalculadora] = useState(null);
  const [valuesCalculadora, setValuesCalculadora] = useState(
    Array(28).fill(""),
  );
  const [data, setData] = useState();
  const [selectedPendenteItem, setSelectedPendenteItem] = useState(null);
  const [totalValores, setTotalValores] = useState(0);
  const [bsaTotals, setBsaTotals] = useState({ total1M: 0, total2M: 0 });
  const [deveTotals, setDeveTotals] = useState({ total1M: 0, total2M: 0 });

  useEffect(() => {
    setCodigo(codigoExterno || "");
  }, [codigoExterno]);

  useEffect(() => {
    setNome(nomeExterno || "");
  }, [nomeExterno]);

  useEffect(() => {
    const fetchDataForCodigo = async () => {
      if (!codigo) {
        setData(undefined);
        return;
      }

      try {
        let foundItem = null;
        for (const table of tablesToSearch.current) {
          const items = await Execute.receiveFromRDeveDevo(table);
          foundItem = items.find((item) => item.codigo === codigo);
          if (foundItem) break;
        }

        if (foundItem) {
          setData(foundItem.data);
        } else {
          setData(undefined);
        }
      } catch (error) {
        console.error("Falha ao buscar data para o código:", error);
        setData(undefined);
      }
    };

    fetchDataForCodigo();
  }, [codigo]); // Adiciona selectedPendenteItem como dependência

  const handleCodigoChange = (novoCodigo) => {
    setCodigo(novoCodigo);
    setSelectedPendenteItem(null); // Limpa a seleção do pendente
    setPlusCalculadora(null); // Reseta o plus para null
    setValuesCalculadora(Array(28).fill("")); // Reseta os values
  };

  const handleNomeChange = (novoNome) => {
    setNome(novoNome);
    setSelectedPendenteItem(null); // Limpa a seleção do pendente
    setPlusCalculadora(null); // Reseta o plus para null
    setValuesCalculadora(Array(28).fill("")); // Reseta os values
  };

  const handlePlusChange = (newPlus) => {
    setPlusCalculadora(newPlus);
    // Opcional: Se alterar o plus manualmente deve "desvincular" do item pendente:
    // setSelectedPendenteItem(null);
  };

  const handleValuesChange = (newValues) => {
    setValuesCalculadora(newValues);
    // Opcional: Se alterar os valores manualmente deve "desvincular" do item pendente:
    // setSelectedPendenteItem(null);
  };

  const handlePendenteSelect = (item) => {
    setSelectedPendenteItem(item);
    setCodigo(item.codigo || "");
    setNome(item.nome || "");

    const rawComissao = item.comissao;
    let newPlusState = null; // Default to null for empty/invalid
    if (rawComissao !== undefined && rawComissao !== null) {
      const valStr = String(rawComissao).trim();
      if (valStr === "") {
        // Explicitly empty string from data
        newPlusState = null;
      } else {
        const num = parseFloat(valStr);
        if (!isNaN(num)) {
          newPlusState = num; // This will be 0 if item.comissao was "0" or 0
        }
      }
    }
    setPlusCalculadora(newPlusState);

    const itemValues = Array.from({ length: 28 }, (_, i) => {
      const propName = `v${String(i + 1).padStart(2, "0")}`;
      return item[propName] !== undefined && item[propName] !== null
        ? String(item[propName])
        : "";
    });
    setValuesCalculadora(itemValues);
    setData(item.data); // Atualiza a data também, se relevante
  };

  const handleValoresChange = useCallback((valores) => {
    setTotalValores(valores);
  }, []);

  const handleBsaTotalsChange = useCallback((totals) => {
    setBsaTotals(totals);
  }, []);

  const handleDeveTotalsChange = useCallback((totals) => {
    setDeveTotals(totals);
  }, []);

  return (
    <div>
      <ValoresColuna r={r} onValoresChange={handleValoresChange} />
      <div className="grid grid-cols-37 gap-1">
        <PlanilhaDiaria r={r} totalValores={totalValores} />
        <div className="col-span-5">
          <PlotterTotals r={r} />
        </div>
        <div className="col-span-9">
          <BSTA codigo={codigo} r={r} onTotalsChange={handleBsaTotalsChange} />
        </div>
        <div className="col-span-10">
          <Pendente r={r} onSelectItem={handlePendenteSelect} />
          <div className="mt-1">
            <Deve
              codigo={codigo}
              r={r}
              onTotalsChange={handleDeveTotalsChange}
              total1M={bsaTotals.total1M + deveTotals.total1M}
              total2M={bsaTotals.total2M + deveTotals.total2M}
            />
          </div>
          <div className="mt-1">
            <Aviso codigo={codigo} r={r} />
          </div>
        </div>
        <div className="col-span-6">
          <Calculadora
            r={r}
            codigo={codigo}
            nome={nome}
            plus={plusCalculadora}
            values={valuesCalculadora}
            onCodigoChange={handleCodigoChange}
            onNomeChange={handleNomeChange}
            onPlusChange={handlePlusChange}
            onValuesChange={handleValuesChange}
            data={data}
            isPendente={!!selectedPendenteItem}
          />
          <div className="mt-1">
            <PlotterStatus r={r} plotterNome="P01" />
          </div>
          <div className="mt-1">
            <PlotterStatus r={r} plotterNome="P02" />
          </div>
          <div className="mt-1">
            <Devo codigo={codigo} r={r} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rcontent;
