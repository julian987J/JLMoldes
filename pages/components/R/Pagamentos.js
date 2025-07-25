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

const Pagamentos = ({ r }) => {
  const [dados, setDados] = useState([]);
  const [devoPorDia, setDevoPorDia] = useState({});
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useWebSocket();
  const lastProcessedTimestampRef = useRef(null);

  const loadDevoData = useCallback(async () => {
    if (typeof r === "undefined" || r === null) {
      setDevoPorDia({});
      return;
    }
    try {
      const devoData = await Execute.receiveFromDevo(r);
      const groupedDevo = devoData.reduce((acc, item) => {
        const dateKey = item.data.substring(0, 10);
        acc[dateKey] = (acc[dateKey] || 0) + Number(item.valor);
        return acc;
      }, {});
      setDevoPorDia(groupedDevo);
    } catch (error) {
      console.error("Erro ao carregar dados de 'devo':", error);
      setDevoPorDia({});
    }
  }, [r]);

  const loadData = useCallback(async () => {
    setLoading(true);
    if (typeof r === "undefined" || r === null) {
      setDados([]);
      setLoading(false);
      return;
    }
    try {
      const data = await Execute.receiveFromPagamentos(r);
      setDados(sortDadosByDate(data));
    } catch (error) {
      console.error("Erro ao carregar dados de pagamentos:", error);
      setDados([]);
    } finally {
      setLoading(false);
    }
  }, [r]);

  useEffect(() => {
    loadData();
    loadDevoData();
  }, [loadData, loadDevoData, r]);

  useEffect(() => {
    if (lastMessage && lastMessage.data && lastMessage.timestamp) {
      if (
        lastProcessedTimestampRef.current &&
        lastMessage.timestamp <= lastProcessedTimestampRef.current
      ) {
        return;
      }

      const { type, payload } = lastMessage.data;

      switch (type) {
        case "PAGAMENTOS_NEW_ITEM":
          if (payload && String(payload.r) === String(r)) {
            setDados((prev) => sortDadosByDate([...prev, payload]));
          }
          break;
        case "PAGAMENTOS_DELETED_ITEM":
          if (payload && String(payload.r) === String(r)) {
            setDados((prev) =>
              sortDadosByDate(
                prev.filter((item) => String(item.id) !== String(payload.id)),
              ),
            );
          }
          break;
        case "PAGAMENTOS_TABLE_CLEARED":
          setDados([]);
          break;
        case "DEVO_NEW_ITEM":
        case "DEVO_UPDATED_ITEM":
        case "DEVO_DELETED_ITEM":
          loadDevoData();
          break;
        default:
          break;
      }
      lastProcessedTimestampRef.current = lastMessage.timestamp;
    }
  }, [lastMessage, r, loadDevoData]);

  const handleDelete = async (itemId) => {
    try {
      await Execute.removePagamentoById(itemId);
    } catch (error) {
      console.error(`Erro ao excluir pagamento ID ${itemId}:`, error);
      alert(`Falha ao excluir pagamento: ${error.message}`);
    }
  };

  const groupedPagamentos = useMemo(() => {
    return dados.reduce((acc, item) => {
      const dateKey = item.data.substring(0, 10);
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push({
        ...item,
        horaFormatada: Use.formatarHora(item.data),
      });
      return acc;
    }, {});
  }, [dados]);

  if (loading) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <>
      {Object.entries(groupedPagamentos)
        .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
        .map(([dateKey, itemsDoDia]) => {
          const totalRealDoDia = itemsDoDia.reduce(
            (sum, item) => sum + Number(item.real),
            0,
          );
          const totalPixDoDia = itemsDoDia.reduce(
            (sum, item) => sum + Number(item.pix),
            0,
          );
          const totalDevoDoDia = devoPorDia[dateKey] || 0;
          const totalGeralDoDia = totalRealDoDia + totalDevoDoDia;

          return (
            <div
              key={dateKey}
              className="overflow-x-auto rounded-box border border-info bg-base-100 mb-2"
            >
              <div className="font-bold text-sm bg-info/20 text-center p-1">
                {Use.formatarData(dateKey)}
              </div>
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
                  {itemsDoDia.map((item) => (
                    <tr key={item.id} className="border-b border-info/30">
                      <td>{item.horaFormatada}</td>
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
                            onClick={() => handleDelete(item.id)}
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
                    <td colSpan="1" className="font-bold text-right"></td>
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
          );
        })}
      {Object.keys(groupedPagamentos).length === 0 && !loading && (
        <div className="badge badge-neutral badge-outline badge-sm whitespace-normal h-auto text-black">
          Nenhum Pagamento na Semana
        </div>
      )}
    </>
  );
};

export default Pagamentos;
