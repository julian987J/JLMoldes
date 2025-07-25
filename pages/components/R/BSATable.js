/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useCallback, useRef } from "react";
import Execute from "models/functions";
import Use from "models/utils";
import { useWebSocket } from "../../../contexts/WebSocketContext.js"; // Ajuste o caminho se necessário

const sortDadosByDate = (dataArray) =>
  [...dataArray].sort((a, b) => new Date(b.data) - new Date(a.data));

const BSA = ({ codigo, r }) => {
  const [dados, setDados] = useState([]);
  const { lastMessage } = useWebSocket();
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
          {dados.map((item) => (
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
    </div>
  );
};

export default BSA;