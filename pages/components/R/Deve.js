import React, { useEffect, useState, useCallback, useRef } from "react";
import Execute from "models/functions";
import Use from "models/utils";
import { useWebSocket } from "../../../contexts/WebSocketContext.js"; // Ajuste o caminho se necessário

const sortDadosByDate = (dataArray) =>
  [...dataArray].sort((a, b) => new Date(b.data) - new Date(a.data));

const Deve = ({ codigo, r }) => {
  const [dados, setDados] = useState([]);
  const { lastMessage } = useWebSocket();
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
        case "DEVE_DELETED_ITEM": // Payload é { codigo: "some-codigo" }
          if (
            payload &&
            payload.codigo !== undefined &&
            payload.codigo !== null
          ) {
            setDados((prevDados) => {
              // Remove o item se o código corresponder
              const itemExistsInTable = prevDados.some(
                (item) => String(item.codigo) === String(payload.codigo),
              );
              if (itemExistsInTable) {
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
          {dados.map((item) => (
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
    </div>
  );
};

export default Deve;