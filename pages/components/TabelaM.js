import React, { useEffect, useState } from "react";

const TabelaM = ({ sis, base, alt, codigo }) => {
  const [dados, setDados] = useState([]);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/v1/tables"); // URL correta para o endpoint
      if (!response.ok) throw new Error("Erro ao carregar os dados");
      const data = await response.json();

      if (Array.isArray(data.rows)) {
        // Ordenação primeiro por DEC (alfabética) e depois por Data (cronológica dentro do grupo)
        const sortedData = data.rows.sort((a, b) => {
          if (a.dec !== b.dec) return a.dec.localeCompare(b.dec); // Ordena DEC A-Z
          return new Date(a.data) - new Date(b.data); // Dentro do grupo, ordena por data
        });

        setDados(sortedData);
      } else {
        console.error("Formato de resposta inesperado:", data);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  useEffect(() => {
    fetchData(); // Carrega os dados ao montar o componente
    const intervalId = setInterval(fetchData, 5000); // Atualiza a cada 5 segundos
    return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar o componente
  }, []);

  async function deleteM1TableRecord(id) {
    const response = await fetch("/api/v1/tables", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }), // Envia o `id` no corpo da requisição
    });

    const result = await response.json();
    console.log(result);
  }

  // Função para formatar a data
  const formatarData = (dataStr) => {
    const data = new Date(dataStr);
    const dia = String(data.getDate()).padStart(2, "0");
    const mesesAbreviados = [
      "jan",
      "fev",
      "mar",
      "abr",
      "mai",
      "jun",
      "jul",
      "ago",
      "set",
      "out",
      "nov",
      "dez",
    ];
    const mes = mesesAbreviados[data.getMonth()];
    const horas = String(data.getHours()).padStart(2, "0");
    const minutos = String(data.getMinutes()).padStart(2, "0");
    return `${dia}/${mes} ${horas}:${minutos}`;
  };

  // Agrupar os dados por DEC
  const groupedData = dados.reduce((acc, item) => {
    if (!acc[item.dec]) acc[item.dec] = [];
    acc[item.dec].push(item);
    return acc;
  }, {});

  return (
    <div>
      <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
        <table className="table table-xs">
          <thead>
            <tr>
              <th className="hidden">ID</th>
              <th>Data</th>
              <th>Descrição</th>
              <th className="hidden">CODIGO</th>
              <th>DEC</th>
              <th>Nome</th>
              <th className={sis}>Sis</th>
              <th className={base}>Base</th>
              <th className={alt}>Alt</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(groupedData).map((decKey) => (
              <React.Fragment key={decKey}>
                {/* Linha de separação para o grupo */}
                <tr className="bg-gray-200 font-bold">
                  <td colSpan="8" className="text-center">
                    GRUPO: {decKey}
                  </td>
                </tr>
                {groupedData[decKey].map((item) => (
                  <tr
                    key={item.id}
                    className={item.codigo === codigo ? "bg-green-200" : ""}
                  >
                    <td className="hidden">{item.id}</td>
                    <td>{formatarData(item.data)}</td>
                    <td>{item.descricao}</td>
                    <td className="hidden">{item.codigo}</td>
                    <td>{item.dec}</td>
                    <td>{item.nome}</td>
                    <td className={sis}>{item.sis}</td>
                    <td className={base}>{item.base}</td>
                    <td className={alt}>{item.alt}</td>
                    <td>
                      <button className="btn btn-xs btn-soft btn-warning">
                        R1
                      </button>
                      <button className="btn btn-xs btn-soft btn-primary">
                        R2
                      </button>
                      <button className="btn btn-xs btn-soft btn-info">
                        R3
                      </button>
                      <button className="btn btn-xs btn-soft btn-secondary">
                        M1
                      </button>
                      <button className="btn btn-xs btn-soft btn-default">
                        Edit
                      </button>
                      <button
                        className="btn btn-xs btn-soft btn-error"
                        onClick={() => deleteM1TableRecord(item.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TabelaM;
