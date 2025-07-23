/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import Pessoal from "./Pessoal.js";
import Oficina from "./Oficina.js";
import Papel from "./Papel.js";
import SaidasPessoal from "./SaidasPessoal.js";
import SaidasOficina from "./SaidasOficina.js";
import TabelaAnual from "../T/TabelaAnual.js";
import SaldoMensal from "../T/SaldoMensal.js";
import Execute from "models/functions.js";
import { useWebSocket } from "../../../contexts/WebSocketContext.js";

const Gastos = ({ letras }) => {
  const [rawVariosData, setRawVariosData] = useState([]);
  const [variosData, setVariosData] = useState([]);
  const [rawGastosData, setRawGastosData] = useState([]);
  const [gastosData, setGastosData] = useState([]);
  const { lastMessage } = useWebSocket();

  const formatCurrency = (value) => {
    const numberValue = Number(value) || 0;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numberValue);
  };

  const processarDados = (dados, campoData, camposValor) => {
    const somasDiarias = {};
    const campos = Array.isArray(camposValor) ? camposValor : [camposValor];

    dados?.forEach((item) => {
      try {
        const data = item[campoData]?.substring(0, 10);
        if (!data) return;

        const totalValor = campos.reduce(
          (acc, campo) => acc + (Number(item[campo]) || 0),
          0,
        );

        somasDiarias[data] = (somasDiarias[data] || 0) + totalValor;
      } catch (error) {
        console.error("Erro ao processar item:", item, error);
      }
    });

    return Object.entries(somasDiarias).map(([data, total]) => ({
      data,
      valor: formatCurrency(total),
    }));
  };

  // Fetch initial data
  useEffect(() => {
    const fetchAllData = async () => {
      if (!letras) return;
      try {
        const varios = await Execute.receiveFromCGastos(letras);
        setRawVariosData(varios);
      } catch (error) {
        console.error("Erro ao buscar dados 'varios':", error);
        setRawVariosData([]);
      }
      try {
        const gastos = await Execute.receiveFromSaidaP(letras);
        setRawGastosData(gastos);
      } catch (error) {
        console.error("Erro ao buscar dados 'gastos':", error);
        setRawGastosData([]);
      }
    };
    fetchAllData();
  }, [letras]);

  // Process data when raw data changes
  useEffect(() => {
    setVariosData(processarDados(rawVariosData, "data", ["real", "pix"]));
  }, [rawVariosData]);

  useEffect(() => {
    setGastosData(processarDados(rawGastosData, "pago", "valor"));
  }, [rawGastosData]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage?.data) {
      let messageData;
      try {
        messageData =
          typeof lastMessage.data === "string"
            ? JSON.parse(lastMessage.data)
            : lastMessage.data;
      } catch (error) {
        console.error("Erro ao parsear lastMessage.data:", error);
        return;
      }

      const { type, payload } = messageData;
      if (!type || !payload) return;

      // Handle Varios/CGastos updates
      if (type.startsWith("C_")) {
        if (type === "C_NEW_ITEM") {
          setRawVariosData((prev) => [...prev, payload]);
        } else if (type === "C_UPDATED_ITEM") {
          setRawVariosData((prev) =>
            prev.map((item) => (item.id === payload.id ? payload : item)),
          );
        } else if (type === "C_DELETED_ITEM") {
          setRawVariosData((prev) =>
            prev.filter((item) => item.id !== payload.id),
          );
        }
      }
      // Handle Gastos/SaidaP updates
      else if (type.startsWith("SAIDAS_PESSOAL_")) {
        if (type === "SAIDAS_PESSOAL_NEW_ITEM") {
          setRawGastosData((prev) => [...prev, payload]);
        } else if (type === "SAIDAS_PESSOAL_UPDATED_ITEM") {
          setRawGastosData((prev) =>
            prev.map((item) => (item.id === payload.id ? payload : item)),
          );
        } else if (type === "SAIDAS_PESSOAL_DELETED_ITEM") {
          setRawGastosData((prev) =>
            prev.filter((item) => item.id !== payload.id),
          );
        }
      }
    }
  }, [lastMessage]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <Pessoal letras={letras} />
        <Oficina letras={letras} />
      </div>
      <div className="my-2">
        <Papel letras={letras} />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <TabelaAnual titulo="VARIOS" cor="warning" dados={variosData} />
        <SaldoMensal
          titulo=" VARIOS - GASTOS"
          data1={variosData}
          titulo1="Varios"
          data2={gastosData}
          titulo2="Gastos"
        />
        <TabelaAnual titulo="GASTOS" cor="warning" dados={gastosData} />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <SaidasPessoal letras={letras} />
        <SaidasOficina letras={letras} />
      </div>
    </div>
  );
};

export default Gastos;
