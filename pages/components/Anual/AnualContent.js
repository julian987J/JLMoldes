/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect } from "react";
import TabelaAnual from "../T/TabelaAnual.js";
import SaldoMensal from "../T/SaldoMensal.js";
import Execute from "models/functions.js";

const AnualContent = () => {
  const [papelData, setPapelData] = useState([]);
  const [despesasDataP, setDespesasDataP] = useState([]);
  const [despesasDataO, setDespesasDataO] = useState([]);
  const [variosData, setVariosData] = useState([]);

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
        const [papel, despesasP, despesasO, varios] = await Promise.all([
          Execute.receiveAnualFromPapelC(),
          Execute.receiveAnualFromSaidaP(),
          Execute.receiveAnualFromSaidaO(),
          Execute.receiveAnualFromC(),
        ]);
        setPapelData(papel ? processarDados(papel, "data", "papel") : []);
        setDespesasDataP(
          despesasP ? processarDados(despesasP, "pago", "valor") : [],
        );
        setDespesasDataO(
          despesasO ? processarDados(despesasO, "pago", "valor") : [],
        );
        setVariosData(
          varios ? processarDados(varios, "date", ["sis", "alt", "base"]) : [],
        );
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setPapelData([]);
        setDespesasDataP([]);
        setDespesasDataO([]);
        setVariosData([]);
      }
    };

    buscarDados();
    const intervalo = setInterval(buscarDados, 5000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-3">
        <TabelaAnual titulo="PAPEL" cor="warning" dados={papelData} />
        <SaldoMensal
          titulo=" PAPEL - DESPESAS OFICINA"
          data1={papelData}
          titulo1="Papel"
          data2={despesasDataO}
          titulo2="Despesas OFICINA"
        />
        <TabelaAnual
          titulo="DESPESAS OFICINA"
          cor="warning"
          dados={despesasDataO}
        />
      </div>
      <div className="flex flex-col md:flex-row gap-3 mt-2">
        <TabelaAnual titulo="VARIOS" cor="warning" dados={variosData} />
        <SaldoMensal
          titulo="VARIOS - DESPESAS ABC"
          data1={variosData}
          titulo1="VARIOS"
          data2={despesasDataP}
          titulo2="Despesas ABC"
        />
        <TabelaAnual
          titulo="DESPESAS ABC"
          cor="warning"
          dados={despesasDataP}
        />
      </div>
    </>
  );
};

export default AnualContent;
