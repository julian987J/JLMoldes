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

const Gastos = ({ letras }) => {
  const [variosData, setVariosData] = useState([]);
  const [gastosData, setGastosData] = useState([]);

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
    const buscarDados = async () => {
      try {
        const [varios, gastos] = await Promise.all([
          Execute.receiveFromCGastos(letras),
          Execute.receiveFromSaidaP(letras),
        ]);

        setVariosData(
          varios ? processarDados(varios, "data", ["real", "pix"]) : [],
        );
        setGastosData(gastos ? processarDados(gastos, "pago", "valor") : []);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setVariosData([]);
        setGastosData([]);
      }
    };

    buscarDados();
    const intervalo = setInterval(buscarDados, 5000);
    return () => clearInterval(intervalo);
  }, [letras]);

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
