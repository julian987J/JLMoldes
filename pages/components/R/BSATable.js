/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useCallback, useRef } from "react";
import Execute from "models/functions";
import Use from "models/utils";
import { useWebSocket } from "../../../contexts/WebSocketContext.js"; // Ajuste o caminho se necessário
import { useAuth } from "../../../contexts/AuthContext.js";

const sortDadosByDate = (dataArray) =>
  [...dataArray].sort((a, b) => new Date(b.data) - new Date(a.data));

const BSA = ({ codigo, r, onTotalsChange }) => {
  const [dados, setDados] = useState([]);
  const { lastMessage } = useWebSocket();
  const { user } = useAuth();
  const lastProcessedTimestampRef = useRef(null);

  const loadData = useCallback(async () => {
    if (typeof r === "undefined" || r === null) {
      setDados([]); // Limpa os dados se 'r' não for válido
      return;
    }
    const dataArray = await Execute.receiveFromR(r); // Segundo o log, isso já é o array de dados: [{...}]
    if (Array.isArray(dataArray)) {
      setDados(sortDadosByDate(dataArray));
    } else {
      // Log para depuração caso 'receiveFromR' não retorne um array
      console.warn(
        "BSATable: 'receiveFromR' não retornou um array como esperado. Recebido:",
        dataArray,
      );
      setDados([]); // Garante que 'dados' seja sempre um array para evitar erros de renderização
    }
  }, [r]);

  useEffect(() => {
    loadData(); // Busca inicial e quando 'r' (via loadData) ou 'codigo' muda
  }, [loadData, codigo, r]);

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

      switch (type) {
        case "BSA_NEW_ITEM":
          if (payload && parseInt(payload.r, 10) === r) {
            setDados((prevDados) => {
              if (!prevDados.find((item) => item.id === payload.id)) {
                return sortDadosByDate([...prevDados, payload]);
              }
              return prevDados; // Item já existe (improvável, mas seguro)
            });
          }
          break;
        case "BSA_UPDATED_ITEM":
          if (payload && parseInt(payload.r, 10) === r) {
            setDados((prevDados) =>
              sortDadosByDate(
                prevDados.map((item) =>
                  item.id === payload.id ? { ...item, ...payload } : item,
                ),
              ),
            );
          }
          break;
        case "BSA_DELETED_ITEM":
          if (
            payload &&
            payload.id !== undefined &&
            String(payload.r) === String(r)
          ) {
            setDados((prevDados) =>
              sortDadosByDate(
                prevDados.filter(
                  (item) => String(item.id) !== String(payload.id),
                ),
              ),
            );
          }
          break;
        default:
          break;
      }
      lastProcessedTimestampRef.current = lastMessage.timestamp;
    }
  }, [lastMessage, r, setDados]);

  const handleDelete = async (id) => {
    try {
      await Execute.removeMandR(id);
    } catch (error) {
      console.error("Erro ao excluir registro BSA:", error);
      alert("Falha ao excluir registro.");
    }
  };

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const recentDados = dados.filter(
    (item) => new Date(item.data) >= oneMonthAgo,
  );
  const betweenOneAndTwoMonthsDados = dados.filter(
    (item) =>
      new Date(item.data) < oneMonthAgo && new Date(item.data) >= twoMonthsAgo,
  );
  const oldDados = dados.filter((item) => new Date(item.data) < twoMonthsAgo);

  const totalsBetweenOneAndTwoMonths = betweenOneAndTwoMonthsDados.reduce(
    (acc, item) => {
      acc.base += Number(item.base) || 0;
      acc.sis += Number(item.sis) || 0;
      acc.alt += Number(item.alt) || 0;
      return acc;
    },
    { base: 0, sis: 0, alt: 0 },
  );

  const totalsOld = oldDados.reduce(
    (acc, item) => {
      acc.base += Number(item.base) || 0;
      acc.sis += Number(item.sis) || 0;
      acc.alt += Number(item.alt) || 0;
      return acc;
    },
    { base: 0, sis: 0, alt: 0 },
  );

  useEffect(() => {
    if (onTotalsChange) {
      onTotalsChange({
        total1M:
          totalsBetweenOneAndTwoMonths.base +
          totalsBetweenOneAndTwoMonths.sis +
          totalsBetweenOneAndTwoMonths.alt,
        total2M: totalsOld.base + totalsOld.sis + totalsOld.alt,
      });
    }
  }, [totalsBetweenOneAndTwoMonths, totalsOld, onTotalsChange]);

  return (
    <div className="overflow-x-auto rounded-box border border-warning bg-base-100">
      <table className="table table-xs">
        <thead>
          <tr>
            <th className="hidden">ID</th>
            <th className="w-36">Data</th>
            <th className="hidden">CODIGO</th>
            <th className="text-center">Dec</th>
            <th>Nome</th>
            <th className="w-10 text-center">Base</th>
            <th className="w-10 text-center">Sis</th>
            <th className="w-10 text-center">Alt</th>
          </tr>
        </thead>
        <tbody>
          {recentDados.map((item) => (
            <tr
              key={item.id}
              className={
                item.codigo === codigo
                  ? "bg-green-200"
                  : "border-b border-warning"
              }
            >
              <td className="hidden">{item.id}</td>
              <td>{Use.formatarData(item.data)}</td>
              <td className="hidden">{item.codigo}</td>
              <td className="text-center">{item.dec}</td>
              <td>{item.nome}</td>
              <td className="text-center">{Number(item.base).toFixed(2)}</td>
              <td className="text-center">{Number(item.sis).toFixed(2)}</td>
              <td className="text-center">{Number(item.alt).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {betweenOneAndTwoMonthsDados.length > 0 && (
        <div className="mt-4">
          <h3 className="text-center font-bold text-lg mb-2">
            Registros com mais de 1 mês
          </h3>
          <table className="table table-xs">
            <thead>
              <tr>
                <th className="hidden bg-secondary-content">ID</th>
                <th className="w-36 bg-secondary-content">Data</th>
                <th className="hidden bg-secondary-content">CODIGO</th>
                <th className="text-center bg-secondary-content">Dec</th>
                <th className="bg-secondary-content">Nome</th>
                <th className="w-10 text-center bg-secondary-content">Base</th>
                <th className="w-10 text-center bg-secondary-content">Sis</th>
                <th className="w-10 text-center bg-secondary-content">Alt</th>
              </tr>
            </thead>
            <tbody>
              {betweenOneAndTwoMonthsDados.map((item) => (
                <tr
                  key={item.id}
                  className={
                    item.codigo === codigo
                      ? "bg-green-200"
                      : "bg-secondary-content"
                  }
                >
                  <td className="hidden">{item.id}</td>
                  <td>{Use.formatarData(item.data)}</td>
                  <td className="hidden">{item.codigo}</td>
                  <td className="text-center">{item.dec}</td>
                  <td>{item.nome}</td>
                  <td className="text-center">
                    {Number(item.base).toFixed(2)}
                  </td>
                  <td className="text-center">{Number(item.sis).toFixed(2)}</td>
                  <td className="text-center">{Number(item.alt).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-info/30">
                <td colSpan="2"></td>
                <td className="text-right">Total:</td>
                <td colSpan="3" className="text-center">
                  {(
                    totalsBetweenOneAndTwoMonths.base +
                    totalsBetweenOneAndTwoMonths.sis +
                    totalsBetweenOneAndTwoMonths.alt
                  ).toFixed(2)}
                </td>
              </tr>
            </tfoot>{" "}
          </table>
        </div>
      )}{" "}
      {oldDados.length > 0 && (
        <div className="mt-4">
          <h3 className="text-center font-bold text-lg mb-2">
            Registros com mais de 2 meses
          </h3>
          <table className="table table-xs">
            <thead>
              <tr>
                <th className="hidden bg-error/30">ID</th>
                <th className="w-36 bg-error/30">Data</th>
                <th className="hidden bg-error/30">CODIGO</th>
                <th className="text-center bg-error/30">Dec</th>
                <th className="bg-error/30">Nome</th>
                <th className="w-10 text-center bg-error/30">Base</th>
                <th className="w-10 text-center bg-error/30">Sis</th>
                <th className="w-10 text-center bg-error/30">Alt</th>
                {user && user.role === "admin" && (
                  <th className="w-20 text-center bg-error/30">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {oldDados.map((item) => (
                <tr
                  key={item.id}
                  className={
                    item.codigo === codigo ? "bg-green-200" : "bg-error/30"
                  }
                >
                  <td className="hidden">{item.id}</td>
                  <td>{Use.formatarData(item.data)}</td>
                  <td className="hidden">{item.codigo}</td>
                  <td className="text-center">{item.dec}</td>
                  <td>{item.nome}</td>
                  <td className="text-center">
                    {Number(item.base).toFixed(2)}
                  </td>
                  <td className="text-center">{Number(item.sis).toFixed(2)}</td>
                  <td className="text-center">{Number(item.alt).toFixed(2)}</td>
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
              <tr className="font-bold bg-info/30">
                <td colSpan="2"></td>
                <td className="text-right">Total:</td>
                <td
                  colSpan={user && user.role === "admin" ? 4 : 3}
                  className="text-center"
                >
                  {(totalsOld.base + totalsOld.sis + totalsOld.alt).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default BSA;
