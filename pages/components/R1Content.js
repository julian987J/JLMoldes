import { useState, useEffect } from "react";
import Calculadora from "./Calculadora.js";
import BSTA from "./BSATable.js";

const R1content = () => {
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");

  // Busca nome quando código muda
  useEffect(() => {
    const fetchNome = async () => {
      if (!codigo) {
        setNome("");
        return;
      }

      try {
        const response = await fetch("/api/v1/tables/R1");
        if (!response.ok) throw new Error("Erro na busca");

        const data = await response.json();
        const item = data.rows.find((item) => item.codigo === codigo);
        setNome(item?.nome || "");
      } catch (error) {
        console.error("Falha ao buscar nome:", error);
      }
    };

    fetchNome();
  }, [codigo]);

  // Busca código quando nome muda
  useEffect(() => {
    const fetchCodigo = async () => {
      if (!nome) {
        setCodigo("");
        return;
      }

      try {
        const response = await fetch("/api/v1/tables/R1");
        if (!response.ok) throw new Error("Erro na busca");

        const data = await response.json();
        const item = data.rows.find((item) => item.nome === nome);
        setCodigo(item?.codigo || "");
      } catch (error) {
        console.error("Falha ao buscar código:", error);
      }
    };

    fetchCodigo();
  }, [nome]);

  return (
    <div>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <BSTA codigo={codigo} />
        </div>
        <div>
          <Calculadora
            codigo={codigo}
            nome={nome}
            onCodigoChange={setCodigo}
            onNomeChange={setNome}
          />
        </div>
      </div>
    </div>
  );
};

export default R1content;
