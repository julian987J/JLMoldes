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
      const results = await Execute.reciveFromPapelC1();

      const grouped = results.reduce((acc, item) => {
        // Formata a data removendo o horário
        const rawDate = Use.formatarData(item.data);
        acc[rawDate] = acc[rawDate] || [];
        acc[rawDate].push({
          ...item,
          real: Number(item.papelreal) || 0,
          pix: Number(item.papelpix) || 0,
          encaixereal: Number(item.encaixereal) || 0,
          encaixepix: Number(item.encaixepix) || 0,
          desperdicio: Number(item.desperdicio) || 0,
          util: Number(item.util) || 0,
          perdida: Number(item.perdida) || 0,
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
    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <div className="w-240 overflow-x-auto rounded-box border border-success bg-base-100">
      {Object.entries(groupedResults).map(([date, items]) => (
        <div key={date} className="mb-2">
          {/* Cabeçalho da data */}
          <div className="font-bold text-sm bg-success/20 text-center p-1">
            {date}
          </div>

          {/* Tabela para os itens da data */}
          <table className="table table-xs">
            <thead>
              <tr>
                <th className="hidden">ID</th>
                <th className="hidden">Codigo</th>
                <th>Nome</th>
                <th>M</th>
                <th>Papel</th>
                <th className="bg-accent">R$</th>
                <th className="bg-accent">PIX</th>
                <th className="bg-success">Enc-R$</th>
                <th className="bg-success">Enc-PIX</th>
                <th className="bg-warning-content/50">Des</th>
                <th className="bg-warning-content/50">Util</th>
                <th className="bg-warning-content/50">Perdida</th>
                <th>Comentarios</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-success">
                  <td className="hidden">{item.id}</td>
                  <td className="hidden">{item.codigo}</td>
                  <td>{item.nome}</td>
                  <td>{item.multi}</td>
                  <td>{item.papel}</td>
                  <td className="bg-accent/50">
                    {formatCurrency(item.papelreal)}
                  </td>
                  <td className="bg-accent/50">
                    {formatCurrency(item.papelpix)}
                  </td>
                  <td className="bg-success/50">
                    {formatCurrency(item.encaixereal)}
                  </td>
                  <td className="bg-success/50">
                    {formatCurrency(item.encaixepix)}
                  </td>
                  <td className="bg-warning-content/20">
                    {formatCurrency(item.desperdicio)}
                  </td>
                  <td className="bg-warning-content/20">{item.util}</td>
                  <td className="bg-warning-content/20">{item.perdida}</td>
                  <td>{item.comentarios}</td>
                  <td>
                    <Edit data={item} />
                    <button className="btn btn-xs btn-soft btn-error ml-2">
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
