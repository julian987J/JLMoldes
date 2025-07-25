import Execute from "models/functions";
import { useState, useEffect, useId } from "react";
import dynamic from "next/dynamic";
import { useWebSocket } from "../../../contexts/WebSocketContext.js"; // Import WebSocket context
import Use from "models/utils.js";

let codigoAleatorioGlobal = "";
function gerarEArmazenarCodigoAleatorio() {
  codigoAleatorioGlobal = Math.random().toString(36).slice(2, 10).toUpperCase();
  console.log("Novo código aleatório gerado:", codigoAleatorioGlobal); // Para fins de demonstração
  return codigoAleatorioGlobal;
}

const Calculadora = ({
  codigo,
  nome,
  plus,
  values = Array(28).fill(""), // Provide a default value for values
  onCodigoChange,
  onNomeChange,
  onPlusChange, // Recebido como prop
  onValuesChange, // Recebido como prop
  data,
  r,
  isPendente,
}) => {
  const ErrorComponent = dynamic(() => import("../Errors.js"), { ssr: false });
  const [showError, setShowError] = useState(false);
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

  const [dadosR, setDadosR] = useState(0);
  const [idsArray, setIdsArray] = useState(0);
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

  const [allCadastroNames, setAllCadastroNames] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  const [isSalvarDisabled, setIsSalvarDisabled] = useState(false);
  const [isPendenteDisabled, setIsPendenteDisabled] = useState(false);
  const [isEsperaDisabled, setIsEsperaDisabled] = useState(false);

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
  const roundedTotalGeral = Math.round(totalGeral / 0.5) * 0.5;
  const displayTotalGeral =
    roundedTotalGeral === 0 ? "SOMA TOTAL" : roundedTotalGeral.toFixed(2);

  const totalTroco = totalGeral - (Number(pix) || 0) - (Number(real) || 0);
  const roundedTroco = Math.round(totalTroco / 0.5) * 0.5;

  const pixMaisReal = Number(pix) + Number(real);
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
        const resultado = await Execute.receiveFromDevoJustValor(codigo);

        // Soma todos os valores
        const somaTotal = Number(resultado.total_valor || 0);

        setValorDevo(somaTotal);
      } catch (error) {
        console.error("Erro:", error);
        setValorDevo(0);
      }
    };
    buscarDados();
  }, [codigo]);

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
      const { type } = lastMessage.data;

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
            }));
            setDecGroups(groups);
            setDadosR(
              groups.reduce((sum, g) => sum + g.base + g.sis + g.alt, 0),
            );
            setIdsArray(groups.flatMap((g) => g.ids));
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
            const resultado = await Execute.receiveFromDevoJustValor(codigo);
            const somaTotal = Number(resultado.total_valor || 0);
            setValorDevo(somaTotal);
          } catch (error) {
            console.error("Erro ao recarregar dados de Devo:", error);
          }
        };
        buscarDadosDevo();
      }
    }
  }, [lastMessage, codigo, r]);

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

  const hadleUpdatePapel = async (metroConsumido) => {
    const oficina = `R${r}`;
    const result = await Execute.receiveFromPapelCalculadora(oficina);

    if (!result || result.length === 0) {
      console.error(
        "hadleUpdatePapel: Nenhum dado retornado de receiveFromPapelCalculadora para a oficina:",
        oficina,
      );
      return;
    }

    // Encontrar o item com o menor ID
    const itemComMenorId = result.reduce((menor, itemAtual) => {
      if (!menor || Number(itemAtual.id) < Number(menor.id)) {
        return itemAtual;
      }
      return menor;
    }, null);

    if (!itemComMenorId || typeof itemComMenorId.metragem === "undefined") {
      console.error(
        "hadleUpdatePapel: Não foi possível encontrar o item com menor ID ou a propriedade 'metragem' está ausente.",
        itemComMenorId,
      );
      return;
    }

    const metragemAtual = Number(itemComMenorId.metragem);
    const novaMetragem = metragemAtual - Number(metroConsumido);

    try {
      const dadosParaAtualizar = {
        id: itemComMenorId.id,
        metragem: novaMetragem,
      };

      const response = await fetch("/api/v1/tables/gastos/papel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosParaAtualizar),
      });
      if (!response.ok) throw new Error("Erro ao atualizar");
      console.log(
        "Papel.js: Dados salvos via API. Aguardando mensagem WebSocket para fechar o modo de edição.",
      );
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const handleUpdateC = async (codigo, data, New, currentTotal, dec) => {
    try {
      // Decodificar a data
      const decodedData = decodeURIComponent(data);

      // Obter valores atuais do C para este dec
      const existingData = await Execute.receiveFromCData(
        codigo,
        decodedData,
        r,
        dec,
      );

      // Calcular novos valores
      const newSis = (existingData.sis || 0) + (New.sis || 0);
      const newAlt = (existingData.alt || 0) + (New.alt || 0);
      const newBase = (existingData.base || 0) + (New.base || 0);

      // Ajustar valores de real e pix para não ultrapassar o total permitido
      let adjustedReal = Number(real);
      let adjustedPix = Number(pix);

      // Calcular o máximo permitido para este grupo dec
      const maxForDec = newSis + newAlt + newBase;

      // Garantir que nenhum valor exceda o máximo do grupo
      adjustedReal = Math.min(adjustedReal, maxForDec);
      adjustedPix = Math.min(adjustedPix, maxForDec);

      // Ajustar soma se necessário
      const soma = adjustedReal + adjustedPix;
      if (soma > maxForDec) {
        const excesso = soma - maxForDec;
        const ratioReal = adjustedReal / soma;
        const ratioPix = adjustedPix / soma;

        adjustedReal -= Math.round(excesso * ratioReal);
        adjustedPix -= Math.round(excesso * ratioPix);

        // Garantir valores não negativos
        adjustedReal = Math.max(adjustedReal, 0);
        adjustedPix = Math.max(adjustedPix, 0);

        // Correção final de arredondamento
        if (adjustedReal + adjustedPix > maxForDec) {
          adjustedReal = maxForDec - adjustedPix;
        }
      }

      // Fazer a requisição PUT atualizada com dec
      const response = await fetch(
        `/api/v1/tables/c/calculadora?codigo=${codigo}&data=${decodedData}&r=${r}&dec=${dec}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sis: newSis,
            alt: newAlt,
            base: newBase,
            real: adjustedReal,
            pix: adjustedPix,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar registro no C");
      }

      return await response.json();
    } catch (error) {
      console.error("Erro ao atualizar C para dec", dec, ":", error);
      throw error;
    }
  };

  const sendToCAndUpdateR = async (value) => {
    await Execute.removeDevo(codigo);
    const currentTotal = decGroups.reduce(
      (sum, g) => sum + g.base + g.sis + g.alt,
      0,
    );
    const excessoTotal = currentTotal - value;

    // Verificar existência no C para cada dec
    const existsMap = new Map();
    for (const group of decGroups) {
      const exists = await Execute.receiveFromCData(codigo, data, r, group.dec);
      existsMap.set(group.dec, exists);
    }

    if (excessoTotal > 0) {
      // Criar lista única para ajuste
      const allEntries = [];
      decGroups.forEach((g) => {
        allEntries.push(
          { dec: g.dec, type: "base", value: g.base },
          { dec: g.dec, type: "sis", value: g.sis },
          { dec: g.dec, type: "alt", value: g.alt },
        );
      });

      // Ordenar e ajustar valores
      allEntries.sort((a, b) => b.value - a.value);
      let remaining = excessoTotal;
      const adjustments = {};

      decGroups.forEach((g) => {
        adjustments[g.dec] = { base: g.base, sis: g.sis, alt: g.alt };
      });

      for (const entry of allEntries) {
        if (remaining <= 0) break;
        const subtract = Math.min(entry.value, remaining);
        adjustments[entry.dec][entry.type] -= subtract;
        remaining -= subtract;
      }

      // Atualizar R
      const novosDados = decGroups.map((g) => ({
        dec: g.dec,
        base: adjustments[g.dec].base,
        sis: adjustments[g.dec].sis,
        alt: adjustments[g.dec].alt,
        codigo,
        r,
      }));
      await handleSave(novosDados);

      // Atualizar/enviar para C
      for (const group of decGroups) {
        const diff = {
          base: group.base - adjustments[group.dec].base,
          sis: group.sis - adjustments[group.dec].sis,
          alt: group.alt - adjustments[group.dec].alt,
          real: Math.min(Number(real)), // Adicione
          pix: Math.min(Number(pix)), // Adicione
        };

        const exists = existsMap.get(group.dec);

        if (exists) {
          await handleUpdateC(codigo, data, diff, currentTotal, group.dec);
        } else {
          await Execute.sendToC({
            ...ObjC1,
            dec: group.dec,
            ...diff,
            real: Math.min(Number(real), diff.base + diff.sis + diff.alt),
            pix: Math.min(Number(pix), diff.base + diff.sis + diff.alt),
          });
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSalvarDisabled) return;
    setIsSalvarDisabled(true);

    const trocoValue = Number(roundedTroco);

    try {
      if (dadosR && !valorDeve && trocoValue > 0 && !Number(total)) {
        await sendToCAndUpdateR(trocoValue);
        console.log("caiu em Pago Parte do R");

        //
      } else if (dadosR && !trocoValue && !Number(total) && !valorDeve) {
        await sendToCAndUpdateR(trocoValue);
        await Execute.PayAllMandR(idsArray);
        console.log("caiu em Pago todo R");
        //
      } else if (trocoValue < 0) {
        await Execute.removeDeve(codigo);
        await Execute.sendToDevo({
          nome,
          r,
          codigo,
          valor: Math.abs(trocoValue),
        });
        await Execute.sendToPapelC(ObjPapelC);
        await Execute.PayAllMandR(idsArray);
        console.log("Caiu em Troco Menor que Zero.");
      } else if (
        trocoValue === totalGeral &&
        Number(pix) == 0 &&
        Number(real) == 0
      ) {
        if (Number(total) > 0) {
          const novoCodigo = gerarEArmazenarCodigoAleatorio();
          //await Execute.removeDevo(codigo);
          await Execute.sendToDeve({
            deveid: novoCodigo,
            nome,
            r,
            data: Use.NowData(),
            codigo,
            valorpapel: papel,
            valorcomissao: comitions,
            valor: Number(total),
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
          const values = totalGeral - Number(total) - pixMaisReal;
          await sendToCAndUpdateR(values);
          const numPix = Number(pix) || 0;
          const numReal = Number(real) || 0;

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
        const numPix = Number(pix) || 0;
        const numReal = Number(real) || 0;

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
        const novoAvisoId = gerarEArmazenarCodigoAleatorio();
        await Execute.sendToAviso({
          avisoid: novoAvisoId,
          data: Use.NowData(),
          codigo,
          r,
          nome,
          valorpapel: papel,
          valorcomissao: comitions,
          valor: total,
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
          Number(pix),
          Number(real),
        );

        if (total > 0) {
          const novoCodigo = gerarEArmazenarCodigoAleatorio();
          await Execute.sendToDeve({
            deveid: novoCodigo,
            nome,
            r,
            data: Use.NowData(),
            codigo,
            valorpapel: papel,
            valorcomissao: comitions,
            valor: trocoValue,
          });
          await Execute.sendToPapelC({
            ...ObjPapelC,
            deveid: novoCodigo,
            papelpix:
              Number(pix) > 0 ? Math.min(Number(pix), papel) - trocoValue : 0,
            papelreal:
              Number(real) > 0
                ? Math.min(
                    Number(real),
                    papel -
                      (Number(pix) > 0 ? Math.min(Number(pix), papel) : 0) -
                      trocoValue,
                  )
                : 0,
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
            const novoCodigo = gerarEArmazenarCodigoAleatorio();
            await Execute.removeDevo(codigo);
            await Execute.sendToDeve({
              deveid: novoCodigo,
              nome,
              r,
              data: Use.NowData(),
              codigo,
              valorpapel: papel,
              valorcomissao: comitions,
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
          const novoCodigo = gerarEArmazenarCodigoAleatorio();
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
              valorpapel: papel,
              valorcomissao: comitions,
              valor: Number(total),
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
            await Execute.removeDevo(codigo);
            await Execute.removeDeve(codigo);
            await Execute.sendToDeve({
              nome,
              r,
              data: Use.NowData(),
              codigo,
              valor: value,
            });
            await Execute.sendToPapelC({
              ...ObjPapelC,
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
          await Execute.sendToCAndUpdateR(0);
          await Execute.PayAllMandR(idsArray);
          console.log("Caiu em foi Todo R e Parte Papel.");
        }
        console.log("Caiu em Tem R e Tem DEVE");
      } else if (valorDevo && totalGeral === pixMaisReal) {
        await Execute.removeDevo(codigo);
        await Execute.sendToPapelC({
          ...ObjPapelC,
          papelpix:
            Number(pix) > 0 ? Math.min(Number(pix), papel) + valorDevo : 0,
          papelreal:
            Number(real) > 0
              ? Math.min(
                  Number(real),
                  papel - (Number(pix) > 0 ? Math.min(Number(pix), papel) : 0),
                ) + valorDevo
              : 0,
        });

        console.log("Caiu em DEVO e Pagou tudo o Papel");
      } else if (Number(total) && !dadosR && !valorDeve && trocoValue) {
        const novoCodigo = gerarEArmazenarCodigoAleatorio();
        await Execute.sendToDeve({
          deveid: novoCodigo,
          nome,
          r,
          data: Use.NowData(),
          codigo,
          valorpapel: papel - pixMaisReal,
          valorcomissao: comitions,
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

      hadleUpdatePapel(
        Number(sumValues) + Number(desperdicio) + Number(perdida),
      );

      const numPix = Number(pix) || 0;
      const numReal = Number(real) || 0;

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

          await Execute.sendToPagamentos({
            nome,
            r,
            data: Use.NowData(),
            pix: pixParaPagamento,
            real: realParaPagamento,
          });
        }
      }

      setPix("");
      onPlusChange(0);
      setReal("");
      setComentario("");
      setPerdida("");
      onNomeChange("");
      onCodigoChange("");
      onValuesChange(Array(28).fill(""));
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
      onValuesChange(Array(28).fill(""));
      onPlusChange(0);
      onNomeChange(""); // Limpa o campo nome
      onCodigoChange(""); // Limpa o campo codigo
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

    try {
      if (Number(total) > 0) {
        const novoCodigo = gerarEArmazenarCodigoAleatorio();
        //await Execute.removeDevo(codigo);
        await Execute.sendToDeve({
          deveid: novoCodigo,
          nome,
          r,
          data: Use.NowData(),
          codigo,
          valorpapel: papel,
          valorcomissao: comitions,
          valor: total,
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

        // Clear form after successful operation
        setPix("");
        onPlusChange(0);
        setReal("");
        setComentario("");
        setPerdida("");
        onNomeChange("");
        onCodigoChange("");
        onValuesChange(Array(28).fill(""));
      } else {
        setShowError(true);
      }
      console.log("Deve Todo o Papel");
    } catch (error) {
      console.error("Erro ao salvar como pendente:", error);
      alert("Erro ao salvar como pendente!");
    }
  };

  const handleSaveCommentWaste = async () => {
    const activeValuesCount = values.reduce((count, currentValue) => {
      return count + (currentValue !== "" ? 1 : 0);
    }, 0);

    const dataToSave = {
      deveid: 0,
      codigo: 0,
      r,
      data: Use.NowData(),
      nome: "Desperdício",
      multi: 0,
      comissao: 0,
      papel: 0,
      papelpix: 0,
      papelreal: 0,
      encaixepix: 0,
      encaixereal: 0,
      desperdicio: (Number(desperdicio) || 0) * activeValuesCount,
      util: 0,
      perdida: Number(perdida) || 0,
      comentario,
    };

    try {
      await Execute.sendToPapelC(dataToSave);
      hadleUpdatePapel(
        Number(sumValues) + Number(desperdicio) + Number(perdida),
      );

      setComentario("");
      setPerdida("");
    } catch (error) {
      console.error("Erro ao salvar comentário e desperdício:", error);
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
  };

  const activeValuesCount = values.reduce((count, currentValue) => {
    return count + (currentValue !== "" ? 1 : 0);
  }, 0);

  const ObjPapelC = {
    deveid: 0,
    codigo,
    r,
    data: Use.NowData(),
    nome,
    multi: multiplier,
    comissao: plus || 0,
    papel: papel || 0,
    papelpix: Number(pix) > 0 ? Math.min(Number(pix), papel) : 0,
    papelreal:
      Number(real) > 0
        ? Math.min(
            Number(real),
            papel - (Number(pix) > 0 ? Math.min(Number(pix), papel) : 0),
          )
        : 0,
    encaixepix: Number(pix) > 0 ? Math.min(Number(pix), comitions) : 0,
    encaixereal:
      Number(real) > 0
        ? Math.min(
            Number(real),
            comitions -
              (Number(pix) > 0 ? Math.min(Number(pix), comitions) : 0),
          )
        : 0,
    desperdicio: (Number(desperdicio) || 0) * activeValuesCount,
    util: sumValues,
    perdida: Number(perdida) || 0,
    comentario,
  };

  const datalistId = `name-suggestions-${componentId}`;

  return (
    <div>
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
            onChange={(e) => onCodigoChange(e.target.value)}
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
            className="input input-warning input-xs w-full"
            value={nome}
            autoComplete="nope"
            list={datalistId} // Linked to datalist
            onChange={(e) => {
              const novoNome = e.target.value;
              onNomeChange(novoNome); // Update parent's nome state

              if (novoNome.length > 0) {
                const suggestions = allCadastroNames
                  .filter(
                    (item) =>
                      item.nome &&
                      item.nome.toLowerCase().includes(novoNome.toLowerCase()),
                  )
                  .map((item) => item.nome);
                setFilteredSuggestions(suggestions);
              } else {
                // Clear suggestions if input is empty
                setFilteredSuggestions([]);
              }
            }}
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
            className="input input-warning input-xs z-3 text-center text-warning font-bold"
            readOnly
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="SOMA TOTAL"
            value={displayTotalGeral}
            autoComplete="nope"
            className="input input-success input-xl z-3 text-center text-success mt-0.5 font-bold"
            readOnly
          />
        </div>
        <div className="join grid grid-cols-3 mt-0.5">
          <input
            min="0"
            step={0.01}
            type="number"
            placeholder="Pix"
            className="input input-secondary input-lg z-2 text-secondary font-bold join-item"
            value={pix}
            autoComplete="nope"
            onChange={(e) => setPix(e.target.value)}
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
            step={0.01}
            type="number"
            placeholder="Real"
            className="input input-secondary input-lg z-2 text-secondary font-bold join-item"
            value={real}
            autoComplete="nope"
            onChange={(e) => setReal(e.target.value)}
          />
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
            placeholder="Comentário"
            className="input input-primary input-xs join-item" // Ajuste de largura
            autoComplete="nope"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
          <input
            min="0"
            step={0.01}
            type="number"
            placeholder="Desperdício"
            className="input input-primary input-xs join-item"
            autoComplete="nope"
            value={perdida}
            onChange={(e) => setPerdida(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-info btn-xs join-item" // Adjust styling as needed
            onClick={handleSaveCommentWaste}
          >
            Enviar
          </button>
        </div>
      </form>
      {typeof window !== "undefined" && showError && (
        <ErrorComponent errorCode="Nulo" />
      )}
    </div>
  );
};
export default Calculadora;
