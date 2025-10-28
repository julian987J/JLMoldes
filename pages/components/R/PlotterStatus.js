import React, { useEffect, useState, useCallback, useRef } from "react";
import Execute from "models/functions";
import { useWebSocket } from "../../../contexts/WebSocketContext";

const formatNumber = (value) => {
  const number = parseFloat(value);
  return isNaN(number) ? "0.00" : number.toFixed(2);
};

const PlotterStatus = ({ r, plotterNome }) => {
  const [dados, setDados] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useWebSocket();
  const lastProcessedTimestampRef = useRef(null);

  const handleSwap = async (item) => {
    try {
      await Execute.swapSimNaoPlotterC(item.id);
    } catch (error) {
      console.error("Erro ao trocar Sim e Não:", error);
    }
  };

  const fetchData = useCallback(async () => {
    if (typeof r === "undefined" || r === null) return;
    setLoading(true);
    try {
      const [plotterResults, configResult] = await Promise.all([
        Execute.receiveFromPlotterC(r),
        Execute.receiveFromConfig(),
      ]);

      const filteredData = Array.isArray(plotterResults)
        ? plotterResults.filter((item) => item.plotter_nome === plotterNome)
        : [];

      setDados(
        filteredData.sort(
          (a, b) =>
            new Date(b.data) - new Date(a.data) ||
            new Date(b.inicio) - new Date(a.inicio),
        ),
      );

      if (Array.isArray(configResult) && configResult.length > 0) {
        setConfig(configResult[0]);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [r, plotterNome]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        payload &&
        (type === "PLOTTER_C_NEW_ITEM" || type === "PLOTTER_C_UPDATED_ITEM") &&
        String(payload.r) === String(r) &&
        payload.plotter_nome === plotterNome
      ) {
        setDados((prevDados) => {
          const newDados = [...prevDados];
          const itemIndex = newDados.findIndex(
            (item) => String(item.id) === String(payload.id),
          );

          if (type === "PLOTTER_C_NEW_ITEM") {
            if (itemIndex === -1) newDados.push(payload);
          } else {
            if (itemIndex !== -1) {
              newDados[itemIndex] = payload;
            } else {
              newDados.push(payload);
            }
          }
          return newDados.sort(
            (a, b) =>
              new Date(b.data) - new Date(a.data) ||
              new Date(b.inicio) - new Date(a.inicio),
          );
        });
      } else if (
        type === "PLOTTER_C_DELETED_ITEM" &&
        payload &&
        payload.id !== undefined
      ) {
        setDados((prevDados) =>
          prevDados.filter((item) => String(item.id) !== String(payload.id)),
        );
      }

      if (type === "CONFIG_UPDATED_ITEM" && payload) {
        setConfig(payload);
      }

      lastProcessedTimestampRef.current = lastMessage.timestamp;
    }
  }, [lastMessage, r, plotterNome]);

  if (loading) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  const desperdicioConfig = config ? parseFloat(config.d) || 0 : 0;

  return (
    <div className="overflow-x-auto rounded-box border border-warning bg-base-100 p-1">
      <h2 className="p-1 text-center font-bold text-sm">{plotterNome}</h2>
      <table className="table table-xs">
        <tbody>
          {dados.map((item) => {
            const larguraTotal = parseFloat(item.largura) + desperdicioConfig;
            const m1Value = ((parseFloat(item.sim) / 100) * larguraTotal) / 100;
            const m2Value = ((parseFloat(item.nao) / 100) * larguraTotal) / 100;

            return (
              <tr key={item.id} className="border-b border-warning">
                <td className="text-center bg-info/30">
                  {formatNumber(m1Value)}
                </td>
                <td className="text-center bg-error/30">
                  {formatNumber(m2Value)}
                </td>
                <td className="text-center bg-success/30">{item.nome}</td>
                <td>
                  <button
                    className="btn btn-xs btn-soft btn-success"
                    onClick={() => handleSwap(item)}
                  >
                    <strong className="text-info">S</strong>/
                    <strong className="text-error">N</strong>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PlotterStatus;
