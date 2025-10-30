/* eslint-disable no-undef */
import { useState, useEffect, useRef } from "react";
import Use from "models/utils.js";
import Execute from "models/functions.js";
import { XCircleIcon, AlertIcon } from "@primer/octicons-react";
import { useWebSocket } from "../../../contexts/WebSocketContext.js";

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

  const { lastMessage } = useWebSocket(); // Use o hook

  useEffect(() => {
    // Busca inicial dos dados de alertas (opcional, mas manteremos por enquanto)
    const fetchInitialData = async () => {
      try {
        const promises = letras.current.map(async (letra) => {
          const pessoalItems = await Execute.receiveFromPessoal(letra);
          const papelItems = await Execute.receiveFromPapel(letra);
          return [
            ...pessoalItems.map((item) => ({
              ...item,
              letra,
              type: "pessoal",
            })),
            ...papelItems.map((item) => ({ ...item, letra, type: "papel" })),
          ];
        });
        const results = await Promise.all(promises);
        setData(results.flat());
      } catch (error) {
        console.error("Erro ao buscar dados de alertas:", error);
        setData([]);
      }
    };
    fetchInitialData();
    // O polling com setInterval foi removido
  }, []);

  // Efeito para lidar com mensagens WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.data) {
      const { type, payload } = lastMessage.data;

      if (type === "PESSOAL_NEW_ITEM" && payload) {
        const newItem = { ...payload, letra: payload.dec };
        setData((prevData) => {
          if (prevData.some((item) => item.id === newItem.id)) {
            return prevData.map((item) =>
              item.id === newItem.id ? newItem : item,
            );
          }
          return [...prevData, newItem];
        });
      } else if (type === "PESSOAL_UPDATED_ITEM" && payload) {
        const updatedItem = { ...payload, letra: payload.dec, type: "pessoal" };
        setData((prevData) =>
          prevData.map((item) =>
            item.id === updatedItem.id && item.type === "pessoal"
              ? updatedItem
              : item,
          ),
        );
      } else if (type === "PESSOAL_DELETED_ITEM" && payload) {
        setData((prevData) =>
          prevData.filter(
            (item) => item.id !== payload.id || item.type !== "pessoal",
          ),
        );
      } else if (type === "PAPEL_NEW_ITEM" && payload) {
        const newItem = { ...payload, letra: payload.dec, type: "papel" };
        setData((prevData) => {
          if (
            prevData.some(
              (item) => item.id === newItem.id && item.type === "papel",
            )
          ) {
            return prevData.map((item) =>
              item.id === newItem.id && item.type === "papel" ? newItem : item,
            );
          }
          return [...prevData, newItem];
        });
      } else if (type === "PAPEL_UPDATED_ITEM" && payload) {
        const updatedItem = { ...payload, letra: payload.dec, type: "papel" };
        setData((prevData) =>
          prevData.map((item) =>
            item.id === updatedItem.id && item.type === "papel"
              ? updatedItem
              : item,
          ),
        );
      } else if (type === "PAPEL_DELETED_ITEM" && payload) {
        setData((prevData) =>
          prevData.filter(
            (item) => item.id !== payload.id || item.type !== "papel",
          ),
        );
      }
    }
  }, [lastMessage]);

  const getStatusVencimento = (entry) => {
    if (entry.type === "pessoal") {
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

      const diffDays = Math.ceil(
        (dataVencimento - hoje) / (1000 * 60 * 60 * 24),
      );
      return !isNaN(entry.alerta) && diffDays <= entry.alerta
        ? "proximo"
        : "ok";
    } else if (entry.type === "papel") {
      const metragem = parseFloat(entry.metragem);
      const alertaThreshold = parseFloat(entry.alerta);

      if (isNaN(metragem)) {
        return "ok";
      }

      if (metragem === 0) {
        return "vencido";
      }

      if (isNaN(alertaThreshold)) {
        return "ok";
      }

      if (metragem < alertaThreshold) {
        return "proximo";
      }
      return "ok";
    }
    return "ok"; // Default case
  };

  return (
    // Renderização permanece a mesma
    <>
      {data.map((entry) => {
        const status = getStatusVencimento(entry);

        return (
          <div key={`${entry.type}-${entry.id}`}>
            {status === "vencido" && (
              <span className="badge badge-error badge-sm">
                <XCircleIcon size={12} />
                Existem contas VENCIDAS em: {entry.letra} (
                {entry.type === "pessoal" ? "Pessoal" : "Papel"})
              </span>
            )}

            {status === "proximo" && (
              <span className="badge badge-warning badge-sm">
                <AlertIcon size={12} />
                Existem contas A VENCER em: {entry.letra} (
                {entry.type === "pessoal" ? "Pessoal" : "Papel"})
              </span>
            )}
          </div>
        );
      })}
    </>
  );
};

export default Alerta;
