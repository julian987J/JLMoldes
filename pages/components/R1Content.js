import { useState, useEffect, useRef } from "react";
import Calculadora from "./Calculadora.js";
import BSTA from "./BSATable.js";

const R1content = ({ codigoExterno }) => {
  // Referência para o valor de codigoExterno, para garantir que não altere depois de passado
  const codigoExternoRef = useRef(codigoExterno);

  // Se o codigoExterno for passado, não alteramos o estado de codigo
  const [codigo, setCodigo] = useState(codigoExterno || "");
  const [nome, setNome] = useState("");

  useEffect(() => {
    // Atualizando a referência se codigoExterno mudar
    if (codigoExterno !== codigoExternoRef.current) {
      codigoExternoRef.current = codigoExterno;
      setCodigo(codigoExterno || ""); // Se o codigoExterno for vazio, mantemos o código vazio
    }
  }, [codigoExterno]);

  // Busca nome quando código muda
  useEffect(() => {
    const fetchNome = async () => {
      if (!codigo) {
        setNome(""); // Se o código for vazio, limpa o nome
        return;
      }

      try {
        const response = await fetch("/api/v1/tables/R1");
        if (!response.ok) throw new Error("Erro na busca");

        const data = await response.json();
        const item = data.rows.find((item) => item.codigo === codigo);
        setNome(item?.nome || ""); // Se não encontrar o nome, fica vazio
      } catch (error) {
        console.error("Falha ao buscar nome:", error);
      }
    };

    fetchNome();
  }, [codigo]); // A dependência é o 'codigo', pois a busca do nome depende dele

  // Busca código quando nome muda
  useEffect(() => {
    const fetchCodigo = async () => {
      if (!nome) {
        setCodigo(""); // Se o nome for vazio, limpa o código
        return;
      }

      try {
        const response = await fetch("/api/v1/tables/R1");
        if (!response.ok) throw new Error("Erro na busca");

        const data = await response.json();
        const item = data.rows.find((item) => item.nome === nome);
        setCodigo(item?.codigo || ""); // Se não encontrar o código, fica vazio
      } catch (error) {
        console.error("Falha ao buscar código:", error);
      }
    };

    fetchCodigo();
  }, [nome]); // A dependência é o 'nome', pois a busca do código depende dele

  // Atualizando o estado 'codigo' ou 'nome' diretamente
  const handleCodigoChange = (novoCodigo) => {
    if (!codigoExternoRef.current) {
      setCodigo(novoCodigo); // Só altera o código se codigoExterno não estiver definido
    }
  };

  const handleNomeChange = (novoNome) => {
    setNome(novoNome);
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <BSTA codigo={codigo} />
        </div>
        <div>
          <Calculadora
            onCodigoChange={handleCodigoChange} // Passando a função de alteração para a Calculadora
            onNomeChange={handleNomeChange} // Passando a função de alteração para a Calculadora
          />
        </div>
      </div>
    </div>
  );
};

export default R1content;
