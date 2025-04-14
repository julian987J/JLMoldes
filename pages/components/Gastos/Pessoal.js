import React, { useEffect, useState } from "react";
import Edit from "../Edit.js";
import Execute from "models/functions.js";
import Use from "models/utils.js";

const Pessoal = ({ letras }) => {
  const [data, setData] = useState([]);
  const [item, setItem] = useState("");
  const [quantidade, setQuantidade] = useState();
  const [unidade, setUnidade] = useState();
  const [valor, setValor] = useState();
  const [gastos, setGastos] = useState("");
  const [pago, setPago] = useState("");
  const [proximo, setProximo] = useState("");

  const fetchData = async () => {
    try {
      const results = await Execute.receiveFromPessoal(letras);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    await Execute.sendToPessoal(
      letras,
      item,
      quantidade,
      unidade,
      valor,
      gastos,
      pago,
      proximo,
    );

    setItem("");
    setQuantidade("");
    setUnidade("");
    setValor("");
    setGastos("");
    setPago("");
    setProximo("");
  };

  return (
    <>
      <div className="overflow-x-auto rounded-box border border-primary bg-base-100">
        <h1 className="text-center w-full">PESSOAL</h1>
        <form onSubmit={handleSubmit} className="flex gap-2 p-2">
          <input
            type="text"
            placeholder="Item"
            className="input input-info input-xs"
            value={item}
            onChange={(e) => setItem(e.target.value)}
          />
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
            className="input input-success input-xs"
            value={pago}
            onChange={(e) => setPago(e.target.value)}
          />
          <input
            type="date"
            required
            placeholder="Proximo"
            className="input input-warning input-xs"
            value={proximo}
            onChange={(e) => setProximo(e.target.value)}
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
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((entry) =>
              entry.isFirst ? (
                // Primeira linha do grupo com rowSpan
                <tr key={entry.id}>
                  <td className="hidden">{entry.id}</td>
                  <td rowSpan={entry.rowSpan}>{entry.item}</td>
                  <td>{entry.quantidade}</td>
                  <td>{entry.unidade}</td>
                  <td>{entry.valor}</td>
                  <td>{entry.gastos}</td>
                  <td>{Use.formatarDataAno(entry.pago)}</td>
                  <td>{Use.formatarDataAno(entry.proximo)}</td>
                  <td>
                    <Edit />
                    <button className="btn btn-xs btn-soft btn-error">
                      Excluir
                    </button>
                  </td>
                </tr>
              ) : (
                // Linhas subsequentes do grupo sem a célula Item
                <tr key={entry.id}>
                  <td className="hidden">{entry.id}</td>
                  <td>{entry.quantidade}</td>
                  <td>{entry.unidade}</td>
                  <td>{entry.valor}</td>
                  <td>{entry.gastos}</td>
                  <td>{Use.formatarDataAno(entry.pago)}</td>
                  <td>{Use.formatarDataAno(entry.proximo)}</td>
                  <td>
                    <Edit />
                    <button className="btn btn-xs btn-soft btn-error">
                      Excluir
                    </button>
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

export default Pessoal;
