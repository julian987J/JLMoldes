import React, { useEffect, useState, useCallback, useRef } from "react";
import Execute from "models/functions";
import Use from "models/utils";
import { useWebSocket } from "../../../contexts/WebSocketContext.js"; // Ajuste o caminho se necessário
import { useAuth } from "../../../contexts/AuthContext.js";

const sortDadosByDate = (dataArray) =>
  [...dataArray].sort((a, b) => new Date(b.data) - new Date(a.data));

const Deve = ({ codigo, r, onTotalsChange, total1M, total2M }) => {
  const [dados, setDados] = useState([]);
  const { lastMessage } = useWebSocket();
  const { user } = useAuth();
  const lastProcessedTimestampRef = useRef(null);

  const handleAvisar = async (deveid, codigo, r) => {
    try {
      const response = await fetch(`/api/v1/tables/calculadora/deve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deveid,
          codigo,
          r,
          avisado: 1, // Marca como avisado
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao atualizar o status de aviso.");
      }
      // A UI será atualizada via WebSocket
    } catch (error) {
      console.error("Erro em handleAvisar:", error);
      alert("Não foi possível marcar como avisado.");
    }
  };

  const handleDelete = async (deveid) => {
    try {
      await Execute.removeDeveById(deveid);
    } catch (error) {
      console.error("Erro ao excluir dívida:", error);
      alert("Falha ao excluir a dívida.");
    }
  };

  const loadData = useCallback(async () => {
    if (typeof r === "undefined" || r === null) {
      setDados([]); // Limpa os dados se 'r' não for válido
      return;
    }
    const data = await Execute.receiveFromDeve(r);
    if (Array.isArray(data)) {
      setDados(sortDadosByDate(data));
    } else {
      console.warn(
        "Deve.js: 'receiveFromDeve' não retornou um array como esperado. Recebido:",
        data,
      );
      setDados([]);
    }
  }, [r]);

  useEffect(() => {
    loadData(); // Busca inicial
  }, [loadData, codigo, r]); // Depende de loadData e codigo

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

      // console.log("Deve.js: Mensagem WebSocket recebida.", type, payload, "Prop r:", r);

      switch (type) {
        case "DEVE_NEW_ITEM":
          if (payload && String(payload.r) === String(r)) {
            // Compara 'r' como strings
            setDados((prevDados) => {
              // Verifica se o item já existe pelo ID (ou outro identificador único)
              if (
                !prevDados.find(
                  // Usa deveid como identificador único
                  (item) => String(item.deveid) === String(payload.deveid),
                )
              ) {
                return sortDadosByDate([...prevDados, payload]);
              }
              return prevDados; // Item já existe
            });
          }
          break;
        case "DEVE_DELETED_ITEM":
          if (payload && String(payload.r) === String(r)) {
            setDados((prevDados) => {
              if (payload.deveid) {
                return sortDadosByDate(
                  prevDados.filter(
                    (item) => String(item.deveid) !== String(payload.deveid),
                  ),
                );
              }
              if (payload.codigo) {
                return sortDadosByDate(
                  prevDados.filter(
                    (item) => String(item.codigo) !== String(payload.codigo),
                  ),
                );
              }
              return prevDados;
            });
          }
          break;
        case "DEVE_UPDATED_ITEM":
          if (payload && String(payload.r) === String(r)) {
            setDados((prevDados) => {
              const updatedDados = prevDados.map((item) =>
                item.deveid === payload.deveid ? { ...item, ...payload } : item,
              );
              return sortDadosByDate(updatedDados);
            });
          }
          break;
        default:
          break;
      }
      lastProcessedTimestampRef.current = lastMessage.timestamp;
    }
  }, [lastMessage, r, setDados]); // Depende de lastMessage, r, e setDados

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

  const totalDeveBetweenOneAndTwoMonths = betweenOneAndTwoMonthsDados.reduce(
    (sum, item) => sum + (Number(item.valor) || 0),
    0,
  );

  const totalDeveOld = oldDados.reduce(
    (sum, item) => sum + (Number(item.valor) || 0),
    0,
  );

  useEffect(() => {
    if (onTotalsChange) {
      onTotalsChange({
        total1M: totalDeveBetweenOneAndTwoMonths,
        total2M: totalDeveOld,
      });
    }
  }, [totalDeveBetweenOneAndTwoMonths, totalDeveOld, onTotalsChange]);

  return (
    <div className="overflow-x-auto rounded-box border border-neutral-content bg-base-100">
      <table className="table table-xs">
        <thead>
          <tr className="grid grid-cols-12">
            <th className="col-span-3">Data</th>
            <th className="col-span-1">Valor</th>
            <th className="col-span-1">Enc</th>
            <th className="col-span-1">Deve</th>
            <th className="col-span-1">COD</th>
            <th className="col-span-3">Nome</th>
            <th className="col-span-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {recentDados.map((item) => (
            <tr
              key={item.deveid}
              className={`grid grid-cols-12 ${
                item.codigo == codigo
                  ? "bg-green-200"
                  : Number(item.avisado) === 1
                    ? "bg-info/30"
                    : "border-b border-neutral-content"
              }`}
            >
              <td className="col-span-3">{Use.formatarDataHora(item.data)}</td>
              <td className="col-span-1">
                {Number(item.valorpapel).toFixed(2)}
              </td>
              <td className="col-span-1">
                {Number(item.valorcomissao).toFixed(2)}
              </td>
              <td className="col-span-1">{Number(item.valor).toFixed(2)}</td>
              <td className="col-span-1">{item.codigo}</td>
              <td className="col-span-3">{item.nome}</td>
              <td className="col-span-2">
                {Number(item.avisado) === 1 ? (
                  <button className="btn btn-xs btn-success" disabled>
                    Avisado
                  </button>
                ) : (
                  <button
                    className="btn btn-xs btn-info btn-outline"
                    onClick={() => handleAvisar(item.deveid, item.codigo, r)}
                  >
                    Avisar
                  </button>
                )}
              </td>
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
              <tr className="grid grid-cols-12">
                <th className="col-span-3 bg-secondary-content">Data</th>
                <th className="col-span-1 bg-secondary-content">Valor</th>
                <th className="col-span-1 bg-secondary-content">Enc</th>
                <th className="col-span-1 bg-secondary-content">Deve</th>
                <th className="col-span-1 bg-secondary-content">COD</th>
                <th className="col-span-3 bg-secondary-content">Nome</th>
                <th className="col-span-2 bg-secondary-content">Ações</th>
              </tr>
            </thead>
            <tbody>
              {betweenOneAndTwoMonthsDados.map((item) => (
                <tr
                  key={item.deveid}
                  className={`grid grid-cols-12 ${
                    item.codigo == codigo
                      ? "bg-green-200"
                      : "bg-secondary-content"
                  }`}
                >
                  <td className="col-span-3">
                    {Use.formatarDataHora(item.data)}
                  </td>
                  <td className="col-span-1">
                    {Number(item.valorpapel).toFixed(2)}
                  </td>
                  <td className="col-span-1">
                    {Number(item.valorcomissao).toFixed(2)}
                  </td>
                  <td className="col-span-1">
                    {Number(item.valor).toFixed(2)}
                  </td>
                  <td className="col-span-1">{item.codigo}</td>
                  <td className="col-span-3">{item.nome}</td>
                  <td className="col-span-2">
                    {Number(item.avisado) === 1 ? (
                      <button className="btn btn-xs btn-success" disabled>
                        Avisado
                      </button>
                    ) : (
                      <button
                        className="btn btn-xs btn-info btn-outline"
                        onClick={() =>
                          handleAvisar(item.deveid, item.codigo, r)
                        }
                      >
                        Avisar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="grid grid-cols-12 font-bold bg-info/30">
                <td className="col-span-5 text-right">Total:</td>
                <td className="col-span-1">
                  {totalDeveBetweenOneAndTwoMonths.toFixed(2)}
                </td>
                <td className="col-span-6 text-right">
                  <span className="badge badge-warning text-black">
                    {total1M.toFixed(2)}
                  </span>
                </td>
              </tr>
            </tfoot>
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
              <tr className="grid grid-cols-12">
                <th className="col-span-3 bg-error/30">Data</th>
                <th className="col-span-1 bg-error/30">Valor</th>
                <th className="col-span-1 bg-error/30">Enc</th>
                <th className="col-span-1 bg-error/30">Deve</th>
                <th className="col-span-1 bg-error/30">COD</th>
                <th className="col-span-3 bg-error/30">Nome</th>
                <th className="col-span-2 bg-error/30">Ações</th>
              </tr>
            </thead>
            <tbody>
              {oldDados.map((item) => (
                <tr
                  key={item.deveid}
                  className={`grid grid-cols-12 ${
                    item.codigo == codigo ? "bg-green-200" : "bg-error/30"
                  }`}
                >
                  <td className="col-span-3">
                    {Use.formatarDataHora(item.data)}
                  </td>
                  <td className="col-span-1">
                    {Number(item.valorpapel).toFixed(2)}
                  </td>
                  <td className="col-span-1">
                    {Number(item.valorcomissao).toFixed(2)}
                  </td>
                  <td className="col-span-1">
                    {Number(item.valor).toFixed(2)}
                  </td>
                  <td className="col-span-1">{item.codigo}</td>
                  <td className="col-span-3">{item.nome}</td>
                  <td className="col-span-2">
                    {Number(item.avisado) === 1 ? (
                      <button className="btn btn-xs btn-success" disabled>
                        Avisado
                      </button>
                    ) : (
                      <button
                        className="btn btn-xs btn-info btn-outline"
                        onClick={() =>
                          handleAvisar(item.deveid, item.codigo, r)
                        }
                      >
                        Avisar
                      </button>
                    )}
                    {user && user.role === "admin" && (
                      <button
                        className="btn btn-xs btn-error btn-outline ml-1"
                        onClick={() => handleDelete(item.deveid)}
                      >
                        Excluir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="grid grid-cols-12 font-bold bg-info/30">
                <td className="col-span-5 text-right">Total:</td>
                <td className="col-span-1">{totalDeveOld.toFixed(2)}</td>
                <td className="col-span-6 text-right">
                  <span className="badge badge-warning text-black">
                    {total2M.toFixed(2)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default Deve;
