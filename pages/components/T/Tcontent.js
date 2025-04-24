/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import TabelaAnual from "./TabelaAnual.js";
import Execute from "models/functions.js";
import SaldoMensal from "./SaldoMensal";

const Tcontent = ({ r, oficina }) => {
  const [papelData, setPapelData] = useState([]);
  const [despesasData, setDespesasData] = useState([]);

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
        const data = item[campoData].substring(0, 10);
        const valor = Number(item[campoValor]) || 0;

        somasDiarias[data] = (somasDiarias[data] || 0) + valor;
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
        const [papel, despesas] = await Promise.all([
          Execute.receiveFromPapelC(r),
          Execute.receiveFromSaidaOficina(oficina),
        ]);

        setPapelData(papel ? processarDados(papel, "data", "papel") : []);
        setDespesasData(
          despesas ? processarDados(despesas, "pago", "valor") : [],
        );
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setPapelData([]);
        setDespesasData([]);
      }
    };

    buscarDados();
    const intervalo = setInterval(buscarDados, 5000);
    return () => clearInterval(intervalo);
  }, [r, oficina]);

  return (
    <div className="flex flex-col md:flex-row gap-3">
      <TabelaAnual titulo="PAPEL" cor="warning" dados={papelData} />
      <SaldoMensal
        cor="info"
        titulo=" PAPEL - DESPESAS"
        data1={papelData}
        titulo1="Papel"
        data2={despesasData}
        titulo2="Despesas"
      />
      <TabelaAnual titulo="DESPESAS" cor="warning" dados={despesasData} />
    </div>
  );
};

export default Tcontent;
