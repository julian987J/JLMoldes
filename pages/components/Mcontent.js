import { useState } from "react";
import TabelaM from "./TabelaM.js";
import CodigoVerifier from "./CodigoVerifier.js";
import Calculadora from "./Calculadora.js";

const Mcontent = () => {
  const [observacao, setObservacao] = useState("");
  const [dec, setDec] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [sis, setSis] = useState("");
  const [base, setBase] = useState("");
  const [alt, setAlt] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ordemInputValues = { observacao, codigo, dec, nome, sis, base, alt };

    try {
      const response = await fetch("/api/v1/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ordemInputValues),
      });

      if (!response.ok) throw new Error("Erro ao enviar os dados.");
      await response.json();

      setObservacao("");
      setDec("");
      setCodigo("");
      setNome("");
      setSis("");
      setBase("");
      setAlt("");
    } catch (error) {
      console.error("Erro ao enviar:", error);
    }
  };

  return (
    <div className="h-full">
      {/* Formulário */}
      <div className="bg-base-100 border-base-300 pb-2 px-[15%]">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Observações"
            className="input input-info input-xs"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="CODIGO"
            className="input input-info input-xs w-24"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="DEC"
            className="input input-info input-xs w-24"
            value={dec}
            maxLength={1} // Limita o número máximo de caracteres para 1
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (/^[A-Z]*$/.test(value)) {
                // Permite apenas letras
                setDec(value);
              }
            }}
            required
          />
          <input
            type="text"
            placeholder="Nome"
            className="input input-info input-xs"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Sis"
            className="input input-info input-xs w-24"
            value={sis}
            onChange={(e) => setSis(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Base"
            className="input input-info input-xs w-24"
            value={base}
            onChange={(e) => setBase(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Alt"
            className="input input-info input-xs w-24"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-xs btn-info">
            Enviar
          </button>
          <CodigoVerifier codigo={codigo} /> {/* Exibe a contagem ao lado */}
        </form>
      </div>

      {/* Tabelas */}
      <div className="columns-2">
        <TabelaM base="hidden" codigo={codigo} />
        <TabelaM sis="hidden" alt="hidden" codigo={codigo} />{" "}
      </div>
      <div className="divider divider-neutral">OFICINA</div>
      <div>
        <Calculadora />
      </div>
    </div>
  );
};

export default Mcontent;
