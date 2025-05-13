import React, { useEffect, useState } from "react";
import Execute from "models/functions";
import Edit from "../Edit";
import Use from "models/utils";
import { useWebSocket } from "../../../contexts/WebSocketContext.js"; // Importar o hook

const formatCurrency = (value) => {
  const number = Number(value);
  return isNaN(number) ? "0.00" : number.toFixed(2);
};

const SaidasPessoal = ({ letras }) => {
  const [dados, setDados] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const { lastMessage } = useWebSocket(); // Usar o hook WebSocket

  useEffect(() => {
    const fetchData = async () => {
      if (!letras) return;
      try {
        const results = await Execute.receiveFromSaidaP(letras);
        const sortedResults = Array.isArray(results)
          ? results.sort((a, b) => new Date(b.pago) - new Date(a.pago))
          : [];
        setDados(sortedResults);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setDados([]);
      }
    };
    fetchData();
    // O polling com setInterval foi removido
  }, [letras]); // Re-fetch se 'letras' mudar

  // Efeito para lidar com mensagens WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.data) {
      const { type, payload } = lastMessage.data;

      // Verificar se a mensagem é relevante (mesmas 'letras')
      // O payload deve conter a lista atualizada de itens de 'SaidasPessoal'
      // e uma propriedade 'letras' para filtragem.
      if (
        type === "SAIDAS_PESSOAL_UPDATED" &&
        payload &&
        payload.letras === letras
      ) {
        const sortedResults = Array.isArray(payload.items)
          ? payload.items.sort((a, b) => new Date(b.pago) - new Date(a.pago))
          : [];
        setDados(sortedResults);
      }
    }
  }, [lastMessage, letras]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/v1/tables/gastos/pessoal/saida`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) throw new Error("Falha ao atualizar");

      // A atualização do estado 'dados' será feita pela mensagem WebSocket 'SAIDAS_PESSOAL_UPDATED'
      setEditingId(null);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      // Adicione um estado de erro se necessário
    }
  };

  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditedData({ ...item });
  };

  const handleRemove = async (id) => {
    try {
      // Execute.removeSaidaP fará o DELETE. O backend enviará 'SAIDAS_PESSOAL_UPDATED'.
      await Execute.removeSaidaP(id);
    } catch (error) {
      console.error("Erro ao remover:", error);
    }
  };

  return (
    <div className="overflow-x-auto rounded-box border border-primary bg-base-100">
      <h1 className="text-center w-full">GASTOS PESSOAL</h1>
      <table className="table table-xs w-full">
        <thead>
          <tr>
            <th className="hidden">ID</th>
            <th>DATA</th>
            <th>Gastos</th>
            <th>Valor</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((item) => (
            <tr key={item.id}>
              <td className="hidden">{item.id}</td>
              <td>{Use.formatarDataAno(item.pago)}</td>
              <td>
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editedData.gastos}
                    onChange={(e) =>
                      handleInputChange("gastos", e.target.value)
                    }
                    className="input input-xs p-0 m-0 text-center"
                  />
                ) : (
                  item.gastos
                )}
              </td>
              <td>
                {editingId === item.id ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editedData.valor}
                    onChange={(e) => handleInputChange("valor", e.target.value)}
                    className="input input-xs p-0 m-0 text-center"
                  />
                ) : (
                  formatCurrency(item.valor)
                )}
              </td>
              <td>
                <Edit
                  isEditing={editingId === item.id}
                  onEdit={() => startEditing(item)}
                  onSave={handleSave}
                  onCancel={() => {
                    setEditingId(null);
                  }}
                />
                <button
                  className={`btn btn-soft btn-xs btn-error ml-1 ${
                    editingId === item.id ? "hidden" : ""
                  }`}
                  onClick={() => handleRemove(item.id)}
                  disabled={editingId === item.id}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SaidasPessoal;
