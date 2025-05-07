/* eslint-disable no-undef */
import { useState, useEffect, useRef } from "react";
import Use from "models/utils.js";
import Execute from "models/functions.js";
import { XCircleIcon, AlertIcon } from "@primer/octicons-react";

const Alerta = () => {
  const [data, setData] = useState([]);
  const letras = useRef([
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
  ]);

  const fetchData = async () => {
    try {
      const promises = letras.current.map(async (letra) => {
        const items = await Execute.receiveFromPessoal(letra);
        return items.map((item) => ({ ...item, letra })); // Adiciona a letra em cada item
      });
      const results = await Promise.all(promises);
      setData(results.flat());
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const getStatusVencimento = (entry) => {
    const hoje = new Date();
    hoje.setUTCHours(23, 59, 59, 999);

    const dataVencimentoStr = Use.formatarProximo(
      entry.pago,
      entry.proximo,
      entry.dia,
    );
    const [dd, mm, yyyy] = dataVencimentoStr.split("/");
    const dataVencimento = new Date(
      Date.UTC(yyyy, mm - 1, dd, 23, 59, 59, 999),
    );

    if (dataVencimento < hoje) return "vencido";

    const diffDays = Math.ceil((dataVencimento - hoje) / (1000 * 60 * 60 * 24));
    return !isNaN(entry.alerta) && diffDays <= entry.alerta ? "proximo" : "ok";
  };

  return (
    <>
      {data.map((entry) => {
        const status = getStatusVencimento(entry);

        return (
          <div key={entry.id}>
            {status === "vencido" && (
              <span className="badge badge-error badge-sm">
                <XCircleIcon size={12} />
                Existem contas VENCIDAS em: {entry.letra}
              </span>
            )}

            {status === "proximo" && (
              <span className="badge badge-warning badge-sm">
                <AlertIcon size={12} />
                Existem contas A VENCER em: {entry.letra}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
};

export default Alerta;
