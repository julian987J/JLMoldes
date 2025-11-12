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

const PlanilhaDiaria = ({
  r,
  totalValores,
  plotterTotals,
  onCountUtilChange,
}) => {
  const [pagamentosDados, setPagamentosDados] = useState([]);
  const [metragemDados, setMetragemDados] = useState([]);
  const [cDados, setCDados] = useState([]);
  const [devoPorDia, setDevoPorDia] = useState({});
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useWebSocket();
  const lastProcessedTimestampRef = useRef(null);
  const fetchIdRef = useRef(0); // Adicionado para gerenciar IDs de busca e evitar condições de corrida

  const fetchData = useCallback(async () => {
    if (typeof r === "undefined" || r === null) return;

    // 1. Incrementa o ID da busca e armazena o ID da busca *atual*
    const currentFetchId = ++fetchIdRef.current;
    setLoading(true);

    try {
      const [pagamentos, metragemRaw, devo, cDataRaw] = await Promise.all([
        Execute.receiveFromPagamentos(r),
        Execute.receiveFromPapelC(r),
        Execute.receiveFromDevo(r),
        Execute.receiveFromC(r),
      ]);

      // 2. VERIFICAÇÃO DE CORRIDA:
      // Se o ID da busca atual não for o mais recente (ou seja, outra
      // busca foi iniciada), ignore o resultado desta busca.
      if (currentFetchId !== fetchIdRef.current) {
        return; // Aborta a atualização do estado
      }

      // ... (O restante da sua lógica de filtragem permanece o mesmo) ...
      const archiveDate = new Date("2001-01-01");

      const metragem = metragemRaw.filter(
        (item) => !item.dtfim || new Date(item.dtfim) > archiveDate,
      );
      const cData = cDataRaw.filter(
        (item) => !item.dtfim || new Date(item.dtfim) > archiveDate,
      );

      // Simplesmente substitui os dados com o que veio do banco
      // A atualização otimista via WebSocket será feita pelos handlers específicos
      setPagamentosDados(sortDadosByDate(pagamentos));

      setMetragemDados(sortDadosByDate(metragem));
      setCDados(sortDadosByDate(cData));

      const groupedDevo = devo.reduce((acc, item) => {
        const dateKey = item.data.substring(0, 10);
        acc[dateKey] = (acc[dateKey] || 0) + Number(item.valor);
        return acc;
      }, {});
      setDevoPorDia(groupedDevo);
      // Fim da lógica de filtragem
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      // 3. Só pare de carregar se esta for a busca mais recente
      if (currentFetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [r]); // As dependências [r] estão corretas

  useEffect(() => {
    // Garante que a busca de dados só aconteça quando o parâmetro 'r' estiver disponível.
    // Isso evita chamadas desnecessárias na renderização inicial se 'r' ainda não estiver pronto.
    if (r) {
      fetchData();
    }
  }, [r, fetchData]); // Depender explicitamente de 'r' torna a intenção mais clara.

  useEffect(() => {
    if (lastMessage && lastMessage.data && lastMessage.timestamp) {
      // Ignora mensagens antigas ou já processadas para evitar atualizações desnecessárias ou incorretas
      if (
        lastProcessedTimestampRef.current &&
        lastMessage.timestamp <= lastProcessedTimestampRef.current
      ) {
        return;
      }

      const { type, payload } = lastMessage.data;

      // Atualiza o timestamp ANTES de processar para evitar duplicatas
      lastProcessedTimestampRef.current = lastMessage.timestamp;

      // Atualização otimista via WebSocket para evitar race condition com o banco
      if (
        type === "PAGAMENTOS_NEW_ITEM" &&
        payload &&
        String(payload.r) === String(r)
      ) {
        setPagamentosDados((prev) => {
          const exists = prev.some(
            (item) => String(item.id) === String(payload.id),
          );
          if (!exists) {
            return sortDadosByDate([...prev, payload]);
          }
          return prev;
        });
      } else if (
        type === "PAGAMENTOS_UPDATED_ITEM" &&
        payload &&
        String(payload.r) === String(r)
      ) {
        setPagamentosDados((prev) => {
          const index = prev.findIndex(
            (item) => String(item.id) === String(payload.id),
          );
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = payload;
            return sortDadosByDate(updated);
          }
          return sortDadosByDate([...prev, payload]);
        });
      } else if (type === "PAGAMENTOS_DELETED_ITEM" && payload) {
        setPagamentosDados((prev) =>
          prev.filter((item) => String(item.id) !== String(payload.id)),
        );
      } else if (
        type === "PAGAMENTOS_DATE_RANGE_CLEARED" &&
        payload &&
        String(payload.r) === String(r)
      ) {
        fetchData();
      } else if (
        type === "PAGAMENTOS_R_CLEARED" &&
        payload &&
        String(payload.r) === String(r)
      ) {
        setPagamentosDados([]);
      } else if (type === "PAGAMENTOS_TABLE_CLEARED") {
        setPagamentosDados([]);
      } else if (
        (type === "PAPELC_NEW_ITEM" || type === "PAPELC_UPDATED_ITEM") &&
        payload &&
        String(payload.r) === String(r)
      ) {
        const archiveDate = new Date("2001-01-01");
        const shouldShow =
          !payload.dtfim || new Date(payload.dtfim) > archiveDate;

        setMetragemDados((prev) => {
          const index = prev.findIndex(
            (item) => String(item.id) === String(payload.id),
          );
          if (shouldShow) {
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = payload;
              return sortDadosByDate(updated);
            }
            return sortDadosByDate([...prev, payload]);
          } else {
            // Remove se foi arquivado
            return prev.filter(
              (item) => String(item.id) !== String(payload.id),
            );
          }
        });
      } else if (type === "PAPELC_FINALIZED_ITEM" && payload) {
        setMetragemDados((prev) =>
          prev.filter((item) => String(item.id) !== String(payload.id)),
        );
      } else if (type === "PAPELC_DELETED_ITEM" && payload) {
        setMetragemDados((prev) =>
          prev.filter((item) => String(item.id) !== String(payload.id)),
        );
      } else if (
        (type === "C_NEW_ITEM" || type === "C_UPDATED_ITEM") &&
        payload &&
        String(payload.r) === String(r)
      ) {
        const archiveDate = new Date("2001-01-01");
        const shouldShow =
          !payload.dtfim || new Date(payload.dtfim) > archiveDate;

        setCDados((prev) => {
          const index = prev.findIndex(
            (item) => String(item.id) === String(payload.id),
          );
          if (shouldShow) {
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = payload;
              return sortDadosByDate(updated);
            }
            return sortDadosByDate([...prev, payload]);
          } else {
            // Remove se foi arquivado
            return prev.filter(
              (item) => String(item.id) !== String(payload.id),
            );
          }
        });
      } else if (type === "C_FINALIZED_ITEM" && payload) {
        setCDados((prev) =>
          prev.filter((item) => String(item.id) !== String(payload.id)),
        );
      } else if (type === "C_DELETED_ITEM" && payload) {
        setCDados((prev) =>
          prev.filter((item) => String(item.id) !== String(payload.id)),
        );
      } else if (
        type === "DEVO_NEW_ITEM" &&
        payload &&
        String(payload.r) === String(r)
      ) {
        fetchData();
      } else if (
        type === "DEVO_UPDATED_ITEM" &&
        payload &&
        String(payload.r) === String(r)
      ) {
        fetchData();
      } else if (type === "DEVO_DELETED_ITEM" && payload) {
        fetchData();
      } else if (type.startsWith("PLOTTER_C_")) {
        fetchData();
      }
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
      ...cDados.map((c) => c.data.substring(0, 10)),
    ]);

    const combined = {};

    allDates.forEach((dateKey) => {
      const pagamentosDoDia = pagamentosDados.filter(
        (p) => p.data.substring(0, 10) === dateKey,
      );
      const metragemDoDia = metragemDados.filter(
        (m) => m.data.substring(0, 10) === dateKey,
      );
      const cDoDia = cDados.filter((c) => c.data.substring(0, 10) === dateKey);

      combined[dateKey] = {
        pagamentos: pagamentosDoDia,
        metragem: metragemDoDia,
        cData: cDoDia,
      };
    });

    return combined;
  }, [pagamentosDados, metragemDados, cDados]);

  const totalCountUtilGreaterThanZero = useMemo(() => {
    return metragemDados.filter((item) => (parseFloat(item.util) || 0) > 0)
      .length;
  }, [metragemDados]);

  useEffect(() => {
    if (onCountUtilChange) {
      onCountUtilChange(totalCountUtilGreaterThanZero);
    }
  }, [totalCountUtilGreaterThanZero, onCountUtilChange]);

  const RightTotalValue = (totalValores + plotterTotals) / 250;

  if (loading) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <div className="col-span-7">
      <div className="flex justify-end mb-2">
        <div className="mr-2">
          {Object.keys(combinedData).length > 0 && (
            <div className="overflow-x-auto rounded-box border border-warning bg-base-100">
              <table className="table table-xs">
                <thead>
                  <tr>
                    <th className="text-center text-xs bg-warning-content/30">
                      {(totalValores + plotterTotals).toFixed(2)}
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

          return (
            <div
              key={dateKey}
              className="mb-4 p-2 border rounded-box bg-base-200"
            >
              <div className="text-center font-bold text-lg mb-2">
                {Use.formatarData(dateKey)}
              </div>
              <div className="flex gap-1">
                {/* Pagamentos Column */}
                <div className="flex-1">
                  {pagamentos.length > 0 && (
                    <div className="overflow-x-auto rounded-box border border-info bg-base-100">
                      <table className="table table-xs w-full">
                        <thead>
                          <tr>
                            <th className="py-0.5 px-1">Hora</th>
                            <th className="py-0.5 px-1">Nome</th>
                            <th className="py-0.5 px-1 text-right">R</th>
                            <th className="py-0.5 px-1 text-right">P</th>
                            {user && user.role === "admin" && (
                              <th className="py-0.5 px-1 text-center">Ações</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {pagamentos.map((item) => (
                            <tr
                              key={`pagamento-${item.id}-${new Date(
                                item.data,
                              ).getTime()}`}
                              className="border-b border-info/30"
                            >
                              <td className="py-0.5 px-1">
                                {Use.formatarHora(item.data)}
                              </td>
                              <td className="py-0.5 px-1">{item.nome}</td>
                              <td className="py-0.5 px-1 text-right">
                                {Number(item.real).toFixed(2)}
                              </td>
                              <td className="py-0.5 px-1 text-right">
                                {Number(item.pix).toFixed(2)}
                              </td>
                              {user && user.role === "admin" && (
                                <td className="py-0.5 px-1 text-center">
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
                              className="py-0.5 px-1 font-bold text-right"
                            ></td>
                            <td className="py-0.5 px-1 font-bold text-left bg-error/30">
                              {totalGeralDoDia.toFixed(2)}
                            </td>
                            <td className="py-0.5 px-1 font-bold text-right bg-info/10">
                              {totalRealDoDia.toFixed(2)}
                            </td>
                            {user && user.role === "admin" && (
                              <td className="py-0.5 px-1 font-bold text-right bg-info/10">
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
                <div>
                  {metragem.length > 0 && (
                    <div className="overflow-x-auto rounded-box border border-warning bg-base-100">
                      <table className="table table-xs">
                        <thead>
                          <tr>
                            <th className="text-center text-xs bg-warning-content/30">
                              {countUtilGreaterThanZero}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {metragem.map((item) => (
                            <tr
                              key={`metragem-${item.id}`}
                              className="border-b border-warning"
                            >
                              <td className="text-center">{item.util}</td>
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
