import React, { useEffect, useState, useCallback, useRef } from "react";
import Execute from "models/functions";
import Edit from "../Edit";
import { useWebSocket } from "../../../contexts/WebSocketContext";

const formatNumber = (value) => {
  const number = parseFloat(value);
  return isNaN(number) ? "0.00" : number.toFixed(2);
};

const Coluna3 = () => {
  const [dados, setDados] = useState([]);
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Execute.receiveFromPlotterC();
      setDados(
        Array.isArray(results)
          ? results.sort(
              (a, b) =>
                new Date(b.data) - new Date(a.data) ||
                new Date(b.inicio) - new Date(a.inicio),
            )
          : [],
      );
    } catch (error) {
      console.error("Erro ao buscar dados de PlotterC:", error);
    } finally {
      setLoading(false);
    }
  }, []);

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
        type === "PLOTTER_C_NEW_ITEM" ||
        type === "PLOTTER_C_UPDATED_ITEM" ||
        type === "PLOTTER_C_DELETED_ITEM"
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
      lastProcessedTimestampRef.current = lastMessage.timestamp;
    }
  }, [lastMessage, editingId]);

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

  return (
    <div className="overflow-x-auto rounded-box border border-warning bg-base-100">
      <table className="table table-xs">
        <thead>
          <tr>
            <th className="hidden">ID</th>
            <th>Sim</th>
            <th>Não</th>
            <th>M1</th>
            <th>M2</th>
            <th>Desp.</th>
            <th>Data</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((item) => (
            <tr key={item.id} className="border-b border-warning">
              <td className="hidden">{item.id}</td>
              <td>
                {editingId === item.id ? (
                  <input
                    type="number"
                    value={editedData.sim}
                    onChange={(e) => handleInputChange("sim", e.target.value)}
                    className="input input-xs p-0 m-0 text-center"
                  />
                ) : (
                  `${formatNumber(item.sim)}%`
                )}
              </td>
              <td>
                {editingId === item.id ? (
                  <input
                    type="number"
                    value={editedData.nao}
                    onChange={(e) => handleInputChange("nao", e.target.value)}
                    className="input input-xs p-0 m-0 text-center"
                  />
                ) : (
                  `${formatNumber(item.nao)}%`
                )}
              </td>
              <td>
                {editingId === item.id ? (
                  <input
                    type="number"
                    value={editedData.m1}
                    onChange={(e) => handleInputChange("m1", e.target.value)}
                    className="input input-xs p-0 m-0 text-center"
                  />
                ) : (
                  formatNumber(item.m1)
                )}
              </td>
              <td>
                {editingId === item.id ? (
                  <input
                    type="number"
                    value={editedData.m2}
                    onChange={(e) => handleInputChange("m2", e.target.value)}
                    className="input input-xs p-0 m-0 text-center"
                  />
                ) : (
                  formatNumber(item.m2)
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
              <td>{item.data}</td>
              <td>{item.inicio}</td>
              <td>{item.fim}</td>
              <td>
                <Edit
                  isEditing={editingId === item.id}
                  onEdit={() => startEditing(item)}
                  onSave={() => handleSave(editedData)}
                  onCancel={() => setEditingId(null)}
                />
                <button
                  className={`btn btn-xs btn-soft btn-error ${editingId === item.id ? "hidden" : ""}`}
                  onClick={() => Execute.removePlotterC(item.id)}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Coluna3;
