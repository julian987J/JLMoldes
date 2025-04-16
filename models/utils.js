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

// models/utils.js
export function formatarDataAno(dataString) {
  if (!dataString) return "—";
  const data = new Date(dataString);
  return `${String(data.getUTCDate()).padStart(2, "0")}/${String(data.getUTCMonth() + 1).padStart(2, "0")}/${data.getUTCFullYear()}`;
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
  formatarDataAno,
  NowData,
};

export default use;
