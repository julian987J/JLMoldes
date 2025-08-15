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

const formatCurrency = (value) => {
  const number = parseFloat(value);
  return isNaN(number) ? "0.00" : number.toFixed(2);
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

    const dataToSend = {
      ...editedData,
      papelreal_pago:
        (parseFloat(originalItem.papelreal) || 0) -
        (parseFloat(editedData.papelreal) || 0),
      papelpix_pago:
        (parseFloat(originalItem.papelpix) || 0) -
        (parseFloat(editedData.papelpix) || 0),
      encaixereal_pago:
        (parseFloat(originalItem.encaixereal) || 0) -
        (parseFloat(editedData.encaixereal) || 0),
      encaixepix_pago:
        (parseFloat(originalItem.encaixepix) || 0) -
        (parseFloat(editedData.encaixepix) || 0),
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
          ? results.sort((a, b) => new Date(b.data) - new Date(a.data))
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
      console.log("WebSocket message received:", type, payload);

      // --- Lida com atualizações na tabela PapelC (dados principais) ---
      if (
        // Condição para PAPELC_NEW_ITEM e PAPELC_UPDATED_ITEM: requer 'r' no payload
        ((type === "PAPELC_NEW_ITEM" || type === "PAPELC_UPDATED_ITEM") &&
          payload &&
          String(payload.r) === String(r)) ||
        // Condição para PAPELC_DELETED_ITEM: requer apenas 'id' no payload
        (type === "PAPELC_DELETED_ITEM" && payload && payload.id !== undefined)
      ) {
        setDados((prevDadosPapelC) => {
          let newDadosPapelC = [...prevDadosPapelC];
          const itemIndex =
            payload.id !== undefined
              ? newDadosPapelC.findIndex(
                  (item) => String(item.id) === String(payload.id),
                )
              : -1;

          switch (type) {
            case "PAPELC_NEW_ITEM":
              console.log("PAPELC_NEW_ITEM: Adding new item", payload);
              if (itemIndex === -1) newDadosPapelC.push(payload);
              break;
            case "PAPELC_UPDATED_ITEM":
              console.log("PAPELC_UPDATED_ITEM: Updating item", payload);
              if (itemIndex !== -1) {
                newDadosPapelC[itemIndex] = {
                  ...newDadosPapelC[itemIndex],
                  ...payload,
                };
              } else {
                console.warn(
                  "PAPELC_UPDATED_ITEM: Item not found for update, adding as new.",
                  payload,
                );
                newDadosPapelC.push(payload);
              }
              if (editingId === payload.id) setEditingId(null);
              break;
            case "PAPELC_DELETED_ITEM":
              console.log("PAPELC_DELETED_ITEM: Deleting item", payload);
              newDadosPapelC = newDadosPapelC.filter(
                (item) => String(item.id) !== String(payload.id),
              );
              if (editingId === payload.id) setEditingId(null);
              break;
          }
          return newDadosPapelC.sort(
            (a, b) => new Date(b.data) - new Date(a.data),
          );
        });
      }

      // --- Lida com atualizações na tabela Deve (dados 'exists') ---
      if (
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
            const pDeveId = payload.deveid; // Use deveid for Deve table

            // Try to find the item by deveid first
            if (pDeveId !== undefined) {
              itemIndex = newExists.findIndex(
                (item) =>
                  item.deveid !== undefined &&
                  String(item.deveid) === String(pDeveId),
              );
            } else if (pId !== undefined) {
              // Fallback to id if deveid is not present (less reliable for Deve)
              itemIndex = newExists.findIndex(
                (item) =>
                  item.id !== undefined && String(item.id) === String(pId),
              );
            } else if (pCodigo !== undefined) {
              // Fallback to codigo if neither id nor deveid is present
              itemIndex = newExists.findIndex(
                (item) =>
                  item.codigo !== undefined &&
                  String(item.codigo) === String(pCodigo),
              );
            }

            switch (type) {
              case "DEVE_NEW_ITEM":
                console.log("DEVE_NEW_ITEM: Adding new item", payload);
                if (itemIndex === -1) {
                  newExists.push(payload); // Adiciona se realmente novo
                } else {
                  // Se já existe (ex: mensagem duplicada ou chegou fora de ordem), atualiza
                  console.warn(
                    "DEVE_NEW_ITEM: Item already exists, updating instead of adding.",
                    payload,
                  );
                  newExists[itemIndex] = {
                    ...newExists[itemIndex],
                    ...payload,
                  };
                }
                break;
              case "DEVE_UPDATED_ITEM":
                console.log("DEVE_UPDATED_ITEM: Updating item", payload);
                if (parseFloat(payload.valor) <= 0) {
                  console.log(
                    "DEVE_UPDATED_ITEM: Removing item from exists (valor <= 0)",
                    payload,
                  );
                  newExists = newExists.filter(
                    (item) => String(item.deveid) !== String(payload.deveid),
                  );
                } else if (itemIndex !== -1) {
                  newExists[itemIndex] = {
                    ...newExists[itemIndex],
                    ...payload,
                  };
                } else {
                  console.warn(
                    "DEVE_UPDATED_ITEM: Item not found in 'exists' state for payload, adding as new:",
                    payload,
                    "Current exists state:",
                    prevExists,
                  );
                  newExists.push(payload);
                }
                break;
            }
            return newExists.sort(
              (a, b) => new Date(b.data) - new Date(a.data),
            ); // Ordena se necessário
          }
          return prevExists; // Retorna o estado anterior se o payload for nulo (segurança)
        });
      } else if (type === "DEVE_DELETED_ITEM" && payload) {
        console.log("DEVE_DELETED_ITEM: Deleting item", payload);
        setExists((prevExists) => {
          let newExists = [...prevExists];
          const pId = payload.id; // Payload de DEVE_DELETED_ITEM pode não ter 'id' vindo do backend atual
          const pCodigo = payload.codigo; // Backend envia 'codigo'
          const pDeveId = payload.deveid; // Use deveid for Deve table

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
          }
          // Adicionado para robustez, caso o payload de deleção comece a enviar 'id' no futuro
          else if (pId !== undefined) {
            newExists = newExists.filter(
              (item) =>
                !(item.id !== undefined && String(item.id) === String(pId)),
            );
          }

          if (
            pCodigo === undefined &&
            pId === undefined &&
            pDeveId === undefined
          ) {
            console.warn(
              "DEVE_DELETED_ITEM: Payload without 'codigo', 'id' or 'deveid' to identify item to be deleted",
              payload,
            );
          }
          return newExists.sort((a, b) => new Date(b.data) - new Date(a.data)); // Ordena se necessário
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
      papel: String(item.papel !== undefined ? item.papel : "1"),
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
      ), // formatCurrency para consistência, embora o input seja number
      util: String(item.util !== undefined ? item.util : "1"),
      perdida: String(item.perdida !== undefined ? item.perdida : "0"),
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
                    <th className="text-center text-xs bg-warning/30">
                      Metragem
                    </th>
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
                    <th>Comentarios</th>
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
                          item.papel
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
                          item.util
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
                          item.perdida
                        )}
                      </td>
                      <td>
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
                      </td>
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
