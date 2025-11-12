import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import Execute from "models/functions";
import Edit from "../Edit";
import Use from "models/utils";
import { useWebSocket } from "../../../contexts/WebSocketContext.js"; // Ajuste o caminho

const round = (value) => {
  const number = parseFloat(value);
  if (isNaN(number)) {
    return 0;
  }
  return Math.round((number + Number.EPSILON) * 100) / 100;
};

const roundToHalf = (value) => {
  const number = parseFloat(value);
  if (isNaN(number)) {
    return 0;
  }
  return Math.round(number / 0.5) * 0.5;
};

const formatCurrency = (value) => {
  return round(value).toFixed(2);
};

const Coluna = ({ r }) => {
  const [dados, setDados] = useState([]);
  // groupedResults será derivado de 'dados' usando useMemo
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [exists, setExists] = useState([]); // Dados da tabela "Deve"
  const [config, setConfig] = useState({ m: 1 }); // Estado para armazenar configurações
  const { lastMessage } = useWebSocket();
  const lastProcessedTimestampRef = useRef(null);

  const handleSave = async (editedData) => {
    const originalItem = dados.find((i) => i.id === editingId);

    if (!originalItem) {
      console.error("Item original não encontrado para salvar.");
      setEditingId(null);
      return;
    }

    const finalEditedData = {
      ...editedData,
      papelreal: roundToHalf(editedData.papelreal),
      papelpix: roundToHalf(editedData.papelpix),
      encaixereal: roundToHalf(editedData.encaixereal),
      encaixepix: roundToHalf(editedData.encaixepix),
      papel: round(editedData.papel),
      desperdicio: round(editedData.desperdicio),
      util: round(editedData.util),
      perdida: round(editedData.perdida),
      multi: parseFloat(editedData.multi) || 0,
      comissao: parseFloat(editedData.comissao) || 0,
    };

    const dataToSend = {
      ...finalEditedData,
      papelreal_pago:
        (parseFloat(originalItem.papelreal) || 0) - finalEditedData.papelreal,
      papelpix_pago:
        (parseFloat(originalItem.papelpix) || 0) - finalEditedData.papelpix,
      encaixereal_pago:
        (parseFloat(originalItem.encaixereal) || 0) -
        finalEditedData.encaixereal,
      encaixepix_pago:
        (parseFloat(originalItem.encaixepix) || 0) - finalEditedData.encaixepix,
    };

    try {
      const response = await fetch("/api/v1/tables/c/papel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) throw new Error("Erro ao atualizar");
      setEditingId(null);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const fetchData = async () => {
    if (typeof r === "undefined" || r === null) return;
    try {
      const results = await Execute.receiveFromPapelC(r);
      const existsData = await Execute.receiveFromDeve(r);
      const configurationsData = await Execute.receiveFromConfig();

      setDados(
        Array.isArray(results)
          ? results
              .filter((item) => !item.dtfim)
              .sort((a, b) => new Date(b.data) - new Date(a.data))
          : [],
      );
      setExists(Array.isArray(existsData) ? existsData : []);
      if (configurationsData && configurationsData.length > 0) {
        setConfig(configurationsData[0]); // Armazena a primeira configuração encontrada
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };
  const memoizedFetchData = useCallback(fetchData, [r]);

  useEffect(() => {
    memoizedFetchData();
  }, [memoizedFetchData]);

  // Efeito para lidar com mensagens WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.data && lastMessage.timestamp) {
      if (
        lastProcessedTimestampRef.current &&
        lastMessage.timestamp <= lastProcessedTimestampRef.current
      ) {
        return; // Ignora mensagem já processada
      }

      const { type, payload } = lastMessage.data;

      // --- Lida com atualizações via WebSocket ---
      if (
        payload &&
        (type === "PAPELC_NEW_ITEM" ||
          type === "PAPELC_UPDATED_ITEM" ||
          type === "PAPELC_FINALIZED_ITEM") &&
        String(payload.r) === String(r)
      ) {
        setDados((prevDados) => {
          let newDados = [...prevDados];
          const itemIndex = newDados.findIndex(
            (item) => String(item.id) === String(payload.id),
          );

          switch (type) {
            case "PAPELC_NEW_ITEM":
              if (itemIndex === -1 && !payload.dtfim) {
                newDados.push(payload);
              }
              break;
            case "PAPELC_UPDATED_ITEM":
            case "PAPELC_FINALIZED_ITEM":
              if (payload.dtfim) {
                if (itemIndex !== -1) {
                  newDados = newDados.filter(
                    (item) => String(item.id) !== String(payload.id),
                  );
                }
              } else {
                if (itemIndex !== -1) {
                  newDados[itemIndex] = { ...newDados[itemIndex], ...payload };
                } else {
                  newDados.push(payload);
                }
              }
              break;
          }
          if (editingId === payload.id) setEditingId(null);
          return newDados.sort((a, b) => new Date(b.data) - new Date(a.data));
        });
      } else if (type === "PAPELC_DELETED_ITEM" && payload) {
        setDados((prevDados) => {
          const newDados = prevDados.filter(
            (item) => String(item.id) !== String(payload.id),
          );
          if (editingId === payload.id) setEditingId(null);
          return newDados;
        });
      } else if (
        (type === "DEVE_NEW_ITEM" || type === "DEVE_UPDATED_ITEM") &&
        payload &&
        String(payload.r) === String(r)
      ) {
        setExists((prevExists) => {
          if (payload) {
            let newExists = [...prevExists];
            let itemIndex = -1;

            const pId = payload.id;
            const pCodigo = payload.codigo;
            const pDeveId = payload.deveid;

            if (pDeveId !== undefined) {
              itemIndex = newExists.findIndex(
                (item) =>
                  item.deveid !== undefined &&
                  String(item.deveid) === String(pDeveId),
              );
            } else if (pId !== undefined) {
              itemIndex = newExists.findIndex(
                (item) =>
                  item.id !== undefined && String(item.id) === String(pId),
              );
            } else if (pCodigo !== undefined) {
              itemIndex = newExists.findIndex(
                (item) =>
                  item.codigo !== undefined &&
                  String(item.codigo) === String(pCodigo),
              );
            }

            switch (type) {
              case "DEVE_NEW_ITEM":
                if (itemIndex === -1) {
                  newExists.push(payload);
                } else {
                  newExists[itemIndex] = {
                    ...newExists[itemIndex],
                    ...payload,
                  };
                }
                break;
              case "DEVE_UPDATED_ITEM":
                if (parseFloat(payload.valor) <= 0) {
                  newExists = newExists.filter(
                    (item) => String(item.deveid) !== String(payload.deveid),
                  );
                } else if (itemIndex !== -1) {
                  newExists[itemIndex] = {
                    ...newExists[itemIndex],
                    ...payload,
                  };
                } else {
                  newExists.push(payload);
                }
                break;
            }
            return newExists.sort(
              (a, b) => new Date(b.data) - new Date(a.data),
            );
          }
          return prevExists;
        });
      } else if (type === "DEVE_DELETED_ITEM" && payload) {
        setExists((prevExists) => {
          let newExists = [...prevExists];
          const pId = payload.id;
          const pCodigo = payload.codigo;
          const pDeveId = payload.deveid;

          if (pDeveId !== undefined) {
            newExists = newExists.filter(
              (item) =>
                !(
                  item.deveid !== undefined &&
                  String(item.deveid) === String(pDeveId)
                ),
            );
          } else if (pCodigo !== undefined) {
            newExists = newExists.filter(
              (item) =>
                !(
                  item.codigo !== undefined &&
                  String(item.codigo) === String(pCodigo)
                ),
            );
          } else if (pId !== undefined) {
            newExists = newExists.filter(
              (item) =>
                !(item.id !== undefined && String(item.id) === String(pId)),
            );
          }

          return newExists.sort((a, b) => new Date(b.data) - new Date(a.data));
        });
      }

      lastProcessedTimestampRef.current = lastMessage.timestamp;
    }
  }, [lastMessage, r, editingId, setDados, setExists]);

  const groupedResults = useMemo(() => {
    return dados.reduce((acc, item) => {
      const dateKey = item.data.substring(0, 10); // YYYY-MM-DD

      acc[dateKey] = acc[dateKey] || [];
      acc[dateKey].push({
        ...item,
        papelreal: parseFloat(item.papelreal) || 0,
        papelpix: parseFloat(item.papelpix) || 0,
        encaixereal: parseFloat(item.encaixereal) || 0,
        encaixepix: parseFloat(item.encaixepix) || 0,
        desperdicio: parseFloat(item.desperdicio) || 0,
        util: parseFloat(item.util) || 0,
        perdida: parseFloat(item.perdida) || 0,
      });
      return acc;
    }, {});
  }, [dados]);

  if (loading) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    // Garante que os valores em editedData sejam strings para os inputs controlados
    setEditedData({
      ...item,
      nome: String(item.nome !== undefined ? item.nome : ""),
      multi: String(item.multi !== undefined ? item.multi : "0"),
      comissao: String(item.comissao !== undefined ? item.comissao : "0"),
      papel: formatCurrency(item.papel !== undefined ? item.papel : "1"),
      papelreal: formatCurrency(
        item.papelreal !== undefined ? item.papelreal : 0,
      ),
      papelpix: formatCurrency(item.papelpix !== undefined ? item.papelpix : 0),
      encaixereal: formatCurrency(
        item.encaixereal !== undefined ? item.encaixereal : 0,
      ),
      encaixepix: formatCurrency(
        item.encaixepix !== undefined ? item.encaixepix : 0,
      ),
      desperdicio: formatCurrency(
        item.desperdicio !== undefined ? item.desperdicio : 0,
      ),
      util: formatCurrency(item.util !== undefined ? item.util : "1"),
      perdida: formatCurrency(item.perdida !== undefined ? item.perdida : "0"),
      comentarios: String(
        item.comentarios !== undefined ? item.comentarios : "",
      ),
    });
  };

  return (
    <div className=" overflow-x-auto rounded-box border border-success bg-base-100">
      {Object.entries(groupedResults)
        .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
        .map(([date, items]) => {
          // Cálculo dos totais para cada coluna
          const totalPapelReal = items.reduce(
            (sum, item) => sum + (parseFloat(item.papelreal) || 0),
            0,
          );
          const totalPapel = items.reduce(
            (sum, item) => sum + (parseFloat(item.papel) || 0),
            0,
          );
          const totalPapelPix = items.reduce(
            (sum, item) => sum + (parseFloat(item.papelpix) || 0),
            0,
          );
          const totalEncaixeReal = items.reduce(
            (sum, item) => sum + (parseFloat(item.encaixereal) || 0),
            0,
          );
          const totalEncaixePix = items.reduce(
            (sum, item) => sum + (parseFloat(item.encaixepix) || 0),
            0,
          );
          const totalDesperdicio = items.reduce(
            (sum, item) => sum + (parseFloat(item.desperdicio) || 0),
            0,
          );
          const totalUtil = items.reduce(
            (sum, item) => sum + (parseFloat(item.util) || 0),
            0,
          );
          const totalPerdida = items.reduce(
            (sum, item) => sum + (parseFloat(item.perdida) || 0),
            0,
          );

          const totalRP = totalPapelReal + totalPapelPix;
          const totalEnc = totalEncaixeReal + totalEncaixePix;

          const totaldeReais = totalPapelReal + totalEncaixeReal;
          const totalDePixes = totalPapelPix + totalEncaixePix;

          return (
            <div key={date} className="mb-2">
              {/* Cabeçalho da data */}
              <div className="font-bold text-sm bg-success/20 text-center p-1">
                {Use.formatarData(date)}
              </div>

              {/* Tabela para os itens da data */}
              <table className="table table-xs">
                <thead>
                  <tr>
                    <th colSpan={3}></th>
                    <th className="text-center text-xs bg-warning/30">
                      {formatCurrency(totalPapel / (config.m || 1))}
                    </th>
                    <th className="text-center text-xs bg-warning/30">
                      {formatCurrency(
                        (totalDesperdicio + totalPerdida) * (config.m || 1),
                      )}
                    </th>
                    <th
                      colSpan={2}
                      className="text-center text-xs bg-accent/30"
                    >
                      {formatCurrency(totalRP)}
                    </th>
                    <th
                      colSpan={2}
                      className="text-center text-xs bg-success/30"
                    >
                      {formatCurrency(totalEnc)}
                    </th>
                    <th colSpan={4}></th>
                    <th className="text-center text-xs bg-info/30">
                      {formatCurrency(totaldeReais)}
                    </th>
                  </tr>
                  {/* Linha com os totais de cada coluna */}
                  <tr>
                    <th colSpan={2}></th>
                    <th className="text-center text-xs bg-warning/30">Met</th>
                    <th className="text-center text-xs bg-warning/30">
                      {formatCurrency(totalPapel)}
                    </th>
                    <th className="text-center text-xs bg-warning/30">
                      {formatCurrency(totalDesperdicio + totalPerdida)}
                    </th>
                    <th className="text-center text-xs bg-accent/30">
                      {formatCurrency(totalPapelReal)}
                    </th>
                    <th className="text-center text-xs bg-accent/30">
                      {formatCurrency(totalPapelPix)}
                    </th>
                    <th className="text-center text-xs bg-success/30">
                      {formatCurrency(totalEncaixeReal)}
                    </th>
                    <th className="text-center text-xs bg-success/30">
                      {formatCurrency(totalEncaixePix)}
                    </th>
                    <th className="text-center text-xs bg-warning-content/30">
                      {formatCurrency(totalDesperdicio)}
                    </th>
                    <th className="text-center text-xs bg-warning-content/30">
                      {formatCurrency(totalUtil)}
                    </th>
                    <th className="text-center text-xs bg-warning-content/30">
                      {formatCurrency(totalPerdida)}
                    </th>
                    {/* Últimas 2 colunas vazias (Comentários e Ações) */}
                    <th colSpan={1}></th>

                    <th className="text-center text-xs bg-info/30">
                      {formatCurrency(totalDePixes)}
                    </th>
                  </tr>

                  {/* Linha com os nomes das colunas */}
                  <tr>
                    <th className="hidden">ID</th>
                    <th className="hidden">Codigo</th>
                    <th>Hora</th>
                    <th>Nome</th>
                    <th>M</th>
                    <th>C</th>
                    <th>Papel</th>
                    <th className="bg-accent">R$</th>
                    <th className="bg-accent">PIX</th>
                    <th className="bg-success">E R$</th>
                    <th className="bg-success">E PIX</th>
                    <th className="bg-warning-content/50">Des</th>
                    <th className="bg-warning-content/50">Util</th>
                    <th className="bg-warning-content/50">Perda</th>
                    {/* <th>Com</th> */}
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b border-success ${
                        exists.some((e) => e.deveid === item.deveid)
                          ? "bg-error/70"
                          : ""
                      }`}
                    >
                      <td className="hidden">{item.id}</td>
                      <td className="hidden">{item.codigo}</td>
                      <td>{Use.formatarDataHoraSegundo(item.data)}</td>
                      <td>
                        {editingId === item.id ? (
                          <input
                            type="text"
                            value={editedData.nome}
                            onChange={(e) =>
                              handleInputChange("nome", e.target.value)
                            }
                            className="input input-xs p-0 m-0 text-center"
                          />
                        ) : (
                          item.nome
                        )}
                      </td>
                      <td>
                        {editingId === item.id ? (
                          <input
                            type="number"
                            value={editedData.multi}
                            onChange={(e) =>
                              handleInputChange("multi", e.target.value)
                            }
                            className="input input-xs p-0 m-0 text-center"
                          />
                        ) : (
                          item.multi
                        )}
                      </td>
                      <td>
                        {editingId === item.id ? (
                          <input
                            type="number"
                            value={editedData.comissao}
                            onChange={(e) =>
                              handleInputChange("comissao", e.target.value)
                            }
                            className="input input-xs p-0 m-0 text-center"
                          />
                        ) : (
                          item.comissao
                        )}
                      </td>
                      <td>
                        {editingId === item.id ? (
                          <input
                            type="number"
                            min="1"
                            value={editedData.papel}
                            onChange={(e) => {
                              if (
                                isNaN(e.target.value) ||
                                e.target.value <= 0
                              ) {
                                handleInputChange("papel", 1);
                              } else {
                                handleInputChange("papel", e.target.value);
                              }
                            }}
                            className="input input-xs p-0 m-0 text-center"
                          />
                        ) : (
                          formatCurrency(item.papel)
                        )}
                      </td>
                      <td>
                        {editingId === item.id ? (
                          <input
                            type="number"
                            min="1"
                            value={editedData.papelreal} // Usar string diretamente
                            onChange={(e) =>
                              handleInputChange("papelreal", e.target.value)
                            }
                            className="input input-xs p-0 m-0 text-center"
                          />
                        ) : (
                          formatCurrency(item.papelreal)
                        )}
                      </td>
                      <td>
                        {editingId === item.id ? (
                          <input
                            type="number"
                            min="1"
                            value={editedData.papelpix} // Usar string diretamente
                            onChange={(e) =>
                              handleInputChange("papelpix", e.target.value)
                            }
                            className="input input-xs p-0 m-0 text-center"
                          />
                        ) : (
                          formatCurrency(item.papelpix)
                        )}
                      </td>
                      <td>
                        {editingId === item.id ? (
                          <input
                            type="number"
                            min="1"
                            value={editedData.encaixereal} // Usar string diretamente
                            onChange={(e) =>
                              handleInputChange("encaixereal", e.target.value)
                            }
                            className="input input-xs p-0 m-0 text-center"
                          />
                        ) : (
                          formatCurrency(item.encaixereal)
                        )}
                      </td>
                      <td>
                        {editingId === item.id ? (
                          <input
                            type="number"
                            min="1"
                            value={editedData.encaixepix} // Usar string diretamente
                            onChange={(e) =>
                              handleInputChange("encaixepix", e.target.value)
                            }
                            className="input input-xs p-0 m-0 text-center"
                          />
                        ) : (
                          formatCurrency(item.encaixepix)
                        )}
                      </td>
                      <td>
                        {editingId === item.id ? (
                          <input
                            type="number"
                            min="1"
                            value={editedData.desperdicio} // Usar string diretamente
                            onChange={(e) =>
                              handleInputChange("desperdicio", e.target.value)
                            }
                            className="input input-xs p-0 m-0 text-center"
                          />
                        ) : (
                          formatCurrency(item.desperdicio)
                        )}
                      </td>
                      <td>
                        {editingId === item.id ? (
                          <input
                            type="number"
                            min="1"
                            value={editedData.util}
                            onChange={(e) =>
                              handleInputChange("util", e.target.value)
                            }
                            className="input input-xs p-0 m-0 text-center"
                          />
                        ) : (
                          formatCurrency(item.util)
                        )}
                      </td>
                      <td>
                        {editingId === item.id ? (
                          <input
                            type="number"
                            min="1"
                            value={editedData.perdida}
                            onChange={(e) =>
                              handleInputChange("perdida", e.target.value)
                            }
                            className="input input-xs p-0 m-0 text-center"
                          />
                        ) : (
                          formatCurrency(item.perdida)
                        )}
                      </td>
                      {/* <td>
                        {editingId === item.id ? (
                          <input
                            type="text"
                            value={editedData.comentarios}
                            onChange={(e) =>
                              handleInputChange("comentarios", e.target.value)
                            }
                            className="input input-xs p-0 m-0 text-center"
                          />
                        ) : (
                          item.comentarios
                        )}
                      </td> */}
                      <td>
                        <Edit
                          isEditing={editingId === item.id}
                          onEdit={() => startEditing(item)}
                          onSave={() => handleSave(editedData)}
                          onCancel={() => setEditingId(null)}
                        />
                        <button
                          className={`btn btn-xs btn-soft btn-error ${
                            editingId === item.id ? "hidden" : ""
                          }`}
                          onClick={async () => {
                            try {
                              await Execute.removePapelC(item.id);
                              // A UI será atualizada via WebSocket (PAPELC_DELETED_ITEM)
                            } catch (error) {
                              console.error(
                                "Erro ao excluir item PapelC:",
                                error,
                              );
                            }
                          }}
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
        })}
    </div>
  );
};

export default Coluna;
