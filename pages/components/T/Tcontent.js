/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
import TabelaAnual from "./TabelaAnual.js";
import Execute from "models/functions.js";
import SaldoMensal from "./SaldoMensal";
import { useWebSocket } from "../../../contexts/WebSocketContext.js";

const Tcontent = ({ r, oficina }) => {
  const [papelData, setPapelData] = useState([]);
  const [despesasData, setDespesasData] = useState([]);
  const [encaixesData, setEncaixesData] = useState([]);
  const [bobinasData, setBobinasData] = useState([]);
  const { lastMessage } = useWebSocket(); // Adicione esta linha

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

  useEffect(() => {
    fetchPapelData();
    fetchDespesasData();
    fetchEncaixesData();
    fetchBobinasData();
  }, [fetchPapelData, fetchDespesasData, fetchEncaixesData, fetchBobinasData]);

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
    </div>
  );
};

export default Tcontent;
