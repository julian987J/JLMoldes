import React, { useEffect, useState } from "react";
import Edit from "../Edit.js";
import Execute from "models/functions.js";
import Use from "models/utils.js";
import { XCircleIcon } from "@primer/octicons-react";
import { CheckIcon } from "@primer/octicons-react";
import { AlertIcon } from "@primer/octicons-react";

const Oficina = ({ letras }) => {
  const [data, setData] = useState([]);
  const [item, setItem] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("");
  const [valor, setValor] = useState("");
  const [gastos, setGastos] = useState("");
  const [pago, setPago] = useState("");
  const [proximo, setProximo] = useState("");
  const [dia, setDia] = useState("");
  const [alerta, setAlerta] = useState("");

  // Estados para edição
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});

  const fetchData = async () => {
    try {
      const results = await Execute.receiveFromOficina(letras);
      setData(results); // Armazena os dados recebidos
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const response = await fetch("/api/v1/tables/gastos/oficina", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedData),
      });
      if (!response.ok) throw new Error("Erro ao atualizar");

      // Atualiza o array de dados com as alterações
      setData(
        data.map((item) =>
          item.id === editedData.id ? { ...item, ...editedData } : item,
        ),
      );
      setEditingId(null);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  // Função para cancelar a edição
  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await Execute.sendToOficina(
      letras,
      item,
      quantidade,
      unidade,
      valor,
      gastos,
      pago,
      proximo === "" ? null : proximo,
      dia,
      alerta,
    );

    setItem("");
    setQuantidade("");
    setUnidade("");
    setValor("");
    setGastos("");
    setPago("");
    setProximo("");
    setDia("");
    setAlerta("");
  };

  const getStatusVencimento = (entry) => {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    let dataVencimento;
    if (entry.proximo) {
      dataVencimento = new Date(entry.proximo);
    } else if (entry.pago && entry.dia) {
      const dataPago = new Date(entry.pago);
      dataVencimento = new Date(dataPago);
      dataVencimento.setDate(dataPago.getDate() + parseInt(entry.dia, 10));
    } else {
      return "invalid";
    }

    if (isNaN(dataVencimento.getTime())) return "invalid";
    dataVencimento.setHours(23, 59, 59, 999);

    // Calcula diferença de dias
    const diffTime = dataVencimento - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "vencido";
    if (diffDays <= parseInt(entry.alerta, 10)) return "proximo";
    return "ok";
  };

  const shouldShowAlert = (entry) => {
    if (!entry.alerta || isNaN(parseInt(entry.alerta, 10))) return false;
    return getStatusVencimento(entry) === "proximo";
  };

  return (
    <>
      <div className="overflow-x-auto rounded-box border border-secondary bg-base-100">
        <h1 className="text-center w-full">OFICINA</h1>
        <form onSubmit={handleSubmit} className="flex gap-2 p-2">
          <select
            className="select select-info select-xs"
            value={item}
            onChange={(e) => setItem(e.target.value)}
          >
            <option disabled value="">
              Itens
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
          <input
            type="text"
            required
            placeholder="Gastos"
            className="input input-info input-xs"
            value={gastos}
            onChange={(e) => setGastos(e.target.value)}
          />
          <input
            type="date"
            required
            placeholder="Pago"
            className="input input-success input-xs custom-date-input"
            value={pago}
            onChange={(e) => setPago(e.target.value)}
          />
          <input
            type="date"
            placeholder="Proximo"
            className="input input-warning input-xs custom-date-input"
            value={proximo || ""}
            onChange={(e) => setProximo(e.target.value)}
          />
          <input
            type="number"
            required
            placeholder="Dia"
            className="input input-info input-xs"
            value={dia}
            onChange={(e) => setDia(e.target.value)}
          />
          <input
            type="number"
            required
            placeholder="Alerta"
            className="input input-info input-xs"
            value={alerta}
            onChange={(e) => setAlerta(e.target.value)}
          />
          <button type="submit" className="btn btn-xs btn-info">
            Enviar
          </button>
        </form>
        <table className="table table-xs">
          <thead>
            <tr>
              <th className="hidden">ID</th>
              <th>Item</th>
              <th>Quantidade</th>
              <th>Unidade</th>
              <th>Valor</th>
              <th>Gastos</th>
              <th>Pago</th>
              <th>Proximo</th>
              <th>Dia</th>
              <th>Alerta</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((entry) =>
              entry.isFirst ? (
                // Primeira linha do grupo com rowSpan para o campo Item
                <tr key={entry.id}>
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
                        type="date"
                        value={
                          editedData.proximo
                            ? editedData.proximo.split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleInputChange("proximo", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      Use.formatarDataAno(entry.proximo)
                    )}
                  </td>
                  <td className="px-0.5">
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        value={editedData.dia}
                        onChange={(e) =>
                          handleInputChange("dia", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      entry.dia
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
                  <td className="px-0">
                    <Edit
                      isEditing={editingId === entry.id}
                      onEdit={() => startEditing(entry)}
                      onSave={handleSave}
                      onCancel={handleCancel}
                    />
                    <button
                      className={`btn btn-xs btn-soft btn-error ${editingId === entry.id ? "hidden" : ""}`}
                      onClick={() => Execute.removeOficina(entry.id)}
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
                        type="date"
                        value={
                          editedData.proximo
                            ? editedData.proximo.split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleInputChange("proximo", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      Use.formatarDataAno(entry.proximo)
                    )}
                  </td>
                  <td className="px-0.5">
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        value={editedData.dia}
                        onChange={(e) =>
                          handleInputChange("dia", e.target.value)
                        }
                        className="input input-xs p-0 m-0 text-center"
                      />
                    ) : (
                      entry.dia
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
                    <Edit
                      isEditing={editingId === entry.id}
                      onEdit={() => startEditing(entry)}
                      onSave={handleSave}
                      onCancel={handleCancel}
                    />
                    <button
                      className={`btn btn-xs btn-soft btn-error ${editingId === entry.id ? "hidden" : ""}`}
                      onClick={() => Execute.removeOficina(entry.id)}
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

export default Oficina;
