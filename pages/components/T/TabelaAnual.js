import React, { useMemo } from "react";

const Tabela = ({ titulo, cor, dados }) => {
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const dadosPorDiaMes = useMemo(() => {
    const lookup = {};

    if (!Array.isArray(dados)) {
      console.error(
        "TabelaAnual: A prop 'dados' não é um array ou está ausente.",
      );
      return lookup;
    }

    dados.forEach((item) => {
      if (!item || !item.data) {
        console.error(
          "TabelaAnual: Item inválido ou sem propriedade 'data' em 'dados':",
          item,
        );
        return; // Pula item inválido
      }

      try {
        const date = new Date(item.data + "T00:00:00");

        if (isNaN(date.getTime())) {
          console.error(
            `TabelaAnual: Formato de data inválido para o item:`,
            item,
          );
          return;
        }

        const monthIndex = date.getMonth();
        const day = date.getDate();

        if (!lookup[monthIndex]) {
          lookup[monthIndex] = {};
        }

        lookup[monthIndex][day] = item.valor !== undefined ? item.valor : "";
      } catch (error) {
        console.error(
          `TabelaAnual: Erro ao processar data para o item:`,
          item,
          error,
        );
      }
    });
    return lookup;
  }, [dados]);

  return (
    <div className={`overflow-x-auto rounded-box border border-${cor} w-full`}>
      <h1 className="text-center text-lg">{titulo}</h1>
      <table className="table table-xs">
        <thead>
          <tr>
            <th>Dia</th>
            {months.map((month, index) => (
              <th key={index} className="text-center text-xs">
                {month}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {days.map((day) => (
            <tr
              key={day}
              className={`divide-x divide-base-300 hover:bg-gray-50`}
            >
              <th>{day}</th>

              {months.map((_, monthIndex) => {
                const valorCelula = dadosPorDiaMes[monthIndex]?.[day] ?? "";

                return (
                  <td
                    key={`${day}-${monthIndex}`}
                    className="text-center text-xs"
                  >
                    {valorCelula}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Tabela;
