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

function formatarData(dataStr) {
  const data = new Date(dataStr);

  return `${diasDaSemana[data.getDay()]} - ${String(data.getDate()).padStart(2, "0")}/${
    mesesAbreviados[data.getMonth()]
  }`;
}

function formatarDataHora(dataStr) {
  const data = new Date(dataStr);

  const diaSemana = diasDaSemana[data.getDay()];
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = mesesAbreviados[data.getMonth()];
  const hora = String(data.getHours()).padStart(2, "0");
  const minutos = String(data.getMinutes()).padStart(2, "0");

  return `${diaSemana} - ${dia}/${mes} - ${hora}:${minutos}`;
}

function NowData() {
  const data = new Date();
  const isoString = data.toISOString();
  const [dataParte, tempoParte] = isoString.split("T");
  const [tempo] = tempoParte.split(".");
  return `${dataParte} ${tempo}.000000+00`;
}

const use = {
  formatarDataHora,
  formatarData,
  NowData,
};

export default use;
