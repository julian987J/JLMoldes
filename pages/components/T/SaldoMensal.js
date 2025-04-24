import React from "react";

const SaldoMensal = ({
  cor,
  data1,
  data2,
  titulo,
  titulo1,
  titulo2,
  dateKey1 = "data",
  dateKey2 = "data",
}) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) || 0);
  };

  const parseCurrency = (valorFormatado) => {
    if (typeof valorFormatado === "number") return valorFormatado;
    return (
      Number(valorFormatado.replace(/[^\d,-]/g, "").replace(",", ".")) || 0
    );
  };

  const processarMensal = (data, dateKey) => {
    const meses = Array(12).fill(0);

    data?.forEach((item) => {
      try {
        const date = new Date(item[dateKey]);
        const mes = date.getMonth();
        const valor = parseCurrency(item.valor);
        meses[mes] += valor;
      } catch (error) {
        console.error("Erro ao processar item:", item, error);
      }
    });

    return meses;
  };

  const valores1 = processarMensal(data1, dateKey1);
  const valores2 = processarMensal(data2, dateKey2);

  const saldosMensais = Array.from({ length: 12 }, (_, index) => ({
    mes: new Date(0, index)
      .toLocaleString("es-ES", { month: "short" })
      .replace(/^\w/, (c) => c.toUpperCase()),
    valor1: valores1[index],
    valor2: valores2[index],
    saldo: valores1[index] - valores2[index],
  }));

  const totalValor1 = valores1.reduce((a, b) => a + b, 0);
  const totalValor2 = valores2.reduce((a, b) => a + b, 0);
  const totalSaldo = totalValor1 - totalValor2;

  return (
    <div className={`overflow-x-auto rounded-box border border-${cor} w-full`}>
      <h1 className="text-center text-lg">{titulo}</h1>
      <div className="overflow-x-auto">
        <table className="table table-zebra table-sm md:table-md">
          {/* Cabeçalho */}
          <thead>
            <tr>
              <th className="text-left">Mês</th>
              <th className="text-right">{titulo1}</th>
              <th className="text-right">{titulo2}</th>
              <th className="text-right">Saldo</th>
            </tr>
          </thead>

          {/* Corpo */}
          <tbody>
            {saldosMensais.map(({ mes, valor1, valor2, saldo }) => (
              <tr key={mes}>
                <td className="font-bold">{mes}</td>
                <td className="text-right">{formatCurrency(valor1)}</td>
                <td className="text-right">{formatCurrency(valor2)}</td>
                <td
                  className={`text-right ${saldo < 0 ? "text-error" : "text-success"}`}
                >
                  {formatCurrency(saldo)}
                </td>
              </tr>
            ))}
          </tbody>

          {/* Rodapé */}
          <tfoot>
            <tr className="active">
              <th className="text-left">Total Anual:</th>
              <td className="text-right font-bold">
                {formatCurrency(totalValor1)}
              </td>
              <td className="text-right font-bold">
                {formatCurrency(totalValor2)}
              </td>
              <td
                className={`text-right font-bold ${totalSaldo < 0 ? "text-error" : "text-success"}`}
              >
                {formatCurrency(totalSaldo)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default SaldoMensal;
