import React, { useEffect, useState } from "react";
import Execute from "models/functions";
import Edit from "../Edit";
import Use from "models/utils";

const formatCurrency = (value) => {
  const number = Number(value);
  return isNaN(number) ? "0.00" : number.toFixed(2);
};

const Coluna = () => {
  const [groupedResults, setGroupedResults] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const results = await Execute.reciveFromC1();

      const grouped = results.reduce((acc, item) => {
        // Remove a parte do horário da data
        const rawDate = Use.formatarData(item.data);
        acc[rawDate] = acc[rawDate] || [];
        acc[rawDate].push({
          ...item,
          valor: Number(item.valor) || 0,
          pix: Number(item.pix) || 0,
        });
        return acc;
      }, {});

      setGroupedResults(grouped);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Carrega os dados ao montar o componente
    const intervalId = setInterval(fetchData, 5000); // Atualiza a cada 5 segundos
    return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar o componente
  }, []);

  if (loading) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <div className="w-100 overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
      {Object.entries(groupedResults).map(([date, items]) => (
        <div key={date} className="mb-2">
          {/* Cabeçalho com a data */}
          <div className="font-bold text-sm bg-gray-200 text-center p-1">
            {date}
          </div>

          {/* Tabela para os itens da data */}
          <table className="table table-xs w-full">
            <thead>
              <tr>
                <th className="hidden">ID</th>
                <th className="hidden">Codigo</th>
                <th>Nome</th>
                <th>Base</th>
                <th>Sis</th>
                <th>Alt</th>
                <th>R$</th>
                <th>PIX</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-base-content/5">
                  <td className="hidden">{item.id}</td>
                  <td className="hidden">{item.codigo}</td>
                  <td>{item.nome}</td>
                  <td>{item.base}</td>
                  <td>{item.sis}</td>
                  <td>{item.alt}</td>
                  <td>{formatCurrency(item.real)}</td>
                  <td>{formatCurrency(item.pix)}</td>
                  <td>
                    <Edit data={item} />
                    <button className="btn btn-xs btn-error ml-2">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default Coluna;
