import React from "react";
import TabelaAnual from "./TabelaAnual.js";
import SaldoMensal from "./SaldoMensal";

const TcontentAnoModal = ({ anoData, ano }) => {
  if (!anoData) return null;

  // Parse JSON data from database
  const papelData = anoData.papel_data;
  const despesasData = anoData.despesas_data;
  const encaixesData = anoData.encaixes_data;
  const bobinasData = anoData.bobinas_data;

  return (
    <dialog id={`ano_modal_${ano}`} className="modal modal-top">
      <div className="modal-box max-w-[98%] mx-auto px-4 mt-4 rounded-t-xl pb-4">
        <h3 className="font-bold text-lg mb-4 text-center">
          Dados de {ano} - R: {anoData.r} - Oficina: {anoData.oficina}
        </h3>

        <div className="flex flex-col gap-3">
          {/* Primeira linha de tabelas */}
          <div className="flex flex-col md:flex-row gap-3">
            <TabelaAnual titulo="PAPEL" cor="warning" dados={papelData} />
            <SaldoMensal
              titulo="PAPEL - DESPESAS"
              data1={papelData}
              titulo1="Papel"
              data2={despesasData}
              titulo2="Despesas"
            />
            <TabelaAnual titulo="DESPESAS" cor="warning" dados={despesasData} />
          </div>

          {/* Segunda linha de tabelas */}
          <div className="flex flex-col md:flex-row gap-3">
            <TabelaAnual titulo="ENCAIXES" cor="success" dados={encaixesData} />
            <TabelaAnual titulo="BOBINAS" cor="info" dados={bobinasData} />
          </div>
        </div>
      </div>

      {/* Backdrop to close */}
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export default TcontentAnoModal;
