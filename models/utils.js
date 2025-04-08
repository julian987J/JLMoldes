function formatarData(dataStr) {
  const data = new Date(dataStr);
  const diasDaSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const mesesAbreviados = [
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

  return `${diasDaSemana[data.getDay()]} - ${String(data.getDate()).padStart(2, "0")}/${
    mesesAbreviados[data.getMonth()]
  }`;
}

function NowData() {
  const data = new Date();
  const isoString = data.toISOString();
  const [dataParte, tempoParte] = isoString.split("T");
  const [tempo] = tempoParte.split(".");
  return `${dataParte} ${tempo}.000000+00`;
}

const use = {
  formatarData,
  NowData,
};

export default use;
