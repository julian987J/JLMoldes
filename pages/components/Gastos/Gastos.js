/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import Pessoal from "./Pessoal.js";
import Oficina from "./Oficina.js";
import SaidasPessoal from "./SaidasPessoal.js";
import SaidasOficina from "./SaidasOficina.js";
import TabelaAnual from "../T/TabelaAnual.js";
import SaldoMensal from "../T/SaldoMensal.js";
import Execute from "models/functions.js";
import { useWebSocket } from "../../../contexts/WebSocketContext.js"; // Importar o hook

const Gastos = ({ letras }) => {
  const [variosData, setVariosData] = useState([]);
  const [gastosData, setGastosData] = useState([]);
  const { lastMessage } = useWebSocket(); // Usar o hook WebSocket

  const formatCurrency = (value) => {
    const numberValue = Number(value) || 0;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numberValue);
  };

  const processarDados = (dados, campoData, camposValor) => {
    const somasDiarias = {};

    // Garante que camposValor seja um array
    const campos = Array.isArray(camposValor) ? camposValor : [camposValor];

    dados?.forEach((item) => {
      try {
        const data = item[campoData].substring(0, 10);
        let totalValor = 0;

        // Soma todos os campos especificados
        campos.forEach((campo) => {
          totalValor += Number(item[campo]) || 0;
        });

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

  useEffect(() => {
    const fetchInitialVariosData = async () => {
      if (!letras) return;
      try {
        const varios = await Execute.receiveFromCGastos(letras);
        setVariosData(
          varios ? processarDados(varios, "data", ["real", "pix"]) : [],
        );
      } catch (error) {
        console.error("Erro ao buscar dados 'varios':", error);
        setVariosData([]);
      }
    };

    const fetchInitialGastosData = async () => {
      if (!letras) return;
      try {
        const gastos = await Execute.receiveFromSaidaP(letras);
        setGastosData(gastos ? processarDados(gastos, "pago", "valor") : []);
      } catch (error) {
        console.error("Erro ao buscar dados 'gastos':", error);
        setGastosData([]);
      }
    };

    fetchInitialVariosData();
    fetchInitialGastosData();
    // O polling com setInterval foi removido
  }, [letras]); // Re-fetch se 'letras' mudar

  // Efeito para lidar com mensagens WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.data) {
      const { type, payload } = lastMessage.data;

      if (payload && payload.letras === letras) {
        if (type === "GASTOS_C_UPDATED" && payload.items) {
          // payload.items deve ser a lista bruta de Execute.receiveFromCGastos
          setVariosData(processarDados(payload.items, "data", ["real", "pix"]));
        } else if (type === "GASTOS_SAIDAP_UPDATED" && payload.items) {
          // payload.items deve ser a lista bruta de Execute.receiveFromSaidaP
          setGastosData(processarDados(payload.items, "pago", "valor"));
        }
      }
    }
  }, [lastMessage, letras]); // Adicionado 'letras' para re-processar se necessário, embora o filtro no payload seja o principal

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <Pessoal letras={letras} />
        <Oficina letras={letras} />
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
