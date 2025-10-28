import React, { useEffect, useState, useCallback, useRef } from "react";
import Execute from "models/functions";
import Edit from "../Edit";
import { useWebSocket } from "../../../contexts/WebSocketContext";

const formatNumber = (value) => {
  const number = parseFloat(value);
  return isNaN(number) ? "0.00" : number.toFixed(2);
};

const PlotterStatus = ({ r, plotterNome }) => {
  const [dados, setDados] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const { lastMessage } = useWebSocket();
  const lastProcessedTimestampRef = useRef(null);

  const handleSave = async (editedData) => {
    try {
      const desperdicioConfigValue = config ? parseFloat(config.d) || 0 : 0;
      // Use the original 'largura' from the item, which is in editedData in cm
      const largura_cm = editedData.largura;
      const larguraTotal_cm = largura_cm + desperdicioConfigValue;

      if (larguraTotal_cm === 0) {
        console.error("Largura total não pode ser zero.");
        return;
      }

      const newSim = (parseFloat(editedData.m1) * 100 * 100) / larguraTotal_cm;
      const newNao = (parseFloat(editedData.m2) * 100 * 100) / larguraTotal_cm;

      const dataToSave = {
        ...editedData,
        sim: newSim,
        nao: newNao,
      };
      delete dataToSave.m1;
      delete dataToSave.m2;

      const response = await fetch("/api/v1/tables/c/plotter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });
      if (!response.ok) throw new Error("Erro ao atualizar");
      setEditingId(null);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

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
            if (editingId === payload.id) setEditingId(null);
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
        if (editingId === payload.id) setEditingId(null);
      }

      if (type === "CONFIG_UPDATED_ITEM" && payload) {
        setConfig(payload);
      }

      lastProcessedTimestampRef.current = lastMessage.timestamp;
    }
  }, [lastMessage, editingId, r, plotterNome]);

  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const startEditing = (item) => {
    const desperdicioConfigValue = config ? parseFloat(config.d) || 0 : 0;
    const larguraTotal = parseFloat(item.largura) + desperdicioConfigValue;
    const m1Value = ((parseFloat(item.sim) / 100) * larguraTotal) / 100;
    const m2Value = ((parseFloat(item.nao) / 100) * larguraTotal) / 100;

    setEditingId(item.id);
    setEditedData({
      ...item,
      m1: formatNumber(m1Value),
      m2: formatNumber(m2Value),
    });
  };

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
                  {editingId === item.id ? (
                    <input
                      type="number"
                      placeholder="M1"
                      value={editedData.m1}
                      onChange={(e) => handleInputChange("m1", e.target.value)}
                      className="input input-xs p-0 m-0 text-center w-20"
                    />
                  ) : (
                    formatNumber(m1Value)
                  )}
                </td>
                <td className="text-center bg-error/30">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      placeholder="M2"
                      value={editedData.m2}
                      onChange={(e) => handleInputChange("m2", e.target.value)}
                      className="input input-xs p-0 m-0 text-center w-20"
                    />
                  ) : (
                    formatNumber(m2Value)
                  )}
                </td>
                <td className="text-center bg-success/30">{item.nome}</td>
                <td>
                  <Edit
                    isEditing={editingId === item.id}
                    onEdit={() => startEditing(item)}
                    onSave={() => handleSave(editedData)}
                    onCancel={() => setEditingId(null)}
                  />
                  <button
                    className={`btn btn-xs btn-soft btn-success ${editingId === item.id ? "hidden" : ""}`}
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
