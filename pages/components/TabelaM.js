import React, { useEffect, useState } from "react";

const TabelaM = () => {
  const [dados, setDados] = useState([]);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/v1/tables"); // URL correta para o endpoint
      if (!response.ok) throw new Error("Erro ao carregar os dados");
      const data = await response.json();

      if (Array.isArray(data.rows)) {
        setDados(data.rows);
      } else {
        console.error("Formato de resposta inesperado:", data);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  useEffect(() => {
    fetchData(); // Carrega os dados ao montar o componente

    const intervalId = setInterval(fetchData, 1000); // Atualiza a cada 5 segundos

    return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar o componente
  }, []);

  return (
    <div>
      <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
        <table className="table table-xs">
          {/* Cabeçalho da Tabela */}
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>DEC</th>
              <th>Nome</th>
              <th>Sis</th>
              <th>Base</th>
              <th>Alt</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {/* Mapeia os dados para exibir as linhas dinamicamente */}
            {dados.map((item) => (
              <tr key={item.id}>
                <td>{item.data}</td>
                <td>{item.descricao}</td>
                <td>{item.dec}</td>
                <td>{item.nome}</td>
                <td>{item.sis}</td>
                <td>{item.base}</td>
                <td>{item.alt}</td>
                <td>
                  <button className="btn btn-xs btn-soft btn-warning">
                    R1
                  </button>
                  <button className="btn btn-xs btn-soft btn-primary">
                    R2
                  </button>
                  <button className="btn btn-xs btn-soft btn-info">R3</button>
                  <button className="btn btn-xs btn-soft btn-secondary">
                    M1
                  </button>
                  <button className="btn btn-xs btn-soft btn-default">
                    Edit
                  </button>
                  <button className="btn btn-xs btn-soft btn-error">
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TabelaM;
