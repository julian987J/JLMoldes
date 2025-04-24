import React, { useEffect, useState } from "react";
import Execute from "models/functions";
import Edit from "../Edit";
import Use from "models/utils";

const formatCurrency = (value) => {
  const number = Number(value);
  return isNaN(number) ? "0.00" : number.toFixed(2);
};

const SaidasPessoal = ({ letras }) => {
  const [dados, setDados] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Execute.receiveFromSaidaP(letras);
        setDados(results || []);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setDados([]);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, [letras]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/v1/tables/gastos/pessoal/saida`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) throw new Error("Falha ao atualizar");

      // Atualiza os dados locais imediatamente
      setDados(
        dados.map((item) =>
          item.id === editedData.id ? { ...item, ...editedData } : item,
        ),
      );
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
      await Execute.removeSaidaP(id);
      setDados(dados.filter((item) => item.id !== id));
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
