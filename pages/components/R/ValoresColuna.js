import { useEffect, useState, useMemo, useRef } from "react";
import Execute from "models/functions";
import { useWebSocket } from "../../../contexts/WebSocketContext.js"; // Ajuste o caminho

const sortDadosByDate = (dataArray) =>
  [...dataArray].sort((a, b) => new Date(b.data) - new Date(a.data));

const ValoresColuna = ({ r, onValoresChange }) => {
  const [dados, setDados] = useState([]);
  const { lastMessage } = useWebSocket();
  const lastProcessedTimestampRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      if (typeof r === "undefined" || r === null) return;
      try {
        const results = await Execute.receiveFromPapelC(r);
        setDados(
          Array.isArray(results)
            ? sortDadosByDate(results.filter((item) => !item.dtfim))
            : [],
        );
      } catch (error) {
        console.error("Erro:", error);
      }
    };
    fetchData();
  }, [r]);

  useEffect(() => {
    if (lastMessage && lastMessage.data && lastMessage.timestamp) {
      if (
        lastProcessedTimestampRef.current &&
        lastMessage.timestamp <= lastProcessedTimestampRef.current
      ) {
        return;
      }

      const { type, payload } = lastMessage.data;

      if (
        (type === "PAPELC_NEW_ITEM" || type === "PAPELC_UPDATED_ITEM") &&
        payload &&
        String(payload.r) === String(r)
      ) {
        const cutoffDate = new Date("2025-01-01");
        setDados((prev) => {
          const itemIndex = prev.findIndex(
            (item) => String(item.id) === String(payload.id),
          );
          const shouldDisplay =
            !payload.dtfim || new Date(payload.dtfim) >= cutoffDate;

          let newDados = [...prev];

          if (shouldDisplay) {
            if (itemIndex !== -1) {
              newDados[itemIndex] = payload;
            } else {
              newDados.push(payload);
            }
          } else {
            if (itemIndex !== -1) {
              newDados = newDados.filter(
                (item) => String(item.id) !== String(payload.id),
              );
            }
          }
          return sortDadosByDate(newDados);
        });
      }
      if (
        type === "PAPELC_DELETED_ITEM" &&
        payload &&
        payload.id !== undefined
      ) {
        setDados((prev) =>
          sortDadosByDate(
            prev.filter((item) => String(item.id) !== String(payload.id)),
          ),
        );
      }

      lastProcessedTimestampRef.current = lastMessage.timestamp;
    }
  }, [lastMessage, r]);

  const { totalDesperdicio, totalUtil, totalPerdida } = useMemo(() => {
    let desperdicioSum = 0;
    let utilSum = 0;
    let perdidaSum = 0;
    dados.forEach((item) => {
      desperdicioSum += parseFloat(item.desperdicio) || 0;
      utilSum += parseFloat(item.util) || 0;
      perdidaSum += parseFloat(item.perdida) || 0;
    });
    return {
      totalDesperdicio: desperdicioSum,
      totalUtil: utilSum,
      totalPerdida: perdidaSum,
    };
  }, [dados]);

  useEffect(() => {
    const total = totalDesperdicio + totalUtil + totalPerdida;
    const roundedTotal = Math.round((total + Number.EPSILON) * 100) / 100;
    onValoresChange(roundedTotal);
  }, [totalDesperdicio, totalUtil, totalPerdida, onValoresChange]);

  return null;
};

export default ValoresColuna;
