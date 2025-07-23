import React, { useEffect, useState, useCallback, useRef } from "react";
import Execute from "models/functions";
import Use from "models/utils";
import { useWebSocket } from "../../../contexts/WebSocketContext.js";

const sortDadosByDate = (dataArray) =>
  [...dataArray].sort((a, b) => new Date(a.data) - new Date(b.data));

const Aviso = ({ codigo, r }) => {
  const [dados, setDados] = useState([]);
  const { lastMessage } = useWebSocket();
  const lastProcessedTimestampRef = useRef(null);

  const handleAvisar = async (avisoid) => {
    try {
      await Execute.removeAviso(avisoid);
    } catch (error) {
      console.error("Erro em handleAvisar:", error);
      alert("Não foi possível remover o aviso.");
    }
  };

  const loadData = useCallback(async () => {
    if (typeof r === "undefined" || r === null) {
      setDados([]);
      return;
    }
    const data = await Execute.receiveFromAviso(r);
    if (Array.isArray(data)) {
      setDados(sortDadosByDate(data));
    } else {
      setDados([]);
    }
  }, [r]);

  useEffect(() => {
    loadData();
  }, [loadData, codigo, r]);

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
        case "AVISO_NEW_ITEM":
          if (payload && String(payload.r) === String(r)) {
            setDados((prevDados) => {
              if (
                !prevDados.find(
                  (item) => String(item.avisoid) === String(payload.avisoid),
                )
              ) {
                return sortDadosByDate([...prevDados, payload]);
              }
              return prevDados;
            });
          }
          break;
        case "AVISO_DELETED_ITEM":
          if (
            payload &&
            payload.avisoid !== undefined &&
            payload.avisoid !== null
          ) {
            setDados((prevDados) => {
              const itemExistsInTable = prevDados.some(
                (item) => String(item.avisoid) === String(payload.avisoid),
              );
              if (itemExistsInTable) {
                return sortDadosByDate(
                  prevDados.filter(
                    (item) => String(item.avisoid) !== String(payload.avisoid),
                  ),
                );
              }
              return prevDados;
            });
          }
          break;
        default:
          break;
      }
      lastProcessedTimestampRef.current = lastMessage.timestamp;
    }
  }, [lastMessage, r, setDados]);

  return (
    <div className="overflow-x-auto rounded-box border border-secondary bg-base-100">
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
          {dados.map((item) => (
            <tr
              key={item.avisoid}
              className="grid grid-cols-12 border-b border-secondary bg-secondary-content"
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
                <button
                  className="btn btn-xs btn-info btn-outline"
                  onClick={() => handleAvisar(item.avisoid)}
                >
                  Avisar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Aviso;
