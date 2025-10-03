import React, { useEffect, useState, useCallback, useRef } from "react";
import Execute from "models/functions";
import Edit from "../Edit";
import { useWebSocket } from "../../../contexts/WebSocketContext";

const formatarDataDDMMYYYY = (isoDate) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) {
    return isoDate;
  }
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

const formatarHoraHHMMSS = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return isoString;
  }
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

const formatNumber = (value) => {
  const number = parseFloat(value);
  return isNaN(number) ? "0.00" : number.toFixed(2);
};

const Coluna3 = ({ r }) => {
  const [dados, setDados] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const { lastMessage } = useWebSocket();
  const lastProcessedTimestampRef = useRef(null);

  const handleSave = async (editedData) => {
    try {
      const response = await fetch("/api/v1/tables/c/plotter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedData),
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

      setDados(
        Array.isArray(plotterResults)
          ? plotterResults.sort(
              (a, b) =>
                new Date(b.data) - new Date(a.data) ||
                new Date(b.inicio) - new Date(a.inicio),
            )
          : [],
      );

      if (Array.isArray(configResult) && configResult.length > 0) {
        setConfig(configResult[0]);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [r]);

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
        ((type === "PLOTTER_C_NEW_ITEM" || type === "PLOTTER_C_UPDATED_ITEM") &&
          payload &&
          String(payload.r) === String(r)) ||
        (type === "PLOTTER_C_DELETED_ITEM" &&
          payload &&
          payload.id !== undefined)
      ) {
        setDados((prevDados) => {
          let newDados = [...prevDados];
          const itemIndex =
            payload.id !== undefined
              ? newDados.findIndex(
                  (item) => String(item.id) === String(payload.id),
                )
              : -1;

          switch (type) {
            case "PLOTTER_C_NEW_ITEM":
              if (itemIndex === -1) newDados.push(payload);
              break;
            case "PLOTTER_C_UPDATED_ITEM":
              if (itemIndex !== -1) {
                newDados[itemIndex] = payload;
              } else {
                newDados.push(payload);
              }
              if (editingId === payload.id) setEditingId(null);
              break;
            case "PLOTTER_C_DELETED_ITEM":
              newDados = newDados.filter(
                (item) => String(item.id) !== String(payload.id),
              );
              if (editingId === payload.id) setEditingId(null);
              break;
          }
          return newDados.sort(
            (a, b) =>
              new Date(b.data) - new Date(a.data) ||
              new Date(b.inicio) - new Date(a.inicio),
          );
        });
      }

      if (type === "CONFIG_UPDATED_ITEM" && payload) {
        setConfig(payload);
      }

      lastProcessedTimestampRef.current = lastMessage.timestamp;
    }
  }, [lastMessage, editingId, r]);

  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditedData({
      ...item,
      sim: formatNumber(item.sim),
      nao: formatNumber(item.nao),
      m1: formatNumber(item.m1),
      m2: formatNumber(item.m2),
      desperdicio: formatNumber(item.desperdicio),
    });
  };

  if (loading) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  const desperdicioConfig = config ? parseFloat(config.d) || 0 : 0;

  return (
    <div className="overflow-x-auto rounded-box border border-warning bg-base-100">
      <table className="table table-xs">
        <thead>
          <tr>
            <th className="hidden">ID</th>
            <th className="text-center bg-info">Sim</th>
            <th className="text-center bg-error">Não</th>
            <th className="text-center bg-info">M1</th>
            <th className="text-center bg-error">M2</th>
            <th>Desp.</th>
            <th>Larg.</th>
            <th className="text-center bg-success">Data</th>
            <th className="text-center bg-success">Início</th>
            <th className="text-center bg-success">Fim</th>
            <th className="text-center bg-success">Arquivo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((item) => {
            const larguraTotal =
              parseFloat(item.largura) + desperdicioConfig;
            const larguraTotalEdit =
              (parseFloat(editedData.largura) || 0) + desperdicioConfig;

            return (
              <tr key={item.id} className="border-b border-warning">
                <td className="hidden">{item.id}</td>
                <td className="text-center bg-info/30">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      value={editedData.sim}
                      onChange={(e) =>
                        handleInputChange("sim", e.target.value)
                      }
                      className="input input-xs p-0 m-0 text-center"
                    />
                  ) : (
                    `${formatNumber(item.sim)}%`
                  )}
                </td>
                <td className="text-center bg-error/30">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      value={editedData.nao}
                      onChange={(e) =>
                        handleInputChange("nao", e.target.value)
                      }
                      className="input input-xs p-0 m-0 text-center"
                    />
                  ) : (
                    `${formatNumber(item.nao)}%`
                  )}
                </td>
                <td className="text-center bg-info/30">
                  {editingId === item.id
                    ? formatNumber(
                        (parseFloat(editedData.sim) / 100) * larguraTotalEdit,
                      )
                    : formatNumber(
                        (parseFloat(item.sim) / 100) * larguraTotal,
                      )}
                </td>
                <td className="text-center bg-error/30">
                  {editingId === item.id
                    ? formatNumber(
                        (parseFloat(editedData.nao) / 100) * larguraTotalEdit,
                      )
                    : formatNumber(
                        (parseFloat(item.nao) / 100) * larguraTotal,
                      )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <input
                      type="number"
                      value={editedData.desperdicio}
                      onChange={(e) =>
                        handleInputChange("desperdicio", e.target.value)
                      }
                      className="input input-xs p-0 m-0 text-center"
                    />
                  ) : (
                    formatNumber(item.desperdicio)
                  )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <input
                      type="number"
                      value={editedData.largura}
                      onChange={(e) =>
                        handleInputChange("largura", e.target.value)
                      }
                      className="input input-xs p-0 m-0 text-center"
                    />
                  ) : (
                    formatNumber(larguraTotal)
                  )}
                </td>
                <td className="text-center bg-success/30">
                  {formatarDataDDMMYYYY(item.data)}
                </td>
                <td className="text-center bg-success/30">
                  {formatarHoraHHMMSS(item.inicio)}
                </td>
                <td className="text-center bg-success/30">
                  {formatarHoraHHMMSS(item.fim)}
                </td>
                <td className="text-center bg-success/30">
                  {formatarHoraHHMMSS(item.nome)}
                </td>
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
                  <button
                    className={`btn btn-xs btn-error ${editingId === item.id ? "hidden" : ""}`}
                    onClick={() => Execute.removePlotterC(item.id)}
                  >
                    Excluir
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

export default Coluna3;
