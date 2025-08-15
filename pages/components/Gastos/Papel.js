import React, { useEffect, useState, useRef } from "react";
import Edit from "../Edit.js";
import Execute from "models/functions.js";
import Use from "models/utils.js";
import { XCircleIcon } from "@primer/octicons-react";
import { CheckIcon } from "@primer/octicons-react";
import { AlertIcon } from "@primer/octicons-react";
import { useWebSocket } from "../../../contexts/WebSocketContext.js"; // Importar o hook

const Papel = ({ letras }) => {
  const [data, setData] = useState([]);
  const [item, setItem] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("");
  const [valor, setValor] = useState("");
  const [gastos, setGastos] = useState("");
  const [pago, setPago] = useState("");
  const [alerta, setAlerta] = useState("");
  const [metragem, setMetragem] = useState("");

  // Estados para edição
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});

  const { lastMessage } = useWebSocket(); // Usar o hook WebSocket
  const lastProcessedTimestampRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!letras) return;
      try {
        const results = await Execute.receiveFromPapel(letras);
        setData(results || []); // Garante que seja um array
      } catch (error) {
        console.error("Erro ao buscar dados de Papel:", error);
        setData([]);
      }
    };

    fetchData();
    // O polling com setInterval foi removido
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letras]); // Re-fetch se 'letras' mudar

  // Efeito para lidar com mensagens WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.data && lastMessage.timestamp) {
      // Se o timestamp da mensagem atual for o mesmo da última processada, ignore.
      if (
        lastProcessedTimestampRef.current &&
        lastMessage.timestamp <= lastProcessedTimestampRef.current
      ) {
        console.log(
          "Papel.js: Ignorando mensagem WebSocket já processada (mesmo timestamp). Timestamp:",
          lastMessage.timestamp,
        );
        return;
      }

      const { type, payload } = lastMessage.data;

      // Verifica se o payload existe e se a mensagem é relevante para este componente (mesmo 'letras', que parece ser 'dec' no payload)
      if (payload) {
        switch (type) {
          case "PAPEL_NEW_ITEM":
            // Adiciona o novo item se corresponder à 'letra' (dec) atual do componente
            if (payload.dec === letras) {
              setData((prevData) => {
                // Evitar duplicatas se por algum motivo o item já existir
                if (prevData.find((item) => item.id === payload.id)) {
                  return prevData.map((item) =>
                    item.id === payload.id ? payload : item,
                  );
                }
                return [...prevData, payload];
              });
            }
            break;
          case "PAPEL_UPDATED_ITEM":
            setData((prevData) =>
              prevData.map((item) =>
                item.id === payload.id ? { ...item, ...payload } : item,
              ),
            );

            if (editingId == payload.id) {
              setEditingId(null); // Fecha o formulário de edição se o item editado foi atualizado
            }
            break;
          case "PAPEL_DELETED_ITEM":
            if (payload && payload.id !== undefined) {
              const idToRemove = String(payload.id);
              setData((prevData) =>
                prevData.filter((item) => String(item.id) !== idToRemove),
              );
              // Fechar edição se o item excluído estava sendo editado
              if (editingId === payload.id) {
                setEditingId(null);
              }
            }
            break;
          default:
            // Tipo de mensagem não relevante para este componente ou desconhecido
            break;
        }
      }
      // Após processar a mensagem, atualize o timestamp da última mensagem processada.
      lastProcessedTimestampRef.current = lastMessage.timestamp;
    }
  }, [lastMessage, letras, editingId]);

  // Ordenação e agrupamento dos dados
  const sortedData = [...data].sort((a, b) => a.item.localeCompare(b.item));
  const processedData = sortedData.map((entry, index) => {
    const isFirst = index === 0 || sortedData[index - 1].item !== entry.item;
    let rowSpan = 1;
    if (isFirst) {
      let count = 1;
      while (
        index + count < sortedData.length &&
        sortedData[index + count].item === entry.item
      ) {
        count++;
      }
      rowSpan = count;
    }
    return { ...entry, isFirst, rowSpan };
  });

  // Função para iniciar a edição de uma linha
  const startEditing = (entry) => {
    setEditingId(entry.id);
    setEditedData({ ...entry });
  };

  // Atualiza os dados editados conforme o usuário altera os inputs
  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  // Função para salvar as alterações (PUT)
  const handleSave = async () => {
    try {
      const response = await fetch("/api/v1/tables/gastos/papel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedData),
      });
      if (!response.ok) throw new Error("Erro ao atualizar");
      console.log(
        "Papel.js: Dados salvos via API. Aguardando mensagem WebSocket para fechar o modo de edição.",
      );
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const handlePagar = async (entry) => {
    try {
      // Atualiza o registro no backend
      const updatedEntry = {
        ...entry,
        pago: new Date().toISOString().split("T")[0], // Atualiza a data do último pagamento
      };

      const response = await fetch("/api/v1/tables/gastos/papel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEntry),
      });

      if (!response.ok) throw new Error("Erro ao atualizar");

      await Execute.sendToSaidaO(
        letras,
        entry.item,
        entry.gastos,
        entry.valor,
        new Date().toISOString().split("T")[0],
      );
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
    }
  };

  // Função para cancelar a edição
  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await Execute.sendToPapel(
      letras,
      item,
      quantidade,
      unidade,
      valor,
      gastos,
      pago,
      alerta,
      metragem,
    );

    await Execute.sendToSaidaO(letras, item, gastos, valor, pago);

    setItem("");
    setQuantidade("");
    setUnidade("");
    setValor("");
    setGastos("");
    setPago("");
    setAlerta("");
    setMetragem("");
  };

  const handleDelete = async (id) => {
    try {
      await Execute.removePapel(id);
    } catch (error) {
      console.error("Erro ao excluir item de Papel:", error);
    }
  };

  const getStatusVencimento = (entry) => {
    const metragem = parseFloat(entry.metragem);
    const alertaThreshold = parseFloat(entry.alerta);

    // Se metragem não for um número válido, consideramos 'ok' para evitar erros.
    if (isNaN(metragem)) {
      return "ok";
    }

    if (metragem === 0) {
      return "vencido";
    }

    // Se alertaThreshold não for um número válido, não podemos comparar, então 'ok'.
    if (isNaN(alertaThreshold)) {
      return "ok";
    }

    if (metragem < alertaThreshold) {
      return "proximo";
    }

    return "ok";
  };
  const shouldShowAlert = (entry) => {
    return getStatusVencimento(entry) === "proximo";
  };

  return (
    <>
      <div className="overflow-x-auto rounded-box border border-accent bg-base-100">
        <h1 className="text-center w-full">PAPEL</h1>
        <form onSubmit={handleSubmit} className="flex gap-2 p-2">
          <select
            className="select select-info select-xs"
            value={item}
            onChange={(e) => setItem(e.target.value)}
          >
            <option disabled value="">
              Oficinas
            </option>
            <option>R1</option>
            <option>R2</option>
            <option>R3</option>
          </select>
          <input
            type="number"
            placeholder="Quantidade"
            className="input input-info input-xs"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
          <input
            type="number"
            placeholder="Unidade"
            className="input input-info input-xs"
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
          />
          <input
            type="number"
            required
            placeholder="Valor"
            className="input input-info input-xs"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <select
            className="select select-info select-xs"
            value={gastos}
            required
            onChange={(e) => setGastos(e.target.value)}
          >
            <option disabled value="">
              Gastos
            </option>
            <option>PAPEL-01</option>
            <option>PAPEL-02</option>
            <option>PAPEL-03</option>
            <option>PAPEL-04</option>
            <option>PAPEL-05</option>
          </select>
          <input
            type="date"
            required
            placeholder="Pago"
            className="input input-success input-xs custom-date-input"
            value={pago}
            onChange={(e) => setPago(e.target.value)}
          />
          <input
            type="number"
            required
            placeholder="Alerta Por Metragem"
            className="input input-warning input-xs"
            value={alerta}
            onChange={(e) => setAlerta(e.target.value)}
          />
          <input
            type="number"
            required
            placeholder="Metragem"
            className="input input-accent input-xs"
            value={metragem}
            onChange={(e) => setMetragem(e.target.value)}
          />
          <button type="submit" className="btn btn-xs btn-info">
            Enviar
          </button>
        </form>
        <table className="table table-xs">
          <thead className="text-center">
            <tr>
              <th className="hidden">ID</th>
              <th>Item</th>
              <th>Quantidade</th>
              <th>Unidade</th>
              <th>Valor</th>
              <th>Gastos</th>
              <th>Pago</th>
              <th>Alerta</th>
              <th>Metragem</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((entry) =>
              entry.isFirst ? (
                // Primeira linha do grupo com rowSpan para o campo Item
                <tr key={entry.id} className="text-center">
                  <td className="hidden">{entry.id}</td>
                  <td className="px-0.5 text-center" rowSpan={entry.rowSpan}>
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        value={editedData.item}
                        onChange={(e) =>
                          handleInputChange("item", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      entry.item
                    )}
                  </td>
                  <td className="px-0.5">
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        value={editedData.quantidade}
                        onChange={(e) =>
                          handleInputChange("quantidade", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      entry.quantidade
                    )}
                  </td>
                  <td className="px-0.5">
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        value={editedData.unidade}
                        onChange={(e) =>
                          handleInputChange("unidade", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      entry.unidade
                    )}
                  </td>
                  <td className="px-0.5">
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        value={editedData.valor}
                        onChange={(e) =>
                          handleInputChange("valor", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      entry.valor
                    )}
                  </td>
                  <td className="px-0.5">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        value={editedData.gastos}
                        onChange={(e) =>
                          handleInputChange("gastos", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      entry.gastos
                    )}
                  </td>
                  <td className="px-0.5">
                    {editingId === entry.id ? (
                      <input
                        type="date"
                        value={
                          editedData.pago ? editedData.pago.split("T")[0] : ""
                        }
                        onChange={(e) =>
                          handleInputChange("pago", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      Use.formatarDataAno(entry.pago)
                    )}
                  </td>
                  <td className="px-0.5">
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        value={editedData.alerta}
                        onChange={(e) =>
                          handleInputChange("alerta", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      entry.alerta
                    )}
                  </td>
                  <td className="px-0.5">
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        value={editedData.metragem}
                        onChange={(e) =>
                          handleInputChange("metragem", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      entry.metragem
                    )}
                  </td>
                  <td className="px-0">
                    <button
                      className={`btn btn-xs btn-soft btn-success ${editingId === entry.id ? "hidden" : ""}`}
                      onClick={() => handlePagar(entry)}
                    >
                      Pagar
                    </button>
                    <Edit
                      isEditing={editingId === entry.id}
                      onEdit={() => startEditing(entry)}
                      onSave={handleSave}
                      onCancel={handleCancel}
                    />
                    <button
                      className={`btn btn-xs btn-soft btn-error ${editingId === entry.id ? "hidden" : ""}`}
                      onClick={() => handleDelete(entry.id)}
                    >
                      Excluir
                    </button>
                    <span
                      className={`ml-2 badge badge-error badge-sm ${
                        editingId === entry.id ||
                        getStatusVencimento(entry) !== "vencido"
                          ? "hidden"
                          : ""
                      }`}
                    >
                      <XCircleIcon size={12} />
                      Vencido
                    </span>
                    <span
                      className={`ml-2 badge badge-warning badge-sm ${
                        editingId === entry.id || !shouldShowAlert(entry)
                          ? "hidden"
                          : ""
                      }`}
                    >
                      <AlertIcon size={12} />A Vencer
                    </span>
                    <span
                      className={`ml-2 badge badge-success badge-sm ${
                        editingId === entry.id ||
                        getStatusVencimento(entry) !== "ok"
                          ? "hidden"
                          : ""
                      }`}
                    >
                      <CheckIcon size={12} />
                      No Prazo
                    </span>
                  </td>
                </tr>
              ) : (
                // Demais linhas do grupo sem a célula do Item
                <tr key={entry.id}>
                  <td className="hidden">{entry.id}</td>
                  <td className="px-0.5 text-center">
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        value={editedData.quantidade}
                        onChange={(e) =>
                          handleInputChange("quantidade", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      entry.quantidade
                    )}
                  </td>
                  <td className="px-0.5 text-center">
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        value={editedData.unidade}
                        onChange={(e) =>
                          handleInputChange("unidade", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      entry.unidade
                    )}
                  </td>
                  <td className="px-0.5 text-center">
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        value={editedData.valor}
                        onChange={(e) =>
                          handleInputChange("valor", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      entry.valor
                    )}
                  </td>
                  <td className="px-0.5 text-center">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        value={editedData.gastos}
                        onChange={(e) =>
                          handleInputChange("gastos", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      entry.gastos
                    )}
                  </td>
                  <td className="px-0.5 text-center">
                    {editingId === entry.id ? (
                      <input
                        type="date"
                        value={
                          editedData.pago ? editedData.pago.split("T")[0] : ""
                        }
                        onChange={(e) =>
                          handleInputChange("pago", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      Use.formatarDataAno(entry.pago)
                    )}
                  </td>
                  <td className="px-0.5 text-center">
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        value={editedData.alerta}
                        onChange={(e) =>
                          handleInputChange("alerta", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      entry.alerta
                    )}
                  </td>
                  <td className="px-0.5 text-center">
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        value={editedData.metragem}
                        onChange={(e) =>
                          handleInputChange("metragem", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      entry.metragem
                    )}
                  </td>
                  <td className="px-0.5 text-center">
                    <button
                      className={`btn btn-xs btn-soft btn-success ${editingId === entry.id ? "hidden" : ""}`}
                      onClick={() => handlePagar(entry)}
                    >
                      Pagar
                    </button>
                    <Edit
                      isEditing={editingId === entry.id}
                      onEdit={() => startEditing(entry)}
                      onSave={handleSave}
                      onCancel={handleCancel}
                    />
                    <button
                      className={`btn btn-xs btn-soft btn-error ${editingId === entry.id ? "hidden" : ""}`}
                      onClick={() => Execute.removePapel(entry.id)}
                    >
                      Excluir
                    </button>
                    <span
                      className={`ml-2 badge badge-error badge-sm ${
                        editingId === entry.id ||
                        getStatusVencimento(entry) !== "vencido"
                          ? "hidden"
                          : ""
                      }`}
                    >
                      <XCircleIcon size={12} />
                      Vencido
                    </span>
                    <span
                      className={`ml-2 badge badge-warning badge-sm ${
                        editingId === entry.id || !shouldShowAlert(entry)
                          ? "hidden"
                          : ""
                      }`}
                    >
                      <AlertIcon size={12} />A Vencer
                    </span>
                    <span
                      className={`ml-2 badge badge-success badge-sm ${
                        editingId === entry.id ||
                        getStatusVencimento(entry) !== "ok"
                          ? "hidden"
                          : ""
                      }`}
                    >
                      <CheckIcon size={12} />
                      No Prazo
                    </span>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Papel;
