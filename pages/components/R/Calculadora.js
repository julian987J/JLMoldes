import Execute from "models/functions";
import { useState, useEffect, useId, useCallback } from "react";
import dynamic from "next/dynamic";
import { useWebSocket } from "../../../contexts/WebSocketContext.js"; // Import WebSocket context
import Use from "models/utils.js";

function round(value) {
  return Math.round(value * 100) / 100;
}

function roundToHalf(value) {
  return Math.round(value / 0.5) * 0.5;
}

function gerarCodigoUnico() {
  // Combina o timestamp atual com uma string aleatória para garantir unicidade.
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10).toUpperCase()
  );
}

const Calculadora = ({
  plus,
  values = Array(28).fill(""), // Provide a default value for values
  onPlusChange, // Recebido como prop
  onValuesChange, // Recebido como prop
  data,
  r,
  isPendente,
  codigo,
  nome,
  onCodigoChange,
  onNomeChange,
}) => {
  const ErrorComponent = dynamic(() => import("../Errors.js"), { ssr: false });
  const [showError, setShowError] = useState(false);
  const [errorCode, setErrorCode] = useState(null);
  const componentId = useId();

  useEffect(() => {
    setShowError(false); // Resetar no cliente após a montagem
  }, []);

  // Efeito para esconder o erro após 5 segundos
  useEffect(() => {
    let timer;
    if (showError) {
      timer = setTimeout(() => setShowError(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [showError]);

  useEffect(() => {
    if (errorCode) {
      const timer = setTimeout(() => {
        setErrorCode(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorCode]);

  const [dadosR, setDadosR] = useState(0);
  const [idsArray, setIdsArray] = useState([]);
  const [rBsaUidsArray, setRBsaUidsArray] = useState([]);
  const [decGroups, setDecGroups] = useState([]);

  const [valorDevo, setValorDevo] = useState(0);
  const [valorDeve, setValorDeve] = useState(0);
  const [deveIdsArray, setDeveIdsArray] = useState([]);
  const [multiplier, setMultiplier] = useState(0);
  const [comissi, setComissi] = useState(0);
  const [desperdicio, setDesperdicio] = useState(0);
  // const [plus, setPlus] = useState(0); // Removido, agora é prop
  // const [values, setValues] = useState(Array(28).fill("")); // Removido, agora é prop
  const [pix, setPix] = useState("");
  const [real, setReal] = useState("");
  const { lastMessage } = useWebSocket(); // Use WebSocket
  const [comentario, setComentario] = useState("");
  const [perdida, setPerdida] = useState("");
  const [comentarioCadastro, setComentarioCadastro] = useState("");
  const [gastoOficina, setGastoOficina] = useState("");
  const [valorOficina, setValorOficina] = useState("");

  const [allCadastroNames, setAllCadastroNames] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  const [isSalvarDisabled, setIsSalvarDisabled] = useState(false);
  const [isPendenteDisabled, setIsPendenteDisabled] = useState(false);
  const [isEsperaDisabled, setIsEsperaDisabled] = useState(false);
  const [trocoReal, setTrocoReal] = useState("");
  const [nomeInputClass, setNomeInputClass] = useState("input-warning");
  const [somaTotalInputClass, setSomaTotalInputClass] = useState(
    "input-success text-success",
  );

  useEffect(() => {
    const checkOldestDebt = async () => {
      if (!codigo || !r) {
        setNomeInputClass("input-warning");
        setSomaTotalInputClass("input-success text-success");
        return;
      }

      try {
        const allDeveData = await Execute.receiveFromDeve(r);
        const userDeveData = allDeveData.filter(
          (item) => item.codigo === codigo,
        );

        if (userDeveData.length === 0) {
          setNomeInputClass("input-warning");
          setSomaTotalInputClass("input-success text-success");
          return;
        }

        const oldestDate = userDeveData.reduce((oldest, current) => {
          const currentDate = new Date(current.data);
          return currentDate < oldest ? currentDate : oldest;
        }, new Date(userDeveData[0].data));

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        if (oldestDate < twoMonthsAgo) {
          setNomeInputClass("input-error bg-error/30");
          setSomaTotalInputClass("input-error bg-error/30 text-error");
        } else if (oldestDate < oneMonthAgo) {
          setNomeInputClass("input-secondary bg-secondary/30");
          setSomaTotalInputClass(
            "input-secondary bg-secondary/30 text-secondary",
          );
        } else {
          setNomeInputClass("input-warning");
          setSomaTotalInputClass("input-success text-success");
        }
      } catch (error) {
        console.error("Erro ao verificar dívidas antigas:", error);
        setNomeInputClass("input-warning");
        setSomaTotalInputClass("input-success text-success");
      }
    };

    if (!codigo && !nome) {
      setNomeInputClass("input-warning");
      setSomaTotalInputClass("input-success text-success");
    } else {
      checkOldestDebt();
    }
  }, [codigo, nome, r, lastMessage]);

  // Estados para a nova funcionalidade de papel
  const [papeis, setPapeis] = useState([]);
  const [oldestPapel, setOldestPapel] = useState(null);
  const [plotterData, setPlotterData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (typeof r === "undefined" || r === null) return;
      try {
        const workshop = "R" + r;
        const [plotterResults, papelResults] = await Promise.all([
          Execute.receiveFromPlotterC(r),
          Execute.receiveFromPapelByItem(workshop),
        ]);

        setPlotterData(
          Array.isArray(plotterResults)
            ? plotterResults
                .filter((item) => !item.dtfim)
                .sort(
                  (a, b) =>
                    new Date(b.data) - new Date(a.data) ||
                    new Date(b.inicio) - new Date(a.inicio),
                )
            : [],
        );

        if (Array.isArray(papelResults)) {
          const filteredPapeis = papelResults
            .filter((p) => p.gastos && p.gastos.startsWith("PAPEL-"))
            .sort((a, b) => a.id - b.id); // Sort ascending by ID
          setPapeis(filteredPapeis);
        } else {
          setPapeis([]);
        }
      } catch (error) {
        console.error("Erro ao buscar dados de papel e plotter:", error);
      }
    };
    fetchData();
  }, [r]);

  useEffect(() => {
    if (papeis && papeis.length > 0) {
      setOldestPapel(papeis[0]);
    } else {
      setOldestPapel(null);
    }
  }, [papeis]);

  const handleCodigoChange = (e) => {
    const newCodigo = e.target.value;
    onCodigoChange(newCodigo);

    const codigoBuscado = newCodigo.trim();
    if (!codigoBuscado) {
      onNomeChange("");
      return;
    }

    const registro = allCadastroNames.find(
      (item) => item.codigo?.toString().trim() === codigoBuscado,
    );

    if (registro) {
      onNomeChange(registro.nome || "");
    } else {
      onNomeChange("");
    }
  };

  const handleNomeChange = (e) => {
    const newNome = e.target.value;
    onNomeChange(newNome);

    if (newNome.length > 0) {
      const suggestions = allCadastroNames
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
      onCodigoChange("");
      return;
    }

    const registro = allCadastroNames.find(
      (item) => item.nome?.trim().toLowerCase() === nomeBuscado,
    );

    if (registro) {
      onCodigoChange(registro.codigo?.toString() || "");
    } else {
      onCodigoChange("");
    }
  };

  const resetForm = useCallback(() => {
    setPix("");
    onPlusChange(0);
    setReal("");
    setComentario("");
    setPerdida("");
    setTrocoReal("");
    onNomeChange("");
    onCodigoChange("");
    onValuesChange(Array(28).fill(""));
    setGastoOficina(""); // Resetar também estes campos
    setValorOficina(""); // Resetar também estes campos
  }, [onPlusChange, onValuesChange, onNomeChange, onCodigoChange]);

  // Calcula a soma bruta dos valores (novo cálculo)
  const sumValues = values.reduce((sum, current) => {
    const num = current === "" ? 0 : Number(current);
    return sum + num;
  }, 0);

  const handleMultiplierChange = (e) => {
    setMultiplier(Number(e.target.value));
  };
  const handlePlusChange = (e) => {
    const inputValue = e.target.value;
    if (inputValue === "") {
      onPlusChange(null); // Send null for empty
    } else {
      const numericValue = parseFloat(inputValue);
      onPlusChange(isNaN(numericValue) ? null : numericValue);
    }
  };

  const handleValueChange = (index, e) => {
    const newValue = e.target.value;
    const newValues = [...values]; // Usa o 'values' do prop
    newValues[index] = newValue;
    onValuesChange(newValues); // Usa o handler do prop
  };

  const handleHalfStepChange = (setter) => (e) => {
    const value = e.target.value;
    // Permite números inteiros, números terminados em ".", ou números terminados em ".5"
    if (/^\d*(\.5?)?$/.test(value) || value === "") {
      setter(value);
    }
  };

  // calculos da calculadora
  const comitions = plus * comissi;
  const papel = values.some((val) => val !== "")
    ? values.reduce((sum, current) => {
        const num = current === "" ? 0 : Number(current);
        return sum + num * multiplier;
      }, 0)
    : 0;

  const total = papel + comitions;

  const totalGeral =
    (Number(dadosR) || 0) +
    sumValues * multiplier -
    valorDevo +
    valorDeve +
    comitions;

  // Calculate the display value for totalGeral according to the new rounding rules
  const roundedTotalGeral = roundToHalf(totalGeral);
  const displayTotalGeral =
    roundedTotalGeral === 0 ? "SOMA TOTAL" : roundedTotalGeral.toFixed(2);

  const roundedPix = roundToHalf(Number(pix) || 0);
  const roundedReal = roundToHalf(Number(real) || 0);

  const totalTroco =
    roundedTotalGeral - roundedPix - roundedReal + (Number(trocoReal) || 0);
  const roundedTroco = roundToHalf(totalTroco);

  const pixMaisReal = roundedPix + roundedReal;
  // Buscar dados R agrupados por dec
  useEffect(() => {
    const buscarDados = async () => {
      try {
        const resultado = await Execute.receiveFromRJustBSA(codigo, r);

        const groups = resultado.map((group) => ({
          dec: group.dec,
          base: Number(group.total_base) || 0,
          sis: Number(group.total_sis) || 0,
          alt: Number(group.total_alt) || 0,
          ids: group.ids || [],
          uids: group.uids || [],
        }));

        setDecGroups(groups);
        setDadosR(groups.reduce((sum, g) => sum + g.base + g.sis + g.alt, 0));
        setIdsArray(groups.flatMap((g) => g.ids));
      } catch (error) {
        console.error("Erro:", error);
        setDecGroups([]);
        setDadosR(0);
        setIdsArray([]);
      }
    };
    buscarDados();
  }, [codigo, r]);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        // Garante que codigo e r estão presentes antes de buscar
        if (!codigo || !r) {
          setValorDeve(0);
          setDeveIdsArray([]);
          // console.log("valorDeve/deveIds: codigo ou r ausente, definindo para padrões");
          return;
        }
        const resultado = await Execute.receiveFromDeveJustValor(codigo, r);

        const somaTotal = Number(resultado.total_valor || 0);
        const ids = resultado.deveids || [];

        setValorDeve(somaTotal);
        setDeveIdsArray(ids);
      } catch (error) {
        console.error(
          `Erro ao buscar valorDeve/deveIds para codigo: ${codigo}, r: ${r}:`,
          error,
        );
        setValorDeve(0);
        setDeveIdsArray([]);
      }
    };
    buscarDados();
  }, [codigo, r]);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const resultado = await Execute.receiveFromDevoJustValor(codigo, r);

        // Soma todos os valores
        const somaTotal = Number(resultado.total_valor || 0);

        setValorDevo(somaTotal);
      } catch (error) {
        console.error("Erro:", error);
        setValorDevo(0);
      }
    };
    buscarDados();
  }, [codigo, r]);

  useEffect(() => {
    const fetchData = async () => {
      const dataConfig = await Execute.receiveFromConfig();

      if (dataConfig.length > 0) {
        setMultiplier(dataConfig[0].m);
        setDesperdicio(dataConfig[0].d);
        setComissi(dataConfig[0].e);
      }
    };
    fetchData();
    // Polling removed, WebSocket will handle updates
    // const intervalId = setInterval(fetchData, 5000);
    // return () => clearInterval(intervalId);
  }, []);

  // useEffect to handle config updates from WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.data) {
      const { type, payload } = lastMessage.data;
      if (type === "CONFIG_UPDATED_ITEM" && payload) {
        const configData = Array.isArray(payload) ? payload[0] : payload;
        if (configData) {
          setMultiplier(configData.m);
          setDesperdicio(configData.d);
          setComissi(configData.e);
        }
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    const fetchComentarioFromCadastro = async () => {
      // If both codigo and nome are empty, clear comment and exit
      if (!codigo && !nome) {
        setComentarioCadastro("");
        return;
      }

      try {
        const cadastroItems = await Execute.receiveFromCad(codigo);

        let foundItem = null;
        if (codigo) {
          foundItem = cadastroItems.find((item) => item.codigo === codigo);
        }

        if (!foundItem && nome) {
          foundItem = cadastroItems.find((item) => item.nome === nome);
        }

        setComentarioCadastro(foundItem?.comentario || "");
      } catch (error) {
        console.error(
          "Calculadora: Erro ao buscar comentário do cadastro:",
          error,
        );
        setComentarioCadastro("");
      }
    };
    fetchComentarioFromCadastro();
  }, [codigo, nome]);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (lastMessage && lastMessage.data) {
      const { type, payload } = lastMessage.data;

      // Listener for R updates
      if (type.startsWith("BSA_")) {
        const buscarDadosR = async () => {
          try {
            const resultado = await Execute.receiveFromRJustBSA(codigo, r);
            const groups = resultado.map((group) => ({
              dec: group.dec,
              base: Number(group.total_base) || 0,
              sis: Number(group.total_sis) || 0,
              alt: Number(group.total_alt) || 0,
              ids: group.ids || [],
              uids: group.uids || [],
            }));

            setDecGroups(groups);
            setDadosR(
              groups.reduce((sum, g) => sum + g.base + g.sis + g.alt, 0),
            );
            setIdsArray(groups.flatMap((g) => g.ids));
            setRBsaUidsArray(groups.flatMap((g) => g.uids));
          } catch (error) {
            console.error("Erro ao recarregar dados de R:", error);
          }
        };
        buscarDadosR();
      }

      // Listener for Deve updates
      if (type.startsWith("DEVE_")) {
        const buscarDadosDeve = async () => {
          if (!codigo || !r) return;
          try {
            const resultado = await Execute.receiveFromDeveJustValor(codigo, r);
            const somaTotal = Number(resultado.total_valor || 0);
            const ids = resultado.deveids || [];
            setValorDeve(somaTotal);
            setDeveIdsArray(ids);
          } catch (error) {
            console.error("Erro ao recarregar dados de Deve:", error);
          }
        };
        buscarDadosDeve();
      }

      // Listener for Devo updates
      if (type.startsWith("DEVO_")) {
        const buscarDadosDevo = async () => {
          try {
            const resultado = await Execute.receiveFromDevoJustValor(codigo, r);
            const somaTotal = Number(resultado.total_valor || 0);
            setValorDevo(somaTotal);
          } catch (error) {
            console.error("Erro ao recarregar dados de Devo:", error);
          }
        };
        buscarDadosDevo();
      }

      // Listeners para Papel e PlotterC
      const workshop = "R" + r;
      if (
        (type.startsWith("PLOTTER_C_") &&
          payload &&
          String(payload.r) === String(r)) ||
        (type.startsWith("PAPEL_") && payload)
      ) {
        // Atualiza Plotter Data
        if (type.startsWith("PLOTTER_C_")) {
          setPlotterData((prev) => {
            let newData = [...prev];
            const index =
              payload.id !== undefined
                ? newData.findIndex(
                    (item) => String(item.id) === String(payload.id),
                  )
                : -1;

            switch (type) {
              case "PLOTTER_C_NEW_ITEM":
                if (!payload.dtfim && index === -1) {
                  newData.push(payload);
                }
                break;
              case "PLOTTER_C_UPDATED_ITEM":
                if (payload.dtfim) {
                  if (index !== -1) {
                    newData = newData.filter(
                      (item) => String(item.id) !== String(payload.id),
                    );
                  }
                } else {
                  if (index !== -1) {
                    newData[index] = payload;
                  } else {
                    newData.push(payload);
                  }
                }
                break;
              case "PLOTTER_C_DELETED_ITEM":
                newData = newData.filter(
                  (item) => String(item.id) !== String(payload.id),
                );
                break;
            }
            return newData.sort(
              (a, b) =>
                new Date(b.data) - new Date(a.data) ||
                new Date(b.inicio) - new Date(a.inicio),
            );
          });
        }

        // Atualiza Papeis
        if (type.startsWith("PAPEL_") && payload.item === workshop) {
          if (
            type === "PAPEL_NEW_ITEM" &&
            payload.gastos?.startsWith("PAPEL-")
          ) {
            setPapeis((prev) => [...prev, payload].sort((a, b) => a.id - b.id));
          } else if (type === "PAPEL_UPDATED_ITEM") {
            setPapeis((prev) =>
              prev
                .map((item) =>
                  String(item.id) === String(payload.id) ? payload : item,
                )
                .sort((a, b) => a.id - b.id),
            );
          }
        }
        if (type === "PAPEL_DELETED_ITEM") {
          setPapeis((prev) =>
            prev.filter((item) => String(item.id) !== String(payload.id)),
          );
        }
      }
    }
  }, [lastMessage, codigo, r]);

  const handleFinalizarPapel = async () => {
    if (oldestPapel) {
      try {
        // Finaliza todos os registros em aberto para a oficina 'r'
        const response = await fetch("/api/v1/tables/c/plotter/finalizar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ r }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao finalizar registros.");
        }

        // Atualização otimista da UI: remove os dados do plotter, pois foram finalizados
        setPlotterData([]);

        // Remove o papel da lista
        setPapeis((prevPapeis) =>
          prevPapeis.filter((p) => p.id !== oldestPapel.id),
        );

        // Envia a requisição para remover o papel do banco de dados
        await Execute.removePapel(oldestPapel.id);
      } catch (error) {
        console.error("Erro no processo de finalização:", error);
        // Em caso de erro, recarrega os dados para garantir consistência
        const fetchData = async () => {
          const workshop = "R" + r;
          const [plotterResults, papelResults] = await Promise.all([
            Execute.receiveFromPlotterC(r),
            Execute.receiveFromPapelByItem(workshop),
          ]);

          setPlotterData(
            Array.isArray(plotterResults)
              ? plotterResults
                  .filter((item) => !item.dtfim)
                  .sort(
                    (a, b) =>
                      new Date(b.data) - new Date(a.data) ||
                      new Date(b.inicio) - new Date(a.inicio),
                  )
              : [],
          );

          if (Array.isArray(papelResults)) {
            const filteredPapeis = papelResults
              .filter((p) => p.gastos && p.gastos.startsWith("PAPEL-"))
              .sort((a, b) => a.id - b.id);
            setPapeis(filteredPapeis);
          }
        };
        fetchData();
      }
    }
  };

  const formatNumber = (value) => {
    const number = parseFloat(value);
    return isNaN(number) ? "0.00" : number.toFixed(2);
  };

  // Fetch all cadastro names on component mount
  useEffect(() => {
    let isMounted = true;
    const fetchAllCadastroNames = async () => {
      try {
        const data = await Execute.receiveAllCad();
        if (isMounted) {
          setAllCadastroNames(data);
        }
      } catch (error) {
        console.error("Erro ao buscar todos os nomes de cadastro:", error);
      }
    };
    fetchAllCadastroNames();

    return () => {
      isMounted = false;
    };
  }, []);

  // WebSocket for cadastro updates
  useEffect(() => {
    if (lastMessage && lastMessage.data) {
      const { type, payload } = lastMessage.data;
      switch (type) {
        case "CADASTRO_NEW_ITEM":
          if (payload) {
            setAllCadastroNames((prev) => [...prev, payload]);
          }
          break;
        case "CADASTRO_UPDATED_ITEM":
          if (payload) {
            setAllCadastroNames((prev) =>
              prev.map((item) => (item.id === payload.id ? payload : item)),
            );
          }
          break;
        case "CADASTRO_DELETED_ITEM":
          if (payload && payload.id !== undefined) {
            setAllCadastroNames((prev) =>
              prev.filter((item) => item.id !== payload.id),
            );
          }
          break;
        default:
          break;
      }
    }
  }, [lastMessage]);

  const handleSave = async (editedData) => {
    try {
      const response = await fetch("/api/v1/tables/R/calculadora", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) throw new Error("Erro ao atualizar");
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const handleUpdatePapel = async () => {
    const activeValuesCount = values.filter((v) => Number(v) > 0).length;
    const metroConsumido =
      sumValues +
      (Number(desperdicio) || 0) * activeValuesCount +
      (Number(perdida) || 0);

    if (metroConsumido <= 0) return; // Não faz nada se não houver consumo

    const oficina = `R${r}`;
    const result = await Execute.receiveFromPapelCalculadora(oficina);

    if (!result || result.length === 0) {
      setErrorCode("PAPEL01");
      return false;
    }

    const itemComMenorId = result.reduce((menor, itemAtual) => {
      return !menor || Number(itemAtual.id) < Number(menor.id)
        ? itemAtual
        : menor;
    }, null);

    if (!itemComMenorId || typeof itemComMenorId.metragem === "undefined") {
      console.error(
        "hadleUpdatePapel: Não foi possível encontrar o item com menor ID ou a propriedade 'metragem' está ausente.",
        itemComMenorId,
      );
      return;
    }

    const novaMetragem = Number(itemComMenorId.metragem) - metroConsumido;

    try {
      const dadosParaAtualizar = {
        id: itemComMenorId.id,
        metragem: round(novaMetragem),
      };

      const response = await fetch("/api/v1/tables/gastos/papel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosParaAtualizar),
      });
      if (!response.ok) throw new Error("Erro ao atualizar");
      return true;
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const sendToCAndUpdateR = async (
    value,
    currentPixValue = null,
    currentRealValue = null,
  ) => {
    await Execute.removeDevo(codigo);
    const currentTotal = decGroups.reduce(
      (sum, g) => sum + g.base + g.sis + g.alt,
      0,
    );
    const excessoTotal = currentTotal - value;

    if (excessoTotal >= 0) {
      const adjustments = {};
      decGroups.forEach((g) => {
        adjustments[g.dec] = { base: g.base, sis: g.sis, alt: g.alt };
      });

      if (excessoTotal > 0) {
        const allEntries = [];
        decGroups.forEach((g) => {
          allEntries.push(
            { dec: g.dec, type: "base", value: g.base },
            { dec: g.dec, type: "sis", value: g.sis },
            { dec: g.dec, type: "alt", value: g.alt },
          );
        });

        allEntries.sort((a, b) => b.value - a.value);
        let remaining = excessoTotal;

        for (const entry of allEntries) {
          if (remaining <= 0) break;
          const subtract = Math.min(entry.value, remaining);
          adjustments[entry.dec][entry.type] -= subtract;
          remaining -= subtract;
        }
      }

      const novosDados = decGroups.map((g) => ({
        dec: g.dec,
        base: adjustments[g.dec].base,
        sis: adjustments[g.dec].sis,
        alt: adjustments[g.dec].alt,
        codigo,
        r,
      }));
      await handleSave(novosDados);

      // Usar valores passados como parâmetro se fornecidos, caso contrário usar os valores calculados
      const pixToUse = currentPixValue !== null ? currentPixValue : roundedPix;
      const realToUse =
        currentRealValue !== null ? currentRealValue : roundedReal;

      let remainingPix = pixToUse;
      let remainingReal = realToUse;

      for (const group of decGroups) {
        const paidAmount = {
          base: group.base - adjustments[group.dec].base,
          sis: group.sis - adjustments[group.dec].sis,
          alt: group.alt - adjustments[group.dec].alt,
        };
        const totalPaidForGroup =
          paidAmount.base + paidAmount.sis + paidAmount.alt;

        if (totalPaidForGroup > 0) {
          let pixForGroup = 0;
          let realForGroup = 0;

          const pixToApply = Math.min(remainingPix, totalPaidForGroup);
          pixForGroup += pixToApply;
          remainingPix -= pixToApply;
          let remainingDebtInGroup = totalPaidForGroup - pixToApply;

          if (remainingDebtInGroup > 0) {
            const realToApply = Math.min(remainingReal, remainingDebtInGroup);
            realForGroup += realToApply;
            remainingReal -= realToApply;
          }

          await Execute.sendToC({
            ...ObjC1,
            data: new Date().toISOString(),
            dec: group.dec,
            base: round(paidAmount.base),
            sis: round(paidAmount.sis),
            alt: round(paidAmount.alt),
            real: roundToHalf(realForGroup),
            pix: roundToHalf(pixForGroup),
            r_bsa_ids: group.uids,
          });
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSalvarDisabled) return;
    setIsSalvarDisabled(true);

    if (sumValues > 0) {
      const oficina = `R${r}`;
      const result = await Execute.receiveFromPapelCalculadora(oficina);
      if (!result || result.length === 0) {
        setErrorCode("PAPEL01");
        setIsSalvarDisabled(false);
        return;
      }
    }

    const trocoValue = Number(roundedTroco);

    try {
      // Condição para devolver crédito (Devo) em dinheiro para o cliente
      if (
        valorDevo > 0 &&
        Number(trocoReal) > 0 &&
        !total &&
        !dadosR &&
        !valorDeve &&
        !pix &&
        !real
      ) {
        const valorRetirado = Number(trocoReal);
        const novoValorDevo = valorDevo - valorRetirado;

        // Remove o registro de crédito antigo
        await Execute.removeDevo(codigo);

        // Se ainda sobrar crédito, cria um novo registro com o valor atualizado
        if (novoValorDevo > 0) {
          await Execute.sendToDevo({
            nome,
            r,
            codigo,
            valor: roundToHalf(novoValorDevo),
          });
        }

        // Registra a saída de caixa como um pagamento negativo
        await Execute.sendToPagamentos({
          nome,
          r,
          data: Use.NowData(),
          pix: 0,
          real: -valorRetirado,
        });

        console.log("Caiu em Devolver crédito (Devo) em dinheiro.");

        // Limpa o formulário e encerra a execução para não processar o resto da função
        setPix("");
        onPlusChange(0);
        setReal("");
        setComentario("");
        setPerdida("");
        setTrocoReal("");
        onNomeChange("");
        onCodigoChange("");
        onValuesChange(Array(28).fill(""));
        return;
      } else if (dadosR && !valorDeve && trocoValue > 0 && !Number(total)) {
        await sendToCAndUpdateR(trocoValue);
        console.log("caiu em Pago Parte do R");

        //
      } else if (dadosR && !trocoValue && !Number(total) && !valorDeve) {
        await sendToCAndUpdateR(trocoValue);
        await Execute.PayAllMandR(idsArray);
        console.log("caiu em Pago todo R");
        //
      } else if (trocoValue < 0) {
        const totalOriginalDaCompra = total + (Number(dadosR) || 0) + valorDeve;
        const pagamento = pixMaisReal;
        const trocoRealDado = Number(trocoReal) || 0;

        const creditoFinal =
          valorDevo + pagamento - totalOriginalDaCompra - trocoRealDado;

        if (valorDevo > 0) {
          await Execute.removeDevo(codigo);
        }

        if (creditoFinal > 0) {
          await Execute.sendToDevo({
            nome,
            r,
            codigo,
            valor: roundToHalf(creditoFinal),
          });
        }

        await Execute.removeDeve(codigo);
        await Execute.sendToPapelC(ObjPapelC);
        await Execute.PayAllMandR(idsArray);
        console.log("Caiu em Troco Menor que Zero.");
      } else if (
        trocoValue === totalGeral &&
        Number(pix) == 0 &&
        Number(real) == 0
      ) {
        if (Number(total) > 0) {
          if (valorDevo > 0) {
            await Execute.updateDevo(codigo, valorDevo);
          }

          if (totalGeral > 0) {
            const novoCodigo = gerarCodigoUnico();
            await Execute.sendToDeve({
              deveid: novoCodigo,
              nome,
              r,
              data: Use.NowData(),
              codigo,
              valorpapel: round(papel),
              valorcomissao: round(comitions),
              valor: roundedTotalGeral,
            });
            await Execute.sendToPapelC({
              ...ObjPapelC,
              deveid: novoCodigo,
            });
          } else {
            await Execute.sendToPapelC(ObjPapelC);
          }
        } else {
          setShowError(true);
        }

        console.log("Deve Todo o Papel");
        //
      } else if (!trocoValue && valorDeve && dadosR) {
        const existsMap = new Map();
        for (const group of decGroups) {
          const exists = await Execute.receiveFromCData(
            codigo,
            data,
            r,
            group.dec,
          );
          existsMap.set(group.dec, exists);
        }

        if (existsMap) {
          // IMPORTANTE: Recalcular com valores ATUAIS do estado
          const currentRoundedPix = roundToHalf(Number(pix) || 0);
          const currentRoundedReal = roundToHalf(Number(real) || 0);
          const currentPixMaisReal = currentRoundedPix + currentRoundedReal;

          const values = totalGeral - Number(total) - currentPixMaisReal;
          await sendToCAndUpdateR(
            values,
            currentRoundedPix,
            currentRoundedReal,
          );

          const numPix = currentRoundedPix;
          const numReal = currentRoundedReal;

          if (numPix > 0 || numReal > 0) {
            let finalPix = numPix;
            let finalReal = numReal;

            if (trocoValue < 0) {
              const change = -trocoValue;
              const realAfterChange = finalReal - change;
              finalReal = Math.max(0, realAfterChange);

              if (realAfterChange < 0) {
                finalPix = Math.max(0, finalPix + realAfterChange);
              }
            }

            if (finalPix > 0 || finalReal > 0) {
              let pixParaPagamento = finalPix;
              let realParaPagamento = finalReal;

              if (valorDevo > 0) {
                if (pixParaPagamento > 0) {
                  pixParaPagamento += valorDevo;
                } else if (realParaPagamento > 0) {
                  realParaPagamento += valorDevo;
                }
              }

              await Execute.sendToDeveUpdate(
                codigo,
                trocoValue,
                r,
                deveIdsArray,
                pixParaPagamento,
                realParaPagamento,
              );
            }
          }
          await Execute.removeDeve(codigo);
          await Execute.removeDevo(codigo);
          await Execute.PayAllMandR(idsArray);
          if (total > 0 && trocoValue === 0) {
            await Execute.sendToPapelC(ObjPapelC);
          }

          console.log("Existe no C");
        } else {
          await sendToCAndUpdateR(trocoValue);
          await Execute.removeDeve(codigo);
          await Execute.removeDevo(codigo);
          await Execute.PayAllMandR(idsArray);
        }
        console.log("Caiu em foi tudo pago Papel e R.");
        //
      } else if (valorDeve && !trocoValue) {
        // IMPORTANTE: Recalcular com valores ATUAIS do estado
        const currentRoundedPix = roundToHalf(Number(pix) || 0);
        const currentRoundedReal = roundToHalf(Number(real) || 0);

        const numPix = currentRoundedPix;
        const numReal = currentRoundedReal;

        if (numPix > 0 || numReal > 0) {
          let finalPix = numPix;
          let finalReal = numReal;

          if (trocoValue < 0) {
            const change = -trocoValue;
            const realAfterChange = finalReal - change;
            finalReal = Math.max(0, realAfterChange);

            if (realAfterChange < 0) {
              finalPix = Math.max(0, finalPix + realAfterChange);
            }
          }

          if (finalPix > 0 || finalReal > 0) {
            let pixParaPagamento = finalPix;
            let realParaPagamento = finalReal;

            if (valorDevo > 0) {
              if (pixParaPagamento > 0) {
                pixParaPagamento += valorDevo;
              } else if (realParaPagamento > 0) {
                realParaPagamento += valorDevo;
              }
            }

            await Execute.sendToDeveUpdate(
              codigo,
              trocoValue,
              r,
              deveIdsArray,
              pixParaPagamento,
              realParaPagamento,
            );
          }
        }

        await Execute.removeDevo(codigo);
        if (trocoValue > 0) {
          await Execute.sendToPapelC(ObjPapelC);
        } else if (total > 0 && trocoValue === 0) {
          await Execute.sendToPapelC(ObjPapelC);
        }

        console.log("Caiu em Foi pago todo o papel.");

        //
      } else if (isPendente && !trocoValue && !valorDeve) {
        const novoAvisoId = gerarCodigoUnico();
        await Execute.sendToAviso({
          avisoid: novoAvisoId,
          data: Use.NowData(),
          codigo,
          r,
          nome,
          valorpapel: round(papel),
          valorcomissao: round(comitions),
          valor: roundToHalf(total),
        });

        await Execute.sendToPapelC({
          ...ObjPapelC,
          deveid: novoAvisoId,
          data: Use.NowData(),
        });

        console.log("Caiu em Nova condição: !trocoValue e criou aviso.");
      } else if (valorDeve && trocoValue && !dadosR) {
        await Execute.sendToDeveUpdate(
          codigo,
          trocoValue,
          r,
          deveIdsArray,
          roundedPix,
          roundedReal,
        );

        if (total > 0) {
          const novoCodigo = gerarCodigoUnico();
          await Execute.sendToDeve({
            deveid: novoCodigo,
            nome,
            r,
            data: Use.NowData(),
            codigo,
            valorpapel: round(papel),
            valorcomissao: round(comitions),
            valor: trocoValue,
          });
          await Execute.sendToPapelC({
            ...ObjPapelC,
            deveid: novoCodigo,
            papelpix: round(
              roundedPix > 0 ? Math.min(roundedPix, papel) - trocoValue : 0,
            ),
            papelreal: round(
              roundedReal > 0
                ? Math.min(
                    roundedReal,
                    papel -
                      (roundedPix > 0 ? Math.min(roundedPix, papel) : 0) -
                      trocoValue,
                  )
                : 0,
            ),
          });
          console.log("caiu no valor novo pago e parte");
        }

        await Execute.removeDevo(codigo);
        console.log("Caiu em Foi pago Parte do Valor do Papel.");
        //
      } else if (dadosR > 0 && !trocoValue && !Number(total)) {
        await sendToCAndUpdateR(trocoValue);
        await Execute.PayAllMandR(idsArray);
        console.log("Caiu em foi pago todo o R.");
        //
      } else if (dadosR > 0 && !trocoValue && Number(total)) {
        await sendToCAndUpdateR(trocoValue);
        await Execute.sendToPapelC(ObjPapelC);
        await Execute.PayAllMandR(idsArray);
        console.log("Caiu em foi pago todo o R e Papel.");
        //
      } else if (dadosR > 0 && trocoValue && Number(total)) {
        if (dadosR === pixMaisReal) {
          await Execute.sendToC(ObjC1);
          await Execute.PayAllMandR(idsArray);
          if (total > 0) {
            const novoCodigo = gerarCodigoUnico();
            await Execute.removeDevo(codigo);
            await Execute.sendToDeve({
              deveid: novoCodigo,
              nome,
              r,
              data: Use.NowData(),
              codigo,
              valorpapel: round(papel),
              valorcomissao: round(comitions),
              valor: trocoValue,
            });
            await Execute.sendToPapelC({
              ...ObjPapelC,
              deveid: novoCodigo,
              data: Use.NowData(),
              papelpix: 0,
              papelreal: 0,
              encaixepix: 0,
              encaixereal: 0,
            });
          } else {
            setShowError(true);
          }
          console.log("Caiu em foi pago todo o R e deve todo o Papel.");
          //
        } else if (
          (pixMaisReal < dadosR && pixMaisReal < Number(total)) ||
          (pixMaisReal < dadosR && pixMaisReal > Number(total))
        ) {
          const values = totalGeral - Number(total) - pixMaisReal;
          const novoCodigo = gerarCodigoUnico();
          await sendToCAndUpdateR(values);
          if (total > 0) {
            await Execute.removeDevo(codigo);
            await Execute.removeDeve(codigo);
            await Execute.sendToDeve({
              deveid: novoCodigo,
              nome,
              r,
              data: Use.NowData(),
              codigo,
              valorpapel: round(papel),
              valorcomissao: round(comitions),
              valor: roundToHalf(total),
            });

            await Execute.sendToPapelC({
              ...ObjPapelC,
              deveid: novoCodigo,
              data: Use.NowData(),
              papelpix: 0,
              papelreal: 0,
              encaixepix: 0,
              encaixereal: 0,
            });
          } else {
            setShowError(true);
          }
          console.log("Caiu em foi pago parte do R deve o Papel.");
          //
        } else if (pixMaisReal > dadosR && Number(total)) {
          await sendToCAndUpdateR(0);
          await Execute.PayAllMandR(idsArray);
          if (total > 0) {
            const value = Math.abs(totalGeral - pixMaisReal);
            const novoCodigo = gerarCodigoUnico();
            await Execute.removeDevo(codigo);
            await Execute.removeDeve(codigo);
            await Execute.sendToDeve({
              deveid: novoCodigo,
              nome,
              r,
              data: Use.NowData(),
              codigo,
              valorpapel: round(papel),
              valorcomissao: round(comitions),
              valor: roundToHalf(value),
            });
            await Execute.sendToPapelC({
              ...ObjPapelC,
              deveid: novoCodigo,
              data: Use.NowData(),
            });
          } else {
            setShowError(true);
          }
          console.log("Caiu em foi pago todo o R e parte do Papel.");
          //
        } else if (Number(total) === pixMaisReal) {
          await Execute.sendToPapelC(ObjPapelC);
          await sendToCAndUpdateR(trocoValue);
          console.log("Caiu em foi pago todo o Papel e deve todo o R.");
          //
        }
      } else if (
        dadosR > 0 &&
        valorDeve > 0 &&
        trocoValue > 0 &&
        !Number(total)
      ) {
        if (dadosR === pixMaisReal) {
          await sendToCAndUpdateR(0);
          await Execute.removeDevo(codigo);
          await Execute.PayAllMandR(idsArray);

          console.log("Caiu em foi pago todo R deve o Papel.");
          //
        } else if (pixMaisReal < dadosR) {
          await sendToCAndUpdateR(pixMaisReal);
          console.log("Caiu em foi pago Parte R deve o Papel.");
        } else if (pixMaisReal > dadosR) {
          await Execute.sendToDeveUpdate(codigo, trocoValue, r);
          await sendToCAndUpdateR(0);
          await Execute.PayAllMandR(idsArray);
          console.log("Caiu em foi Todo R e Parte Papel.");
        }
        console.log("Caiu em Tem R e Tem DEVE");
      } else if (valorDevo && totalGeral === pixMaisReal) {
        await Execute.removeDevo(codigo);
        await Execute.sendToPapelC({
          ...ObjPapelC,
          papelpix: round(
            roundedPix > 0 ? Math.min(roundedPix, papel) + valorDevo : 0,
          ),
          papelreal: round(
            roundedReal > 0
              ? Math.min(
                  roundedReal,
                  papel - (roundedPix > 0 ? Math.min(roundedPix, papel) : 0),
                ) + valorDevo
              : 0,
          ),
        });

        console.log("Caiu em DEVO e Pagou tudo o Papel");
      } else if (Number(total) && !dadosR && !valorDeve && trocoValue) {
        if (valorDevo > 0) {
          await Execute.updateDevo(codigo, valorDevo);
        }
        const novoCodigo = gerarCodigoUnico();
        await Execute.sendToDeve({
          deveid: novoCodigo,
          nome,
          r,
          data: Use.NowData(),
          codigo,
          valorpapel: round(papel - pixMaisReal),
          valorcomissao: round(comitions),
          valor: trocoValue,
        });
        await Execute.sendToPapelC({
          ...ObjPapelC,
          deveid: novoCodigo,
        });
        console.log("Caiu em tem Serviço e papel e foi Pago parte o papel");
      } else {
        console.log("Caiu em sem condições");
        await Execute.sendToPapelC(ObjPapelC);
      }

      if (sumValues > 0) {
        await handleUpdatePapel();
      }

      // IMPORTANTE: Recalcular roundedPix e roundedReal AQUI dentro do handleSubmit
      // para garantir que estamos usando os valores mais RECENTES do estado
      const currentRoundedPix = roundToHalf(Number(pix) || 0);
      const currentRoundedReal = roundToHalf(Number(real) || 0);

      const numPix = currentRoundedPix;
      const numReal = currentRoundedReal;

      if (numPix > 0 || numReal > 0) {
        let finalPix = numPix;
        let finalReal = numReal;

        if (trocoValue < 0) {
          const change = -trocoValue;
          const realAfterChange = finalReal - change;
          finalReal = Math.max(0, realAfterChange);

          if (realAfterChange < 0) {
            finalPix = Math.max(0, finalPix + realAfterChange);
          }
        }

        if (finalPix > 0 || finalReal > 0) {
          let pixParaPagamento = finalPix;
          let realParaPagamento = finalReal;

          if (valorDevo > 0) {
            if (pixParaPagamento > 0) {
              pixParaPagamento += valorDevo;
            } else if (realParaPagamento > 0) {
              realParaPagamento += valorDevo;
            }
          }

          console.log("💰 Calculadora - Enviando para Pagamentos:", {
            pixOriginal: pix,
            realOriginal: real,
            pixArredondado: currentRoundedPix,
            realArredondado: currentRoundedReal,
            pixFinal: round(pixParaPagamento),
            realFinal: round(realParaPagamento),
            valorDevo: valorDevo,
          });

          await Execute.sendToPagamentos({
            nome,
            r,
            data: Use.NowData(),
            pix: round(pixParaPagamento),
            real: round(realParaPagamento),
          });

          await Execute.sendToSemanal({
            r,
            data: Use.NowData(),
            pix: round(pixParaPagamento),
            real: round(realParaPagamento),
          });
        }
      }

      resetForm();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar os dados!");
    } finally {
      setTimeout(() => setIsSalvarDisabled(false), 1000);
    }
  };

  const handlePendente = async () => {
    if (isEsperaDisabled) return;
    setIsEsperaDisabled(true);
    setTimeout(() => {
      setIsEsperaDisabled(false);
    }, 1000);

    if (!nome || !codigo) {
      alert("Nome e Código são obrigatórios para salvar como pendente.");
      return;
    }

    // Garante que o array 'values' tenha sempre 28 posições, preenchendo com null se necessário
    const preparedValues = Array.from(
      { length: 28 },
      (_, i) => (values[i] !== "" ? Number(values[i]) : null), // 'values' é prop
    );

    const dataToSend = {
      nome, // 'nome' é prop
      codigo, // 'codigo' é prop
      multi: multiplier,
      r,
      data: Use.NowData(),
      comissao: plus || 0,
      comentario,
      values_array: preparedValues, // Array com os 28 valores
    };

    try {
      await Execute.sendToTemp(dataToSend);
      resetForm();
      console.log("Dados pendentes salvos com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar dados pendentes:", error);
    }
  };

  const handlePendentePapel = async () => {
    if (isPendenteDisabled) return;
    setIsPendenteDisabled(true);

    setTimeout(() => {
      setIsPendenteDisabled(false);
    }, 1000);

    if (!nome || !codigo) {
      alert("Nome e Código são obrigatórios para marcar como pendente.");
      return;
    }

    if (sumValues > 0 && papeis.length === 0) {
      setErrorCode("PAPEL01");
      return;
    }

    try {
      if (Number(total) > 0) {
        const novoCodigo = gerarCodigoUnico();
        //await Execute.removeDevo(codigo);
        await Execute.sendToDeve({
          deveid: novoCodigo,
          nome,
          r,
          data: Use.NowData(),
          codigo,
          valorpapel: round(papel),
          valorcomissao: round(comitions),
          valor: roundToHalf(total),
        });

        await Execute.sendToPapelC({
          ...ObjPapelC,
          deveid: novoCodigo,
          data: Use.NowData(),
          papelpix: 0,
          papelreal: 0,
          encaixepix: 0,
          encaixereal: 0,
        });

        handleUpdatePapel(
          Number(sumValues) + Number(desperdicio) + Number(perdida),
        );

        // Clear form after successful operation
        resetForm();
      } else {
        setShowError(true);
      }
      console.log("Deve Todo o Papel");
    } catch (error) {
      console.error("Erro ao salvar como pendente:", error);
      alert("Erro ao salvar como pendente!");
    }
  };

  const handleEnviarGastoOficina = async () => {
    if (!gastoOficina || !valorOficina) {
      console.error("Gasto e Valor são obrigatórios.");
      return;
    }
    try {
      await Execute.sendToSaidaO(
        "A",
        `R${r}`,
        gastoOficina,
        parseFloat(valorOficina) || 0,
        Use.NowData(),
      );
      setGastoOficina("");
      setValorOficina("");
    } catch (error) {
      console.error("Erro ao enviar gasto da oficina:", error);
    }
  };

  const ObjC1 = {
    codigo,
    dec: "", // Será sobrescrito por grupo
    r,
    data,
    nome,
    sis: 0, // Valores serão ajustados
    alt: 0,
    base: 0,
    real: Number(real),
    pix: Number(pix),
    r_bsa_ids: rBsaUidsArray, // Adicionado para rastreamento
  };

  const activeValuesCount = values.filter((v) => Number(v) > 0).length;

  const ObjPapelC = {
    deveid: 0,
    codigo,
    r,
    data: Use.NowData(),
    nome,
    multi: multiplier,
    comissao: plus || 0,
    papel: round(papel) || 0,
    papelpix: round(roundedPix > 0 ? Math.min(roundedPix, papel) : 0),
    papelreal: round(
      roundedReal > 0
        ? Math.min(
            roundedReal,
            papel - (roundedPix > 0 ? Math.min(roundedPix, papel) : 0),
          )
        : 0,
    ),
    encaixepix: round(roundedPix > 0 ? Math.min(roundedPix, comitions) : 0),
    encaixereal: round(
      roundedReal > 0
        ? Math.min(
            roundedReal,
            comitions - (roundedPix > 0 ? Math.min(roundedPix, comitions) : 0),
          )
        : 0,
    ),
    desperdicio: round((Number(desperdicio) || 0) * activeValuesCount),
    util: round(sumValues),
    perdida: Number(perdida) || 0,
    comentario,
  };

  const datalistId = `name-suggestions-${componentId}`;

  return (
    <div>
      {/* Seção de Papel Adicionada */}
      <div className="overflow-x-auto rounded-box border border-warning bg-base-100">
        <table className="table table-xs">
          <thead>
            <tr>
              {oldestPapel ? (
                <th
                  colSpan={2}
                  key={oldestPapel.id}
                  className="text-center bg-success py-0 px-1"
                >
                  {oldestPapel.gastos}
                </th>
              ) : (
                <th colSpan={2}></th>
              )}
              <th colSpan={4} className="bg-success py-0 px-1"></th>
              <th colSpan={2} rowSpan={2} className="bg-error p-0">
                {oldestPapel && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-error rounded-none w-full h-full p-0 m-0"
                    onClick={handleFinalizarPapel}
                  >
                    Finalizar
                  </button>
                )}
              </th>
            </tr>
            <tr>
              {oldestPapel ? (
                <th
                  colSpan={2}
                  key={oldestPapel.id}
                  className="text-center bg-info/30 py-0 px-1"
                >
                  {formatNumber(oldestPapel.metragem)}
                </th>
              ) : (
                <th colSpan={2}></th>
              )}
              <th colSpan={4} className="text-center bg-secondary/30 py-0 px-1">
                {formatNumber(
                  plotterData.reduce((acc, item) => {
                    const larguraTotalCm =
                      parseFloat(item.largura) + (Number(desperdicio) || 0);
                    const mValue =
                      ((parseFloat(item.sim) + parseFloat(item.nao)) / 100) *
                      (larguraTotalCm / 100);
                    return acc + mValue;
                  }, 0),
                )}
              </th>
            </tr>
          </thead>
        </table>
      </div>
      <div className="badge badge-accent w-full badge-sm whitespace-normal h-auto text-black">
        {comentarioCadastro}
      </div>

      <form onSubmit={handleSubmit} autoComplete="nope">
        <div className="grid grid-cols-4">
          <input
            type="text"
            placeholder="CODIGO"
            className="input input-warning input-xs w-full col-span-3"
            value={codigo}
            autoComplete="nope"
            onChange={handleCodigoChange}
            required
          />
          <input
            type="number"
            className="input input-warning text-warning text-left input-xs w-full"
            value={plus === null || plus === undefined ? "" : plus}
            placeholder={0}
            autoComplete="nope"
            onChange={handlePlusChange}
          />
        </div>
        <div className="grid grid-cols-1">
          <input
            type="text"
            placeholder="Nome"
            className={`input ${nomeInputClass} input-xs w-full`}
            value={nome}
            autoComplete="nope"
            list={datalistId} // Linked to datalist
            onChange={handleNomeChange}
            required
          />
          <datalist id={datalistId}>
            {filteredSuggestions.map((suggestion, index) => (
              <option key={index} value={suggestion} />
            ))}
          </datalist>
        </div>
        <input
          type="number"
          className="input input-warning hidden text-warning input-xs "
          value={multiplier}
          autoComplete="nope"
          onChange={handleMultiplierChange}
        />
        <div className="grid grid-cols-4">
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className="relative">
              <input
                min="0"
                step="0.01"
                type="number"
                className="input input-info input-xs appearance-none"
                value={values[i]}
                autoComplete="nope"
                disabled={!codigo} // Adicionado aqui
                onChange={(e) => handleValueChange(i, e)}
              />
            </div>
          ))}
        </div>
        <div>
          <input
            type="text"
            placeholder="Total"
            value={typeof total === "number" ? total.toFixed(2) : ""}
            autoComplete="nope"
            className="input input-warning input-xs z-3 text-center text-warning font-bold w-full"
            readOnly
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="SOMA TOTAL"
            value={displayTotalGeral}
            autoComplete="nope"
            className={`input ${somaTotalInputClass} input-xl z-3 text-center mt-0.5 font-bold w-full`}
            readOnly
          />
        </div>
        <div className="join grid grid-cols-3 mt-0.5">
          <input
            min="0"
            step="0.5"
            type="number"
            placeholder="Pix"
            className="input input-secondary input-lg z-2 text-secondary font-bold join-item"
            value={pix}
            autoComplete="nope"
            onChange={handleHalfStepChange(setPix)}
            onBlur={(e) =>
              e.target.value && setPix(parseFloat(e.target.value).toFixed(2))
            }
            onWheel={(e) => e.target.blur()}
          />
          <input
            min="0"
            type="text"
            placeholder="Troco"
            value={roundedTroco.toFixed(2)}
            autoComplete="nope"
            className="input input-defaut input-lg join-item font-bold"
            readOnly
          />
          <input
            min="0"
            step="0.5"
            type="number"
            placeholder="Real"
            className="input input-secondary input-lg z-2 text-secondary font-bold join-item"
            value={real}
            autoComplete="nope"
            onChange={handleHalfStepChange(setReal)}
            onBlur={(e) =>
              e.target.value && setReal(parseFloat(e.target.value).toFixed(2))
            }
            onWheel={(e) => e.target.blur()}
          />
          <div className="grid col-span-3 my-0.5 z-50">
            <input
              min="0"
              step="0.5"
              type="number"
              placeholder="Troco Real"
              className="input input-info input-lg z-2 text-center text-info font-bold w-full"
              value={trocoReal}
              onChange={handleHalfStepChange(setTrocoReal)}
              onBlur={(e) =>
                e.target.value &&
                setTrocoReal(parseFloat(e.target.value).toFixed(2))
              }
              autoComplete="nope"
              onWheel={(e) => e.target.blur()}
            />
          </div>
          <div className="grid grid-cols-2 col-span-3 my-0.5 z-50">
            <button
              type="button"
              className="btn btn-warning"
              onClick={handlePendente}
              disabled={isEsperaDisabled}
            >
              Espera
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePendentePapel}
              disabled={isPendenteDisabled}
            >
              Pendente
            </button>
          </div>
          <div className="col-span-3">
            <button
              type="submit"
              className="btn btn-secondary w-full"
              disabled={isSalvarDisabled}
            >
              Salvar
            </button>
          </div>
        </div>
        <div className="join items-end">
          <input
            type="text"
            placeholder="Gasto"
            className="input input-primary input-xs join-item"
            autoComplete="nope"
            value={gastoOficina}
            onChange={(e) => setGastoOficina(e.target.value)}
          />
          <input
            min="0"
            step={0.01}
            type="number"
            placeholder="Valor"
            className="input input-primary input-xs join-item"
            autoComplete="nope"
            value={valorOficina}
            onChange={(e) => setValorOficina(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-info btn-xs join-item"
            onClick={handleEnviarGastoOficina}
          >
            Enviar
          </button>
        </div>
      </form>
      {typeof window !== "undefined" && showError && (
        <ErrorComponent errorCode="Nulo" />
      )}
      {errorCode && <ErrorComponent errorCode={errorCode} />}
    </div>
  );
};
export default Calculadora;
