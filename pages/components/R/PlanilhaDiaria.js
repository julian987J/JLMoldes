import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import Execute from "models/functions";
import Use from "models/utils";
import { useWebSocket } from "../../../contexts/WebSocketContext.js";
import { useAuth } from "../../../contexts/AuthContext.js";

const sortDadosByDate = (dataArray) =>
  [...dataArray].sort((a, b) => new Date(b.data) - new Date(a.data));

const PlanilhaDiaria = ({ r, totalValores }) => {
  const [pagamentosDados, setPagamentosDados] = useState([]);
  const [metragemDados, setMetragemDados] = useState([]);
  const [devoPorDia, setDevoPorDia] = useState({});
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useWebSocket();
  const lastProcessedTimestampRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (typeof r === "undefined" || r === null) return;
    setLoading(true);
    try {
      const [pagamentos, metragem, devo] = await Promise.all([
        Execute.receiveFromPagamentos(r),
        Execute.receiveFromPapelC(r),
        Execute.receiveFromDevo(r),
      ]);

      setPagamentosDados(sortDadosByDate(pagamentos));
      setMetragemDados(
        Array.isArray(metragem)
          ? metragem.sort((a, b) => new Date(b.data) - new Date(a.data))
          : [],
      );

      const groupedDevo = devo.reduce((acc, item) => {
        const dateKey = item.data.substring(0, 10);
        acc[dateKey] = (acc[dateKey] || 0) + Number(item.valor);
        return acc;
      }, {});
      setDevoPorDia(groupedDevo);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
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

      // Pagamentos WebSocket logic
      if (
        type.startsWith("PAGAMENTOS_") &&
        payload &&
        String(payload.r) === String(r)
      ) {
        setPagamentosDados((prev) => {
          if (type === "PAGAMENTOS_NEW_ITEM") {
            return sortDadosByDate([...prev, payload]);
          }
          if (type === "PAGAMENTOS_DELETED_ITEM") {
            return sortDadosByDate(
              prev.filter((item) => String(item.id) !== String(payload.id)),
            );
          }
          return prev;
        });
      }
      if (type === "PAGAMENTOS_TABLE_CLEARED") {
        setPagamentosDados([]);
      }

      // Metragem (PapelC) WebSocket logic
      if (
        (type === "PAPELC_NEW_ITEM" || type === "PAPELC_UPDATED_ITEM") &&
        payload &&
        String(payload.r) === String(r)
      ) {
        setMetragemDados((prev) => {
          const itemIndex = prev.findIndex(
            (item) => String(item.id) === String(payload.id),
          );
          if (type === "PAPELC_NEW_ITEM" && itemIndex === -1) {
            return sortDadosByDate([...prev, payload]);
          }
          if (type === "PAPELC_UPDATED_ITEM") {
            if (itemIndex !== -1) {
              const newDados = [...prev];
              newDados[itemIndex] = { ...newDados[itemIndex], ...payload };
              return sortDadosByDate(newDados);
            } else {
              return sortDadosByDate([...prev, payload]);
            }
          }
          return prev;
        });
      }
      if (
        type === "PAPELC_DELETED_ITEM" &&
        payload &&
        payload.id !== undefined
      ) {
        setMetragemDados((prev) =>
          sortDadosByDate(
            prev.filter((item) => String(item.id) !== String(payload.id)),
          ),
        );
      }

      // Devo WebSocket logic
      if (type.startsWith("DEVO_")) {
        fetchData(); // Refetch all data for simplicity
      }

      lastProcessedTimestampRef.current = lastMessage.timestamp;
    }
  }, [lastMessage, r, fetchData]);

  const handleDeletePagamento = async (itemId) => {
    try {
      await Execute.removePagamentoById(itemId);
    } catch (error) {
      console.error(`Erro ao excluir pagamento ID ${itemId}:`, error);
      alert(`Falha ao excluir pagamento: ${error.message}`);
    }
  };

  const combinedData = useMemo(() => {
    const allDates = new Set([
      ...pagamentosDados.map((p) => p.data.substring(0, 10)),
      ...metragemDados.map((m) => m.data.substring(0, 10)),
    ]);

    const combined = {};

    allDates.forEach((dateKey) => {
      const pagamentosDoDia = pagamentosDados.filter(
        (p) => p.data.substring(0, 10) === dateKey,
      );
      const metragemDoDia = metragemDados.filter(
        (m) => m.data.substring(0, 10) === dateKey,
      );

      combined[dateKey] = {
        pagamentos: pagamentosDoDia,
        metragem: metragemDoDia,
      };
    });

    return combined;
  }, [pagamentosDados, metragemDados]);

  const RightTotalValue = totalValores / 250;

  if (loading) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <div className="col-span-7">
      <div className="flex justify-end mb-2">
        <div className="w-1/4 mr-2">
          {Object.keys(combinedData).length > 0 && (
            <div className="overflow-x-auto rounded-box border border-warning bg-base-100">
              <table className="table table-xs">
                <thead>
                  <tr>
                    <th className="text-center text-xs bg-warning-content/30">
                      {totalValores.toFixed(2)}
                    </th>
                    <th className="text-center text-xs bg-warning-content/30">
                      {RightTotalValue.toFixed(2)}
                    </th>
                  </tr>
                </thead>
              </table>
            </div>
          )}
        </div>
      </div>
      {Object.keys(combinedData)
        .sort((a, b) => new Date(b) - new Date(a))
        .map((dateKey) => {
          const { pagamentos, metragem } = combinedData[dateKey];

          // Calculations for Pagamentos
          const totalRealDoDia = pagamentos.reduce(
            (sum, item) => sum + Number(item.real),
            0,
          );
          const totalPixDoDia = pagamentos.reduce(
            (sum, item) => sum + Number(item.pix),
            0,
          );
          const totalDevoDoDia = devoPorDia[dateKey] || 0;
          const totalGeralDoDia = totalRealDoDia + totalDevoDoDia;

          // Calculations for Metragem
          const countUtilGreaterThanZero = metragem.filter(
            (item) => (parseFloat(item.util) || 0) > 0,
          ).length;
          const countPerdidaGreaterThanZero = metragem.filter(
            (item) => (parseFloat(item.perdida) || 0) > 0,
          ).length;

          return (
            <div
              key={dateKey}
              className="mb-4 p-2 border rounded-box bg-base-200"
            >
              <div className="text-center font-bold text-lg mb-2">
                {Use.formatarData(dateKey)}
              </div>
              <div className="flex space-x-4">
                {/* Pagamentos Column */}
                <div className="flex-1">
                  {pagamentos.length > 0 && (
                    <div className="overflow-x-auto rounded-box border border-info bg-base-100">
                      <table className="table table-xs w-full">
                        <thead>
                          <tr>
                            <th className="w-24">Hora</th>
                            <th>Nome</th>
                            <th className="w-28 text-right">R</th>
                            <th className="w-28 text-right">P</th>
                            {user && user.role === "admin" && (
                              <th className="w-20 text-center">Ações</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {pagamentos.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-info/30"
                            >
                              <td>{Use.formatarHora(item.data)}</td>
                              <td>{item.nome}</td>
                              <td className="text-right">
                                {Number(item.real).toFixed(2)}
                              </td>
                              <td className="text-right">
                                {Number(item.pix).toFixed(2)}
                              </td>
                              {user && user.role === "admin" && (
                                <td className="text-center">
                                  <button
                                    className="btn btn-xs btn-error btn-outline"
                                    onClick={() =>
                                      handleDeletePagamento(item.id)
                                    }
                                  >
                                    Excluir
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td
                              colSpan="1"
                              className="font-bold text-right"
                            ></td>
                            <td className="font-bold text-left bg-error/30 w-28">
                              {totalGeralDoDia.toFixed(2)}
                            </td>
                            <td className="font-bold text-right bg-info/10">
                              {totalRealDoDia.toFixed(2)}
                            </td>
                            {user && user.role === "admin" && (
                              <td className="font-bold text-right bg-info/10">
                                {totalPixDoDia.toFixed(2)}
                              </td>
                            )}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                {/* Metragem Column */}
                <div className="flex-1">
                  {metragem.length > 0 && (
                    <div className="overflow-x-auto rounded-box border border-warning bg-base-100">
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
                          {metragem.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-warning"
                            >
                              <td className="text-center">{item.util}</td>
                              <td className="text-center">{item.perdida}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default PlanilhaDiaria;
