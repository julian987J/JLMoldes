import { useState, useEffect, useId } from "react";
import TabelaM from "./TabelaM.js";
import TableDec from "./TableDec.js";
import CodigoVerifier from "../CodigoVerifier.js";
import ErrorComponent from "../Errors.js";
import Rcontent from "../R/RContent.js";
import Config from "../Config.js";
import Notes from "./Notes.js";
import Alerta from "./Alertas.js";
import { useWebSocket } from "../../../contexts/WebSocketContext.js";

const Mcontent = ({ oficina, r }) => {
  const componentId = useId();
  const [cadastroItems, setCadastroItems] = useState([]);
  const [observacao, setObservacao] = useState("");
  const [dec, setDec] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [sis, setSis] = useState("");
  const [base, setBase] = useState("");
  const [alt, setAlt] = useState("");
  const [showError, setErrorCode] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  const { lastMessage } = useWebSocket();

  useEffect(() => {
    const fetchInitialCadastroData = async () => {
      try {
        const response = await fetch("/api/v1/tables/cadastro");
        if (!response.ok)
          throw new Error("Erro ao buscar dados iniciais de cadastro");
        const data = await response.json();
        setCadastroItems(Array.isArray(data.rows) ? data.rows : []);
      } catch (error) {
        console.error("Erro ao buscar dados iniciais de cadastro:", error);
        setCadastroItems([]);
      }
    };
    fetchInitialCadastroData();
  }, []);

  useEffect(() => {
    if (lastMessage && lastMessage.data) {
      const { type, payload } = lastMessage.data;

      if (type === "CADASTRO_NEW_ITEM" && payload) {
        setCadastroItems((prevItems) => {
          if (prevItems.find((item) => item.id === payload.id)) {
            return prevItems.map((item) =>
              item.id === payload.id ? payload : item,
            );
          }
          return [...prevItems, payload];
        });
      } else if (type === "CADASTRO_UPDATED_ITEM" && payload) {
        setCadastroItems((prevItems) =>
          prevItems.map((item) =>
            item.id === payload.id ? { ...item, ...payload } : item,
          ),
        );
      }
    }
  }, [lastMessage]);

  const handleCodigoChange = (e) => {
    const newCodigo = e.target.value;
    setCodigo(newCodigo);

    const codigoBuscado = newCodigo.trim().toUpperCase();
    if (!codigoBuscado) {
      setNome("");
      setObservacao("");
      return;
    }

    const registro = cadastroItems.find(
      (item) => item.codigo?.toString().trim().toUpperCase() === codigoBuscado,
    );

    if (registro) {
      setNome(registro.nome || "");
      setObservacao(registro.observacao || "");
    } else {
      setNome("");
      setObservacao("");
    }
  };

  const handleNomeChange = (e) => {
    const newNome = e.target.value;
    setNome(newNome);

    if (newNome.length > 0) {
      const suggestions = cadastroItems
        .filter(
          (item) =>
            item.nome &&
            item.nome.toLowerCase().includes(newNome.toLowerCase()),
        )
        .map((item) => item.nome);
      setFilteredSuggestions(suggestions);
    } else {
      setFilteredSuggestions([]);
    }

    const nomeBuscado = newNome.trim().toLowerCase();
    if (!nomeBuscado) {
      setCodigo("");
      setObservacao("");
      return;
    }

    const registro = cadastroItems.find(
      (item) => item.nome?.trim().toLowerCase() === nomeBuscado,
    );

    if (registro) {
      setCodigo(registro.codigo?.toString() || "");
      setObservacao(registro.observacao || "");
    } else {
      setCodigo("");
      setObservacao("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ordemInputValues = {
      oficina,
      observacao,
      codigo,
      dec,
      nome,
      sis,
      base,
      alt,
    };

    // Condição para separar os dados em duas tabelas
    let hasInserted = false;

    // Se todos os valores forem 0, exibe o erro e interrompe a execução
    if (parseInt(base) === 0 && parseInt(sis) === 0 && parseInt(alt) === 0) {
      setErrorCode("");
      setTimeout(() => {
        setErrorCode("000BSA"); // Define um novo código de erro depois de um pequeno delay
      }, 0);
    } else {
      setErrorCode("");
      if (parseInt(base) > 0) {
        try {
          const responseBase = await fetch("/api/v1/tables", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              oficina,
              observacao,
              codigo,
              dec,
              nome,
              sis: 0,
              base,
              alt: 0,
            }),
          });

          if (!responseBase.ok)
            throw new Error("Erro ao enviar os dados para a tabela 'base'.");
          await responseBase.json();
          hasInserted = true; // Marca que pelo menos uma inserção foi feita
        } catch (error) {
          console.error("Erro ao enviar base:", error);
        }
      }

      if (parseInt(sis) > 0 || parseInt(alt) > 0) {
        try {
          const responseSisAlt = await fetch("/api/v1/tables", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              oficina,
              observacao,
              codigo,
              dec,
              nome,
              sis,
              base: 0,
              alt,
            }),
          });

          if (!responseSisAlt.ok)
            throw new Error("Erro ao enviar os dados para a tabela 'sis_alt'.");
          await responseSisAlt.json();
          hasInserted = true; // Marca que pelo menos uma inserção foi feita
        } catch (error) {
          console.error("Erro ao enviar sis_alt:", error);
        }
      }

      // Se nenhum dado foi inserido antes, faz o envio para a tabela padrão
      if (!hasInserted) {
        try {
          const response = await fetch("/api/v1/tables", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ordemInputValues),
          });

          if (!response.ok) throw new Error("Erro ao enviar os dados.");
          await response.json();
        } catch (error) {
          console.error("Erro ao enviar:", error);
        }
      }

      // Limpa os campos após o envio
      setObservacao("");
      setDec("");
      setCodigo("");
      setNome("");
      setSis("");
      setBase("");
      setAlt("");
    }
  };

  return (
    <div className="h-full">
      <div className="flex flex-nowrap items-center bg-base-100 border-base-300 pb-2 gap-2 mx-[6%]">
        <Alerta />
      </div>
      <div className="flex flex-nowrap items-center bg-base-100 border-base-300 pb-2 gap-2 mx-[6%]">
        <Notes r={r} />
        <form
          onSubmit={handleSubmit}
          className="flex flex-nowrap items-center gap-2"
        >
          <input
            type="text"
            placeholder="Observações"
            className="input input-info input-xs w-80"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
          <input
            type="text"
            placeholder="CODIGO"
            className="input input-info input-xs w-24"
            value={codigo}
            onChange={handleCodigoChange}
          />
          <input
            type="text"
            placeholder="DEC"
            required
            className="input input-info input-xs w-24"
            value={dec}
            maxLength={1} // Limita o número máximo de caracteres para 1
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (/^[A-Z]*$/.test(value)) {
                setDec(value);
              }
            }}
          />
          <div>
            <input
              type="text"
              placeholder="Nome"
              className="input input-info input-xs"
              value={nome}
              autoComplete="off"
              list={`m-name-suggestions-${componentId}`}
              onChange={handleNomeChange}
            />
            <datalist id={`m-name-suggestions-${componentId}`}>
              {filteredSuggestions.map((suggestion, index) => (
                <option key={index} value={suggestion} />
              ))}
            </datalist>
          </div>
          <input
            type="number"
            required
            placeholder="Base"
            className="input input-info input-xs w-24"
            value={base}
            onChange={(e) => setBase(e.target.value)}
          />
          <input
            type="number"
            required
            placeholder="Sis"
            className="input input-info input-xs w-24"
            value={sis}
            onChange={(e) => setSis(e.target.value)}
          />
          <input
            type="number"
            required
            placeholder="Alt"
            className="input input-info input-xs w-24"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
          />
          <button type="submit" className="btn btn-xs btn-info">
            Enviar
          </button>
          <CodigoVerifier codigo={codigo} r={r} />
        </form>
        <Config />
      </div>
      <div className="grid grid-cols-[2fr_2fr_1fr] gap-2">
        <TabelaM
          oficina={oficina}
          r={r}
          filterType="alt_sis" // Para a tabela que mostra sis > 0 ou alt > 0
          columnsConfig={[
            { field: "sis", label: "Sis", min: 1 },
            { field: "alt", label: "Alt", min: 1 },
          ]}
          filterCondition={(item) => item.sis > 0 || item.alt > 0}
        />
        <TabelaM
          oficina={oficina}
          r={r}
          filterType="base" // Para a tabela que mostra base > 0
          secondaryEndpoint="tables/R" // Mantido se necessário para o handleSave
          columnsConfig={[{ field: "base", label: "Base", min: 0 }]}
          filterCondition={(item) => item.base > 0}
        />
        <TableDec r={r} />
      </div>
      <div className="divider divider-neutral">OFICINA</div>
      <div>
        <Rcontent codigoExterno={codigo} r={r} />
      </div>

      {showError && <ErrorComponent errorCode="000BSA" />}
    </div>
  );
};

export default Mcontent;
