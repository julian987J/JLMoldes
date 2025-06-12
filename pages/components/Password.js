import React, { useEffect, useState, useCallback } from "react";
import Execute from "models/functions"; // Assuming 'models' is an alias or correct relative path
import Edit from "./Edit.js"; // Correct relative path to Edit.js

const Password = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({ usuario: "", senha: "" });
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const usersData = await Execute.receiveUsers();
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
      setError(err.message || "Falha ao carregar usuários. Tente novamente.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const startEditing = (user) => {
    setEditingId(user.id);

    setEditedData({
      id: user.id,
      usuario: user.usuario,
      senha: user.senha || "",
    });
  };

  const handleSave = async () => {
    if (!editedData.usuario || !editedData.senha) {
      alert("Usuário e senha não podem ser vazios.");
      return;
    }
    setError(null);
    try {
      const updatedUser = await Execute.updateUser(editedData);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === updatedUser.id ? { ...user, ...updatedUser } : user,
        ),
      );
      setEditingId(null);
      setEditedData({ usuario: "", senha: "" }); // Reset
    } catch (err) {
      console.error("Erro ao salvar usuário:", err);
      setError(
        err.message || "Erro ao salvar. Verifique os dados e tente novamente.",
      );
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedData({ usuario: "", senha: "" });
    setError(null);
  };

  if (loading) {
    return <div className="text-center p-4">Carregando usuários...</div>;
  }

  return (
    <div className="overflow-x-auto rounded-box border border-success bg-base-100 p-4">
      <h2 className="text-xl font-bold mb-4 text-center">
        Gerenciamento de Usuários
      </h2>
      {error && (
        <div className="alert alert-error shadow-lg mb-4">
          <div>
            <span>{error}</span>
          </div>
        </div>
      )}
      <table className="table table-xs w-full">
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuário</th>
            <th>Senha</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && !loading && (
            <tr>
              <td colSpan="4" className="text-center">
                Nenhum usuário encontrado.
              </td>
            </tr>
          )}
          {users.map((user) => (
            <tr key={user.id} className="hover">
              <td>{user.id}</td>
              <td>{user.usuario}</td>
              <td>
                {editingId === user.id ? (
                  <input
                    type="text"
                    value={editedData.senha}
                    onChange={(e) => handleInputChange("senha", e.target.value)}
                    placeholder="Nova Senha"
                    className="input input-xs input-bordered w-full max-w-xs"
                  />
                ) : (
                  user.senha
                )}
              </td>
              <td>
                <Edit
                  isEditing={editingId === user.id}
                  onEdit={() => startEditing(user)}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Password;
