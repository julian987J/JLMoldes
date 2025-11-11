/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
import TabelaAnual from "./TabelaAnual.js";
import Execute from "models/functions.js";
import SaldoMensal from "./SaldoMensal";
import { useWebSocket } from "../../../contexts/WebSocketContext.js";
import TcontentAnoModal from "./TcontentAnoModal.js";
import ErrorComponent from "../Errors.js";

const Tcontent = ({ r, oficina }) => {
  const [papelData, setPapelData] = useState([]);
  const [despesasData, setDespesasData] = useState([]);
  const [encaixesData, setEncaixesData] = useState([]);
  const [bobinasData, setBobinasData] = useState([]);
  const [savedYears, setSavedYears] = useState([]);
  const [selectedYearData, setSelectedYearData] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const { lastMessage } = useWebSocket();

  const formatCurrency = (value) => {
    const numberValue = Number(value) || 0;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numberValue);
  };

  const processarDados = (dados, campoData, campoValor) => {
    const somasDiarias = {};

    dados?.forEach((item) => {
      try {
        const rawDate = item[campoData].substring(0, 10);
        let formattedDate = rawDate;
        if (rawDate.includes("/")) {
          const [day, month, year] = rawDate.split("/");
          formattedDate = `${year}-${month}-${day}`;
        }
        const valor = Number(item[campoValor]) || 0;

        somasDiarias[formattedDate] =
          (somasDiarias[formattedDate] || 0) + valor;
      } catch (error) {
        console.error("Erro ao processar item:", item, error);
      }
    });

    return Object.entries(somasDiarias).map(([data, total]) => ({
      data,
      valor: formatCurrency(total),
    }));
  };

  const processarEncaixes = (dados) => {
    const somasDiarias = {};

    dados?.forEach((item) => {
      try {
        const rawDate = item.data.substring(0, 10);
        let formattedDate = rawDate;
        if (rawDate.includes("/")) {
          const [day, month, year] = rawDate.split("/");
          formattedDate = `${year}-${month}-${day}`;
        }
        const valorReal = Number(item.encaixereal) || 0;
        const valorPix = Number(item.encaixepix) || 0;
        const totalEncaixe = valorReal + valorPix;

        somasDiarias[formattedDate] =
          (somasDiarias[formattedDate] || 0) + totalEncaixe;
      } catch (error) {
        console.error("Erro ao processar item de encaixe:", item, error);
      }
    });

    return Object.entries(somasDiarias).map(([data, total]) => ({
      data,
      valor: formatCurrency(total),
    }));
  };

  const processarBobinas = (papelC, plotterC, config) => {
    const somasDiarias = {};
    const logDiario = {}; // Para depuração
    const desperdicioConfig = config ? parseFloat(config.d) || 0 : 0;

    papelC?.forEach((item) => {
      try {
        const rawDate = item.data.substring(0, 10);
        let formattedDate = rawDate;
        if (rawDate.includes("/")) {
          const [day, month, year] = rawDate.split("/");
          formattedDate = `${year}-${month}-${day}`;
        }
        const valorUtil = Number(item.util) || 0;
        const valorDesperdicio = Number(item.desperdicio) || 0;
        const valorPerdida = Number(item.perdida) || 0;
        const totalPapelC = valorUtil + valorDesperdicio + valorPerdida;

        somasDiarias[formattedDate] =
          (somasDiarias[formattedDate] || 0) + totalPapelC;
        logDiario[formattedDate] = {
          ...(logDiario[formattedDate] || {}),
          papelC: (logDiario[formattedDate]?.papelC || 0) + totalPapelC,
        };
      } catch (error) {
        console.error(
          "Erro ao processar item de bobina (PapelC):",
          item,
          error,
        );
      }
    });

    plotterC?.forEach((item) => {
      try {
        const rawDate = item.data.substring(0, 10);
        let formattedDate = rawDate;
        if (rawDate.includes("/")) {
          const [day, month, year] = rawDate.split("/");
          formattedDate = `${year}-${month}-${day}`;
        }
        const larguraTotalCm = parseFloat(item.largura) + desperdicioConfig;
        const m2Value = (parseFloat(item.nao) / 100) * (larguraTotalCm / 100);

        somasDiarias[formattedDate] =
          (somasDiarias[formattedDate] || 0) + m2Value;
        logDiario[formattedDate] = {
          ...(logDiario[formattedDate] || {}),
          plotterC_M2: (logDiario[formattedDate]?.plotterC_M2 || 0) + m2Value,
        };
      } catch (error) {
        console.error(
          "Erro ao processar item de bobina (PlotterC):",
          item,
          error,
        );
      }
    });

    return Object.entries(somasDiarias).map(([data, total]) => ({
      data,
      valor: (total / 250).toFixed(2), // Divide por 250 e formata
    }));
  };

  const fetchPapelData = useCallback(async () => {
    if (typeof r === "undefined" || r === null) {
      setPapelData([]);
      return;
    }
    try {
      const papel = await Execute.receiveFromPapelC(r);
      setPapelData(papel ? processarDados(papel, "data", "papel") : []);
    } catch (error) {
      console.error("Erro ao buscar dados 'papel':", error);
      setPapelData([]);
    }
  }, [r]);

  const fetchEncaixesData = useCallback(async () => {
    if (typeof r === "undefined" || r === null) {
      setEncaixesData([]);
      return;
    }
    try {
      const papel = await Execute.receiveFromPapelC(r);
      setEncaixesData(papel ? processarEncaixes(papel) : []);
    } catch (error) {
      console.error("Erro ao buscar dados 'encaixes':", error);
      setEncaixesData([]);
    }
  }, [r]);

  const fetchBobinasData = useCallback(async () => {
    if (typeof r === "undefined" || r === null) {
      setBobinasData([]);
      return;
    }
    try {
      const [papelC, plotterC, configResult] = await Promise.all([
        Execute.receiveFromPapelC(r),
        Execute.receiveFromPlotterC(r),
        Execute.receiveFromConfig(),
      ]);

      setBobinasData(processarBobinas(papelC, plotterC, configResult[0]));
    } catch (error) {
      console.error("Erro ao buscar dados 'bobinas':", error);
      setBobinasData([]);
    }
  }, [r]);

  const fetchDespesasData = useCallback(async () => {
    if (typeof oficina === "undefined" || oficina === null) {
      setDespesasData([]);
      return;
    }
    try {
      const despesas = await Execute.receiveFromSaidaOficina(oficina);
      setDespesasData(
        despesas ? processarDados(despesas, "pago", "valor") : [],
      );
    } catch (error) {
      console.error("Erro ao buscar dados 'despesas':", error);
      setDespesasData([]);
    }
  }, [oficina]);

  const fetchSavedYears = useCallback(async () => {
    if (typeof r === "undefined" || r === null || !oficina) {
      setSavedYears([]);
      return;
    }
    try {
      const anos = await Execute.receiveFromTContentAno(r, oficina);
      setSavedYears(anos || []);
    } catch (error) {
      console.error("Erro ao buscar anos salvos:", error);
      setSavedYears([]);
    }
  }, [r, oficina]);

  const handleSaveYear = async () => {
    if (!r || !oficina) {
      console.warn("Parâmetros r e oficina são necessários");
      return;
    }

    // Detecta anos únicos nos dados atuais
    const allData = [
      ...papelData,
      ...despesasData,
      ...encaixesData,
      ...bobinasData,
    ];
    const yearsSet = new Set();

    allData.forEach((item) => {
      if (item.data) {
        const year = new Date(item.data).getFullYear();
        if (!isNaN(year)) {
          yearsSet.add(year);
        }
      }
    });

    const years = Array.from(yearsSet);

    if (years.length === 0) {
      console.warn("Nenhum ano encontrado nos dados");
      return;
    }

    // Para cada ano encontrado, tenta salvar
    for (const ano of years) {
      try {
        // Filtra dados do ano
        const filterByYear = (data) => {
          return data.filter((item) => {
            if (item.data) {
              const itemYear = new Date(item.data).getFullYear();
              return itemYear === ano;
            }
            return false;
          });
        };

        const papelAno = filterByYear(papelData);
        const despesasAno = filterByYear(despesasData);
        const encaixesAno = filterByYear(encaixesData);
        const bobinasAno = filterByYear(bobinasData);

        await Execute.sendToTContentAno({
          ano,
          r,
          oficina,
          papel_data: papelAno,
          despesas_data: despesasAno,
          encaixes_data: encaixesAno,
          bobinas_data: bobinasAno,
        });

        // Sucesso - atualiza lista de anos
        await fetchSavedYears();
      } catch (error) {
        if (error.message === "TCONTENT_ANO_EXISTS") {
          setErrorCode("TCONTENT_ANO_EXISTS");
          setTimeout(() => setErrorCode(null), 3000);
        } else {
          console.error(`Erro ao salvar ano ${ano}:`, error);
        }
      }
    }
  };

  const handleOpenYear = async (ano) => {
    if (!r || !oficina) return;

    try {
      const anoData = await Execute.receiveFromTContentAnoByYear(
        ano,
        r,
        oficina,
      );
      if (anoData) {
        setSelectedYearData(anoData);
        // Abre modal
        setTimeout(() => {
          document.getElementById(`ano_modal_${ano}`)?.showModal();
        }, 100);
      }
    } catch (error) {
      console.error(`Erro ao abrir dados do ano ${ano}:`, error);
    }
  };

  useEffect(() => {
    fetchPapelData();
    fetchDespesasData();
    fetchEncaixesData();
    fetchBobinasData();
  }, [fetchPapelData, fetchDespesasData, fetchEncaixesData, fetchBobinasData]);

  useEffect(() => {
    fetchSavedYears();
  }, [fetchSavedYears]);

  useEffect(() => {
    if (lastMessage?.data) {
      let messageData;

      try {
        // Tenta parsear se for JSON string
        if (typeof lastMessage.data === "string") {
          messageData = JSON.parse(lastMessage.data);
        } else {
          // Caso já seja objeto
          messageData = lastMessage.data;
        }
      } catch (error) {
        console.error("Erro ao parsear lastMessage.data:", error);
        return; // Sai do useEffect, pois não conseguimos processar
      }

      const { type, payload } = messageData;

      if (typeof type === "string") {
        if (type.startsWith("PAPELC_") || type.startsWith("PLOTTER_C_")) {
          if (
            (payload &&
              payload.r !== undefined &&
              String(payload.r) === String(r)) ||
            (payload && payload.r === undefined)
          ) {
            fetchPapelData();
            fetchEncaixesData();
            fetchBobinasData();
          }
        } else if (type.startsWith("SAIDAS_OFICINA_")) {
          if (
            (payload &&
              payload.oficina !== undefined &&
              String(payload.oficina) === String(oficina)) ||
            (payload && payload.oficina === undefined)
          ) {
            fetchDespesasData();
          }
        } else if (type === "TCONTENT_ANO_NEW_ITEM") {
          if (
            payload &&
            String(payload.r) === String(r) &&
            String(payload.oficina) === String(oficina)
          ) {
            fetchSavedYears();
          }
        }
      }
    }
  }, [
    lastMessage,
    r,
    oficina,
    fetchPapelData,
    fetchDespesasData,
    fetchEncaixesData,
    fetchBobinasData,
    fetchSavedYears,
  ]);

  return (
    <div className="flex flex-col gap-3">
      {" "}
      {/* Contêiner principal para empilhar as linhas */}
      <div className="flex flex-col md:flex-row gap-3">
        {" "}
        {/* Primeira linha de tabelas existentes */}
        <TabelaAnual titulo="PAPEL" cor="warning" dados={papelData} />
        <SaldoMensal
          titulo=" PAPEL - DESPESAS"
          data1={papelData}
          titulo1="Papel"
          data2={despesasData}
          titulo2="Despesas"
        />
        <TabelaAnual titulo="DESPESAS" cor="warning" dados={despesasData} />
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        {" "}
        {/* Segunda linha para as novas tabelas */}
        <TabelaAnual titulo="ENCAIXES" cor="success" dados={encaixesData} />
        <TabelaAnual titulo="BOBINAS" cor="info" dados={bobinasData} />
      </div>
      {/* Botões para salvar e visualizar anos */}
      <div className="flex gap-2 mt-4 justify-end flex-wrap">
        <button
          onClick={handleSaveYear}
          className="btn btn-primary btn-sm"
          disabled={!r || !oficina}
        >
          Salvar Ano
        </button>
        {savedYears.map((yearItem) => (
          <button
            key={yearItem.ano}
            onClick={() => handleOpenYear(yearItem.ano)}
            className="btn btn-secondary btn-sm"
          >
            {yearItem.ano}
          </button>
        ))}
      </div>
      {/* Modal para visualizar dados do ano */}
      {selectedYearData && (
        <TcontentAnoModal
          anoData={selectedYearData}
          ano={selectedYearData.ano}
        />
      )}
      {/* Componente de erro */}
      <ErrorComponent errorCode={errorCode} />
    </div>
  );
};

export default Tcontent;
