import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import Execute from "models/functions";
import Use from "models/utils";
import { useWebSocket } from "../../../contexts/WebSocketContext.js"; // Ajuste o caminho

const Metragem = ({ r }) => {
  const [dados, setDados] = useState([]);
  // groupedResults será derivado de 'dados' usando useMemo
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [exists, setExists] = useState([]); // Dados da tabela "Deve"
  const { lastMessage } = useWebSocket();
  const lastProcessedTimestampRef = useRef(null);

  const fetchData = async () => {
    if (typeof r === "undefined" || r === null) return;
    try {
      const results = await Execute.receiveFromPapelC(r);

      setDados(
        Array.isArray(results)
          ? results.sort((a, b) => new Date(a.data) - new Date(b.data))
          : [],
      );
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
              if (itemIndex === -1) newDadosPapelC.push(payload);
              break;
            case "PAPELC_UPDATED_ITEM":
              if (itemIndex !== -1) {
                newDadosPapelC[itemIndex] = {
                  ...newDadosPapelC[itemIndex],
                  ...payload,
                };
              } else {
                newDadosPapelC.push(payload);
              }
              if (editingId === payload.id) setEditingId(null);
              break;
            case "PAPELC_DELETED_ITEM":
              newDadosPapelC = newDadosPapelC.filter(
                (item) => String(item.id) !== String(payload.id),
              );
              if (editingId === payload.id) setEditingId(null);
              break;
          }
          return newDadosPapelC.sort(
            (a, b) => new Date(a.data) - new Date(b.data),
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

            // Tenta encontrar o item pelo ID do payload, se existir
            if (pId !== undefined) {
              itemIndex = newExists.findIndex(
                (item) =>
                  item.id !== undefined && String(item.id) === String(pId),
              );
            }

            // Se não encontrado pelo ID (ou se o payload não tinha ID), tenta pelo código, se existir
            if (itemIndex === -1 && pCodigo !== undefined) {
              itemIndex = newExists.findIndex(
                (item) =>
                  item.codigo !== undefined &&
                  String(item.codigo) === String(pCodigo),
              );
            }

            switch (type) {
              case "DEVE_NEW_ITEM":
                if (itemIndex === -1) {
                  newExists.push(payload); // Adiciona se realmente novo
                } else {
                  // Se já existe (ex: mensagem duplicada ou chegou fora de ordem), atualiza
                  newExists[itemIndex] = {
                    ...newExists[itemIndex],
                    ...payload,
                  };
                }
                break;
              case "DEVE_UPDATED_ITEM":
                if (itemIndex !== -1) {
                  newExists[itemIndex] = {
                    ...newExists[itemIndex],
                    ...payload,
                  };
                } else {
                  // Item não encontrado para atualização. Isso pode ser a causa do problema.
                  console.warn(
                    "DEVE_UPDATED_ITEM: Item não encontrado no estado 'exists' para o payload:",
                    payload,
                    "Estado 'exists' atual:",
                    prevExists,
                  );
                }
                break;
              // DEVE_DELETED_ITEM é tratado em um bloco 'else if' separado
            }
            return newExists.sort(
              (a, b) => new Date(a.data) - new Date(b.data),
            ); // Ordena se necessário
          }
          return prevExists; // Retorna o estado anterior se o payload for nulo (segurança)
        });
      } else if (type === "DEVE_DELETED_ITEM" && payload) {
        setExists((prevExists) => {
          let newExists = [...prevExists];
          const pId = payload.id;
          const pCodigo = payload.codigo;

          if (pCodigo !== undefined) {
            newExists = newExists.filter(
              (item) =>
                !(
                  item.codigo !== undefined &&
                  String(item.codigo) === String(pCodigo)
                ),
            );
          }
          // Adicionado para robustez, caso o payload de deleção comece a enviar 'id' no futuro
          if (pId !== undefined) {
            newExists = newExists.filter(
              (item) =>
                !(item.id !== undefined && String(item.id) === String(pId)),
            );
          }

          if (pCodigo === undefined && pId === undefined) {
            console.warn(
              "DEVE_DELETED_ITEM: Payload sem 'codigo' ou 'id' para identificar o item a ser deletado",
              payload,
            );
          }
          return newExists.sort((a, b) => new Date(a.data) - new Date(b.data)); // Ordena se necessário
        });
      }

      lastProcessedTimestampRef.current = lastMessage.timestamp;
    }
  }, [lastMessage, r, editingId, setDados, setExists]);

  const groupedResults = useMemo(() => {
    return dados.reduce((acc, item) => {
      const rawDate = Use.formatarData(item.data);

      acc[rawDate] = acc[rawDate] || [];
      acc[rawDate].push({
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

  // Calculate grand totals for 'util' and 'perdida' across all items
  const { grandTotalUtil, grandTotalPerdida } = useMemo(() => {
    let utilSum = 0;
    let perdidaSum = 0;
    dados.forEach((item) => {
      utilSum += parseFloat(item.util) || 0;
      perdidaSum += parseFloat(item.perdida) || 0;
    });
    return { grandTotalUtil: utilSum, grandTotalPerdida: perdidaSum };
  }, [dados]);

  // Assuming formatCurrency is available in the scope, similar to previous usage
  if (loading) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <div className="overflow-x-auto rounded-box border border-warning bg-base-100">
      {/* Display Grand Totals at the top - MOVED HERE */}
      {Object.keys(groupedResults).length > 0 && ( // Conditionally render if there's data
        <div className="text-center text-neutral/70 font-semibold bg-info/40 border-b border-warning">
          {grandTotalUtil + grandTotalPerdida}
        </div>
      )}
      {Object.entries(groupedResults).map(([date, items]) => {
        // Cálculo da contagem de itens com valor > 0 para cada coluna
        const countUtilGreaterThanZero = items.filter(
          (item) => item.util > 0,
        ).length;
        const countPerdidaGreaterThanZero = items.filter(
          (item) => item.perdida > 0, // This was missing .length
        ).length;

        return (
          <div key={date} className="mb-2">
            <table className="table table-xs">
              <thead>
                <tr>
                  <th className="text-center text-xs bg-warning-content/30">
                    {countUtilGreaterThanZero}
                  </th>
                  <th className="text-center text-xs bg-warning-content/30">
                    {countPerdidaGreaterThanZero}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-warning ${
                      exists.some((e) => e.deveid === item.deveid)
                        ? "bg-error/70"
                        : ""
                    }`}
                  >
                    <td className="hidden">{item.id}</td>
                    <td className="text-center">{item.util}</td>
                    <td className="text-center">{item.perdida}</td>
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

export default Metragem;
