/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
import TabelaAnual from "./TabelaAnual.js";
import Execute from "models/functions.js";

const Tcontent = ({ r }) => {
  const [papelData, setPapelData] = useState([]);

  const formatCurrency = (value) => {
    const numberValue = Number(value) || 0;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numberValue);
  };

  const processPapelData = (rawData) => {
    const dailySums = {};

    rawData.forEach((item) => {
      try {
        const dateStr = item.data.substring(0, 10);
        const papelValue = Number(item.papel) || 0;

        if (dailySums[dateStr]) {
          dailySums[dateStr] += papelValue;
        } else {
          dailySums[dateStr] = papelValue;
        }
      } catch (error) {
        console.error(
          "Tcontent: Erro ao processar item de Papel:",
          item,
          error,
        );
      }
    });

    const formattedData = Object.entries(dailySums).map(([date, sum]) => ({
      data: date,
      valor: formatCurrency(sum),
    }));

    return formattedData;
  };

  const fetchData = useCallback(async () => {
    try {
      const rawPapel = await Execute.receiveFromPapelC(r);

      if (rawPapel) {
        const processedPapel = processPapelData(rawPapel);
        setPapelData(processedPapel);
      } else {
        console.error("Tcontent: Nenhum dado recebido de receiveFromPapelC.");
        setPapelData([]);
      }
    } catch (error) {
      console.error("Tcontent: Erro ao buscar ou processar dados:", error);
      setPapelData([]);
    }
  }, [r]);

  useEffect(() => {
    fetchData(); // Busca inicial
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-3">
        <TabelaAnual titulo="PAPEL" cor="warning" dados={papelData} />
        <TabelaAnual titulo="DESPESAS" cor="warning" dados={[]} />
      </div>
    </>
  );
};

export default Tcontent;
