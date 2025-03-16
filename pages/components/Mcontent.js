import TabelaM from "./TabelaM.js";
import { useState } from "react";

const Mcontent = () => {
  const [descricao, setDescricao] = useState("");
  const [dec, setDec] = useState("");
  const [nome, setNome] = useState("");
  const [sis, setSis] = useState("");
  const [base, setBase] = useState("");
  const [alt, setAlt] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      data: new Date().toISOString().split("T")[0], // Adicione a data atual ou modifique conforme necessário
      descricao,
      dec,
      nome,
      sis,
      base,
      alt,
    };

    try {
      const response = await fetch("/api/v1/migrations/POSTm1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("Dados enviados com sucesso!");
        // Limpar os campos após o envio
        setDescricao("");
        setDec("");
        setNome("");
        setSis("");
        setBase("");
        setAlt("");
      } else {
        alert("Erro ao enviar dados.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar dados.");
    }
  };
  return (
    <div>
      {/* Formulario Enviar */}
      <div className="bg-base-100 border-base-300 px-[18%]">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Descrição"
            className="input input-info input-xs"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="DEC"
            className="input input-info input-xs w-24"
            value={dec}
            onChange={(e) => setDec(e.target.value)}
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
          <input
            type="number"
            placeholder="Código"
            className="input input-success input-xs w-24"
          />
        </form>
      </div>
      {/* Tabela de ações */}
      <div className="columns-2">
        <TabelaM />
        <TabelaM />
      </div>
    </div>
  );
};

export default Mcontent;
