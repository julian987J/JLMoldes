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
  const [papeis, setPapeis] = useState([]);
  const [oldestPapel, setOldestPapel] = useState(null);
  const [newerPapeis, setNewerPapeis] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const { lastMessage } = useWebSocket();
  const lastProcessedTimestampRef = useRef(null);

  const handleSave = async (editedData) => {
    try {
      const dataToSave = {
        ...editedData,
        desperdicio: parseFloat(editedData.desperdicio) * 100,
        largura: parseFloat(editedData.largura) * 100,
        confirmado: editedData.confirmado, // Adiciona o campo confirmado
      };
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
      const workshop = "R" + r;
      const [plotterResults, configResult, papelResults] = await Promise.all([
        Execute.receiveFromPlotterC(r),
        Execute.receiveFromConfig(),
        Execute.receiveFromPapelByItem(workshop),
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

      if (Array.isArray(papelResults)) {
        const filteredPapeis = papelResults
          .filter((p) => p.gastos && p.gastos.startsWith("PAPEL-"))
          .sort((a, b) => a.id - b.id); // Sort ascending by ID
        setPapeis(filteredPapeis);
      } else {
        setPapeis([]);
      }

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
    if (papeis && papeis.length > 0) {
      setOldestPapel(papeis[0]);
      setNewerPapeis(papeis.slice(1));
    } else {
      setOldestPapel(null);
      setNewerPapeis([]);
    }
  }, [papeis]);

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

      const workshop = "R" + r;
      if (payload && payload.item === workshop) {
        switch (type) {
          case "PAPEL_NEW_ITEM":
            if (payload.gastos && payload.gastos.startsWith("PAPEL-")) {
              setPapeis((prev) =>
                [...prev, payload].sort((a, b) => a.id - b.id),
              );
            }
            break;
          case "PAPEL_UPDATED_ITEM":
            setPapeis((prev) => {
              const isPapel =
                payload.gastos && payload.gastos.startsWith("PAPEL-");
              const itemExists = prev.some(
                (item) => String(item.id) === String(payload.id),
              );

              let newPapeis;

              if (isPapel) {
                if (itemExists) {
                  newPapeis = prev.map((item) =>
                    String(item.id) === String(payload.id) ? payload : item,
                  );
                } else {
                  newPapeis = [...prev, payload];
                }
              } else {
                newPapeis = prev.filter(
                  (item) => String(item.id) !== String(payload.id),
                );
              }

              return newPapeis.sort((a, b) => a.id - b.id);
            });
            break;
        }
      }

      // Handle PAPEL_DELETED_ITEM separately as it may not have the 'item' property
      if (
        type === "PAPEL_DELETED_ITEM" &&
        payload &&
        payload.id !== undefined
      ) {
        setPapeis((prev) =>
          prev.filter((item) => String(item.id) !== String(payload.id)),
        );
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
      desperdicio: formatNumber(item.desperdicio / 100),
      largura: formatNumber(item.largura / 100),
      confirmado: item.confirmado, // Adiciona o campo confirmado
    });
  };

  if (loading) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  const desperdicioConfig = config ? parseFloat(config.d) || 0 : 0;
  const multiplicadorConfig = config ? parseFloat(config.m) || 1 : 1;

  // Filter data for each plotter
  const dadosP01 = dados.filter((item) => item.plotter_nome === "P01");
  const dadosP02 = dados.filter((item) => item.plotter_nome === "P02");

  // Calculate totals for P01
  const totalM1_P01 = dadosP01.reduce((acc, item) => {
    const larguraTotalCm = parseFloat(item.largura) + desperdicioConfig;
    const m1Value = (parseFloat(item.sim) / 100) * (larguraTotalCm / 100);
    return acc + m1Value;
  }, 0);
  const totalM2_P01 = dadosP01.reduce((acc, item) => {
    const larguraTotalCm = parseFloat(item.largura) + desperdicioConfig;
    const m2Value = (parseFloat(item.nao) / 100) * (larguraTotalCm / 100);
    return acc + m2Value;
  }, 0);

  // Calculate totals for P02
  const totalM1_P02 = dadosP02.reduce((acc, item) => {
    const larguraTotalCm = parseFloat(item.largura) + desperdicioConfig;
    const m1Value = (parseFloat(item.sim) / 100) * (larguraTotalCm / 100);
    return acc + m1Value;
  }, 0);
  const totalM2_P02 = dadosP02.reduce((acc, item) => {
    const larguraTotalCm = parseFloat(item.largura) + desperdicioConfig;
    const m2Value = (parseFloat(item.nao) / 100) * (larguraTotalCm / 100);
    return acc + m2Value;
  }, 0);

  const handleFinalizarPapel = async () => {
    if (oldestPapel) {
      try {
        // Optimistic update: remove the item from the local state immediately
        setPapeis((prevPapeis) =>
          prevPapeis.filter((p) => p.id !== oldestPapel.id),
        );
        // Then, send the request to the server
        await Execute.removePapel(oldestPapel.id);
      } catch (error) {
        console.error("Erro ao finalizar papel:", error);
        // Optional: add logic to revert state if the API call fails
      }
    }
  };

  // Apply multiplier
  const totalM1_P01_Multiplicado = totalM1_P01 * multiplicadorConfig;
  const totalM2_P01_Multiplicado = totalM2_P01 * multiplicadorConfig;
  const totalM1_P02_Multiplicado = totalM1_P02 * multiplicadorConfig;
  const totalM2_P02_Multiplicado = totalM2_P02 * multiplicadorConfig;

  const totalMetragemM1 = totalM1_P01 + totalM1_P02;
  const totalMetragemM2 = totalM2_P01 + totalM2_P02;

  let unconfirmedCount = 0;

  return (
    <div className="overflow-x-auto rounded-box border border-warning bg-base-100 p-4">
      {newerPapeis.length > 0 && (
        <div className="mb-4">
          <h2 className="p-2 text-center font-bold">Papeis Recentes</h2>
          <table className="table table-xs">
            <thead className="text-center">
              <tr>
                <th className="text-center bg-info">Metragem Restante</th>
                <th className="text-center bg-success">Papel</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {newerPapeis.map((papel) => (
                <tr key={papel.id}>
                  <td className="text-center bg-info/30">
                    {formatNumber(papel.metragem)}
                  </td>
                  <td className="text-center bg-success/30">{papel.gastos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <table className="table table-xs">
        <thead>
          <tr>
            {oldestPapel ? (
              <th
                colSpan={2}
                key={oldestPapel.id}
                className="text-center bg-success"
              >
                {oldestPapel.gastos}
              </th>
            ) : (
              <th colSpan={2}></th>
            )}
            <th colSpan={4} className="bg-success"></th>
            <th colSpan={2} rowSpan={2} className="bg-error">
              {oldestPapel && (
                <button
                  className="btn btn-ghost btn-error rounded-none"
                  onClick={handleFinalizarPapel}
                >
                  Finalizar
                </button>
              )}
            </th>
            <th colSpan={6}></th>
          </tr>
          <tr>
            {oldestPapel ? (
              <th
                colSpan={2}
                key={oldestPapel.id}
                className="text-center bg-info/30"
              >
                {formatNumber(oldestPapel.metragem)}
              </th>
            ) : (
              <th colSpan={2}></th>
            )}
            <th colSpan={4} className="text-center bg-info/30">
              {formatNumber(totalMetragemM1 + totalMetragemM2)}
            </th>
            <th colSpan={6}></th>
          </tr>
          <tr>
            <th colSpan={2}></th>
            <th colSpan={2} className="bg-primary-content text-center">
              P01
            </th>
            <th colSpan={2} className="bg-secondary-content text-center">
              P02
            </th>
            <th colSpan={7}></th>
          </tr>
          <tr>
            <th colSpan={2}></th>
            <th className="text-center bg-info/30">
              R$ {formatNumber(totalM1_P01_Multiplicado)}
            </th>
            <th className="text-center bg-error/30">
              R$ {formatNumber(totalM2_P01_Multiplicado)}
            </th>
            <th className="text-center bg-info/30">
              R$ {formatNumber(totalM1_P02_Multiplicado)}
            </th>
            <th className="text-center bg-error/30">
              R$ {formatNumber(totalM2_P02_Multiplicado)}
            </th>
            <th colSpan={7}></th>
          </tr>
          <tr>
            <th className="hidden">ID</th>
            <th className="text-center bg-info">Sim</th>
            <th className="text-center bg-error">Não</th>
            <th className="text-center bg-info">M1</th>
            <th className="text-center bg-error">M2</th>
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
            const larguraTotal = parseFloat(item.largura) + desperdicioConfig;
            const m1Value = ((parseFloat(item.sim) / 100) * larguraTotal) / 100;
            const m2Value = ((parseFloat(item.nao) / 100) * larguraTotal) / 100;

            return (
              <tr key={item.id} className="border-b border-warning">
                <td className="hidden">{item.id}</td>
                <td className="text-center bg-info/30">
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
                <td className="text-center bg-error/30">
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

                {/* P01 Columns */}
                <td className="text-center bg-info/30">
                  {item.plotter_nome === "P01" ? formatNumber(m1Value) : ""}
                </td>
                <td className="text-center bg-error/30">
                  {item.plotter_nome === "P01" ? formatNumber(m2Value) : ""}
                </td>

                {/* P02 Columns */}
                <td className="text-center bg-info/30">
                  {item.plotter_nome === "P02" ? formatNumber(m1Value) : ""}
                </td>
                <td className="text-center bg-error/30">
                  {item.plotter_nome === "P02" ? formatNumber(m2Value) : ""}
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
                    formatNumber(item.desperdicio / 100)
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
                    formatNumber(larguraTotal / 100)
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
                <td className="text-center bg-success/30">{item.nome}</td>
                <td className={!item.confirmado ? "bg-error" : ""}>
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
                  {!item.confirmado && (
                    <span className="badge badge-soft badge-error badge-circle ml-1">
                      {++unconfirmedCount}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>{" "}
      </table>
    </div>
  );
};

export default Coluna3;
