import React, { useEffect, useState } from "react";
import Execute from "models/functions";
import Use from "models/utils";

const BSA = ({ codigo, r }) => {
  const [dados, setDados] = useState([]);
  const loadData = async () => {
    const data = await Execute.receiveFromR(r);
    setDados(data.sort((a, b) => new Date(a.data) - new Date(b.data)));
  };

  useEffect(() => {
    loadData(); // Busca inicial

    const intervalId = setInterval(loadData, 5000); // Atualiza a cada 5s
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Busca imediatamente quando o código muda
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo]);

  return (
    <div className="overflow-x-auto rounded-box border border-warning bg-base-100">
      <table className="table table-xs">
        <thead>
          <tr>
            <th className="hidden">ID</th>
            <th className="w-36">Data</th>
            <th className="hidden">CODIGO</th>
            <th className="text-center">Dec</th>
            <th>Nome</th>
            <th className="w-10 text-center">Base</th>
            <th className="w-10 text-center">Sis</th>
            <th className="w-10 text-center">Alt</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((item) => (
            <tr
              key={item.id}
              className={
                item.codigo === codigo
                  ? "bg-green-200"
                  : "border-b border-warning"
              }
            >
              <td className="hidden">{item.id}</td>
              <td>{Use.formatarData(item.data)}</td>
              <td className="hidden">{item.codigo}</td>
              <td className="text-center">{item.dec}</td>
              <td>{item.nome}</td>
              <td className="text-center">{Number(item.base).toFixed(2)}</td>
              <td className="text-center">{Number(item.sis).toFixed(2)}</td>
              <td className="text-center">{Number(item.alt).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BSA;
