const sendTrueMR = async (id, r) => {
  try {
    const response = await fetch("/api/v1/tables/RButton", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [`r${r}`]: true }),
    });

    if (!response.ok) {
      let errorMsg = `Erro ao atualizar R${r} para ID ${id} (Status: ${response.status})`;
      try {
        // Tenta obter uma mensagem de erro mais detalhada do corpo da resposta
        const errorData = await response.json();
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch (parseError) {
        // Ignora se o corpo não for JSON válido
      }
      throw new Error(errorMsg);
    }

    const contentType = response.headers.get("content-type");
    if (
      response.status === 204 ||
      !contentType ||
      !contentType.includes("application/json")
    ) {
      return undefined;
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro em sendTrueMR (R${r}, ID ${id}):`, error);
    throw error;
  }
};

async function sendToR(itemData) {
  try {
    const idExists = await receiveFromR(itemData.r);
    const itemDataNumber = Number(itemData.id);
    const idExistsNumber = idExists.some(
      (item) => Number(item.id) === itemDataNumber,
    );

    if (idExistsNumber) {
      throw new Error("RID"); // Erro específico para ID duplicado
    }

    const response = await fetch("/api/v1/tables/R", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: itemData.id,
        dec: itemData.dec,
        r: itemData.r,
        codigo: itemData.codigo,
        nome: itemData.nome,
        sis: itemData.sis ?? 0,
        alt: itemData.alt ?? 0,
        base: itemData.base ?? 0,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error("Erro no sendToR:", error);
    throw error; // Propaga o erro para o chamador
  }
}

async function sendToDeve(itemData) {
  try {
    const response = await fetch("/api/v1/tables/deve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: itemData.nome,
        deveid: itemData.deveid,
        data: itemData.data,
        codigo: itemData.codigo,
        r: itemData.r,
        valorpapel: itemData.valorpapel,
        valorcomissao: itemData.valorcomissao,
        valor: itemData.valor,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao criar registro em Deve");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no createDeve:", error);
    throw error;
  }
}

async function sendToAviso(itemData) {
  try {
    const response = await fetch("/api/v1/tables/aviso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        avisoid: itemData.avisoid,
        data: itemData.data,
        codigo: itemData.codigo,
        r: itemData.r,
        nome: itemData.nome,
        valorpapel: itemData.valorpapel,
        valorcomissao: itemData.valorcomissao,
        valor: itemData.valor,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao criar registro em Aviso");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no createAviso:", error);
    throw error;
  }
}

async function sendToDeveUpdate(codigo, valor, r, deveIdsArray, pix, real) {
  try {
    const response = await fetch(`/api/v1/tables/deve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo,
        valor,
        r,
        deveIdsArray,
        pix,
        real,
      }),
    });

    if (!response.ok) throw new Error("Erro ao atualizar");
  } catch (error) {
    console.error("Erro ao salvar:", error);
  }
}

async function sendToDevo(itemData) {
  try {
    const response = await fetch("/api/v1/tables/devo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: itemData.nome,
        codigo: itemData.codigo,
        r: itemData.r,
        valor: itemData.valor,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao criar registro em Devo");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no createDevo:", error);
    throw error;
  }
}

async function sendToPessoal(
  letras,
  item,
  quantidade,
  unidade,
  valor,
  gastos,
  pago,
  proximo,
  dia,
  alerta,
) {
  try {
    const response = await fetch("/api/v1/tables/gastos/pessoal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        letras,
        item,
        quantidade,
        unidade,
        valor,
        gastos,
        pago,
        proximo,
        dia,
        alerta,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao criar registro em Pessoal");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no createPessoal:", error);
    throw error;
  }
}

async function sendToSaidaP(letras, gastos, valor, pago) {
  try {
    const response = await fetch("/api/v1/tables/gastos/pessoal/saida", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        letras,
        gastos,
        valor,
        pago,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Erro ao criar registro em Saida Pessoal",
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no createSaidaP:", error);
    throw error;
  }
}

async function sendToSaidaO(letras, oficina, gastos, valor, pago) {
  try {
    const response = await fetch("/api/v1/tables/gastos/oficina/saida", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        letras,
        oficina,
        gastos,
        valor,
        pago,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Erro ao criar registro em Saida Pessoal",
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no createSaidaP:", error);
    throw error;
  }
}

async function sendToOficina(
  letras,
  item,
  quantidade,
  unidade,
  valor,
  gastos,
  pago,
  proximo,
  dia,
  alerta,
) {
  try {
    const response = await fetch("/api/v1/tables/gastos/oficina", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        letras,
        item,
        quantidade,
        unidade,
        valor,
        gastos,
        pago,
        proximo,
        dia,
        alerta,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao criar registro em Oficina");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no createOficina:", error);
    throw error;
  }
}

async function sendToPapel(
  letras,
  item,
  quantidade,
  unidade,
  valor,
  gastos,
  pago,
  alerta,
  metragem,
) {
  try {
    const response = await fetch("/api/v1/tables/gastos/papel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        letras,
        item,
        quantidade,
        unidade,
        valor,
        gastos,
        pago,
        alerta,
        metragem,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao criar registro em Papel");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no createPapel:", error);
    throw error;
  }
}

async function sendToC(itemData) {
  try {
    const response = await fetch("/api/v1/tables/c", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: itemData.codigo,
        dec: itemData.dec,
        r: itemData.r,
        data: itemData.data,
        nome: itemData.nome,
        sis: itemData.sis,
        alt: itemData.alt,
        base: itemData.base,
        real: itemData.real,
        pix: itemData.pix,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao criar registro em C");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no createC:", error);
    throw error;
  }
}

async function sendToNota(itemData) {
  try {
    const response = await fetch("/api/v1/tables/nota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texto: itemData.texto,
        r: itemData.r,
        colum: itemData.colum,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao criar registro em Nota");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no create Nota:", error);
    throw error;
  }
}

async function sendToPapelC(itemData) {
  try {
    const response = await fetch("/api/v1/tables/c/papel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: itemData.codigo,
        deveid: itemData.deveid,
        r: itemData.r,
        data: itemData.data,
        nome: itemData.nome,
        multi: itemData.multi,
        papel: itemData.papel,
        papelpix: itemData.papelpix,
        papelreal: itemData.papelreal,
        encaixepix: itemData.encaixepix,
        encaixereal: itemData.encaixereal,
        desperdicio: itemData.desperdicio,
        util: itemData.util,
        perdida: itemData.perdida,
        comentarios: itemData.comentario,
        comissao: itemData.comissao,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao criar registro em C");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no createPapelC:", error);
    throw error;
  }
}
async function sendToPagamentos(itemData) {
  try {
    const response = await fetch("/api/v1/tables/pagamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData), // Send the whole itemData object
    });

    if (!response.ok) {
      let errorMsg = `Erro ao criar registro em Pagamentos (Status: ${response.status})`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch (parseError) {
        // Ignora se o corpo não for JSON válido
      }
      throw new Error(errorMsg);
    }
    return await response.json();
  } catch (error) {
    console.error("Erro no sendToPagamentos:", error);
    throw error;
  }
}

async function sendToTemp(itemData) {
  try {
    const response = await fetch("/api/v1/tables/temp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Erro desconhecido ao enviar para Temp" }));
      throw new Error(
        errorData.error || `Erro ${response.status} ao criar registro em Temp`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no sendToTemp:", error);
    throw error;
  }
}

async function receiveFromTemp() {
  try {
    const response = await fetch(`/api/v1/tables/temp`);
    if (!response.ok) throw new Error("Erro ao carregar os dados de Temp");
    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados Temp:", error);
    return [];
  }
}

async function receiveFromRDeveDevo(tableName) {
  try {
    const response = await fetch(`/api/v1/tables/${tableName}`);
    if (!response.ok) return [];

    const data = await response.json();
    // Filtrar itens que possuem ambos 'nome' e 'codigo'
    return data.rows.filter((item) => item.nome && item.codigo);
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return [];
  }
}

async function receiveFromR(r) {
  try {
    const response = await fetch(`/api/v1/tables/R?r=${r}`);
    if (!response.ok) throw new Error("Erro ao carregar os dados");
    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados R:", error);
    return [];
  }
}

async function receiveFromConfig() {
  try {
    const response = await fetch("/api/v1/tables/Config");
    if (!response.ok) throw new Error("Erro ao carregar os dados");
    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados Config:", error);
    return [];
  }
}

async function receiveFromDeve(r) {
  try {
    const response = await fetch(`/api/v1/tables/deve?r=${r}`);
    if (!response.ok) throw new Error("Erro ao carregar os dados");
    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados deve:", error);
    return [];
  }
}

async function receiveFromAviso(r) {
  try {
    const response = await fetch(`/api/v1/tables/aviso?r=${r}`);
    if (!response.ok) throw new Error("Erro ao carregar os dados");
    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados aviso:", error);
    return [];
  }
}

async function receiveFromDeveJustValor(codigo, r) {
  try {
    const response = await fetch(
      `/api/v1/tables/calculadora/deve?codigo=${codigo}&r=${r}`,
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao carregar os dados");
    }

    const data = await response.json();

    // Retorna o objeto direto com os totais
    return (
      data || {
        total_valor: 0,
      }
    );
  } catch (error) {
    console.error("Erro ao buscar dados deve:", error);
    return {
      total_valor: 0,
    };
  }
}

async function receiveFromDevoJustValor(codigo, r) {
  try {
    const response = await fetch(
      `/api/v1/tables/calculadora/devo?codigo=${codigo}&r=${r}`,
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao carregar os dados");
    }

    const data = await response.json();

    // Retorna o objeto direto com os totais
    return (
      data || {
        total_valor: 0,
      }
    );
  } catch (error) {
    console.error("Erro ao buscar dados devo:", error);
    return {
      total_valor: 0,
    };
  }
}

async function receiveFromPagamentos(r) {
  try {
    if (typeof r === "undefined" || r === null) {
      console.warn("receiveFromPagamentos: 'r' parameter is missing.");
      return [];
    }
    const response = await fetch(`/api/v1/tables/pagamentos?r=${r}`);
    if (!response.ok) {
      let errorMsg = `Error fetching pagamentos (Status: ${response.status})`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch (e) {
        // ignore if not json
      }
      throw new Error(errorMsg);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching pagamentos for r=${r}:`, error);
    return [];
  }
}
async function receiveFromDevo(r) {
  try {
    const response = await fetch(`/api/v1/tables/devo?r=${r}`);
    if (!response.ok) throw new Error("Erro ao carregar os dados");
    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados Devo:", error);
    return [];
  }
}

async function receiveFromDec(r) {
  try {
    const response = await fetch(`/api/v1/tables/dec?r=${r}`);
    if (!response.ok) throw new Error("Erro ao carregar os dados");
    const data = await response.json();
    // A API já retorna o array de linhas diretamente.
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Erro ao buscar dados Dec:", error);
    return [];
  }
}

async function receiveAnualFromC() {
  try {
    const response = await fetch(`/api/v1/tables/anual/c`);
    if (!response.ok) throw new Error("Erro ao carregar os dados");
    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados Anual C:", error);
    return [];
  }
}

async function receiveFromNota(r, colum) {
  try {
    const response = await fetch(`/api/v1/tables/nota?r=${r}&colum=${colum}`);
    if (!response.ok) throw new Error("Erro ao carregar os dados");
    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados de notas:", error);
    return [];
  }
}

async function receiveFromCGastos(letras) {
  try {
    const response = await fetch(
      `/api/v1/tables/gastos/pessoal/C?letras=${letras}`,
    );
    if (!response.ok) throw new Error("Erro ao carregar os dados");
    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados deve:", error);
    return [];
  }
}

async function receiveFromCData(codigo, data, r, dec) {
  try {
    const encodedData = encodeURIComponent(JSON.stringify(data));
    const response = await fetch(
      `/api/v1/tables/c/calculadora?codigo=${codigo}&data=${encodedData}&r=${r}&dec=${dec}`,
    );
    if (!response.ok) throw new Error("Erro ao carregar os dados");
    const result = await response.json();
    return result.exists; // Agora result é { exists: boolean }
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return false;
  }
}

async function receiveFromPapelCData(codigo, data) {
  try {
    const encodedData = encodeURIComponent(JSON.stringify(data));

    const response = await fetch(
      `/api/v1/tables/c/papel/calculadora?codigo=${codigo}&data=${encodedData}`,
    );

    if (!response.ok) throw new Error("Erro ao carregar os dados");
    const result = await response.json();

    return result.exists; // true ou false
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return false;
  }
}

async function receiveFromPapelC(r) {
  try {
    const response = await fetch(`/api/v1/tables/c/papel?r=${r}`);
    if (!response.ok) throw new Error("Erro ao carregar os dados");
    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados Papel:", error);
    return [];
  }
}

async function receiveAnualFromPapelC() {
  try {
    const response = await fetch(`/api/v1/tables/anual`);
    if (!response.ok) throw new Error("Erro ao carregar os dados");
    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados Anula Papel:", error);
    return [];
  }
}

async function receiveFromRJustBSA(codigo, r) {
  try {
    const response = await fetch(
      `/api/v1/tables/calculadora?codigo=${codigo}&r=${r}`,
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao carregar os dados");
    }

    const data = await response.json();

    // Retorna o objeto direto com os totais
    return (
      data || {
        total_base: 0,
        total_sis: 0,
        total_alt: 0,
      }
    );
  } catch (error) {
    console.error("Erro ao buscar dados R:", error);
    return {
      total_base: 0,
      total_sis: 0,
      total_alt: 0,
    };
  }
}

async function receiveFromPessoal(letras) {
  try {
    const response = await fetch(
      `/api/v1/tables/gastos/pessoal?letras=${letras}`,
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao carregar os dados");
    }

    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados Pessoal:", error);
  }
}

async function receiveFromSaidaP(letras) {
  try {
    const response = await fetch(
      `/api/v1/tables/gastos/pessoal/saida?letras=${letras}`,
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao carregar os dados");
    }

    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados Saida Pessoal:", error);
  }
}

async function receiveAnualFromSaidaP() {
  try {
    const response = await fetch(`/api/v1/tables/anual/pessoal`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao carregar os dados");
    }

    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados Anual Saida Pessoal:", error);
  }
}

async function receiveAnualFromSaidaO() {
  try {
    const response = await fetch(`/api/v1/tables/anual/oficina`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao carregar os dados");
    }

    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados Anual Saida Oficina:", error);
  }
}

async function receiveFromSaidaO(letras) {
  try {
    const response = await fetch(
      `/api/v1/tables/gastos/oficina/saida?letras=${letras}`,
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao carregar os dados");
    }

    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados Saida Oficina:", error);
  }
}

async function receiveFromSaidaOficina(oficina) {
  try {
    const response = await fetch(`/api/v1/tables/T?oficina=${oficina}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao carregar os dados");
    }

    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados Saida Oficina:", error);
  }
}

async function receiveFromOficina(letras) {
  try {
    const response = await fetch(
      `/api/v1/tables/gastos/oficina?letras=${letras}`,
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao carregar os dados");
    }

    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados Oficina:", error);
  }
}

async function receiveFromPapel(letras) {
  try {
    const response = await fetch(
      `/api/v1/tables/gastos/papel?letras=${letras}`,
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao carregar os dados");
    }

    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados Papel:", error);
  }
}

async function receiveFromPapelByItem(item) {
  try {
    const response = await fetch(`/api/v1/tables/gastos/papel?item=${item}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao carregar os dados");
    }

    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados Papel por item:", error);
  }
}

async function receiveFromCad(codigo) {
  try {
    const response = await fetch(
      `/api/v1/tables/calculadora/cadastro?codigo=${codigo}`,
    );

    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados comentario:", error);
  }
}

async function receiveAllCad() {
  try {
    const response = await fetch("/api/v1/tables/cadastro");
    if (!response.ok)
      throw new Error("Erro ao carregar todos os dados de cadastro");
    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar todos os dados de cadastro:", error);
    return [];
  }
}

async function receiveFromPapelCalculadora(oficina) {
  try {
    const response = await fetch(
      `/api/v1/tables/calculadora/papel?oficina=${oficina}`,
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao carregar os dados");
    }

    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados Papel:", error);
  }
}

async function removeMandR(id) {
  const response = await fetch("/api/v1/tables", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }), // Envia o `id` no corpo da requisição
  });

  const response2 = await fetch("/api/v1/tables/R", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }), // Envia o `id` no corpo da requisição
  });

  const result = await response.json();
  console.log(result);

  const result2 = await response2.json();
  console.log(result2);
}

async function PayAllMandR(ids) {
  if (!Array.isArray(ids)) {
    console.error("PayAllMandR expects an array of IDs.");
    return;
  }

  for (const id of ids) {
    try {
      // Atualiza Mtable, definindo r4 = true
      const response = await fetch("/api/v1/tables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, r4: true }),
      });

      // Deleta de RBSA
      const response2 = await fetch("/api/v1/tables/R", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok || !response2.ok) {
        console.error(`Falha ao processar o ID ${id}.`);
        // Continuar para o próximo ID
      }
    } catch (error) {
      console.error(`Erro ao processar o ID ${id}:`, error);
    }
  }
}

async function removeC(id) {
  const response = await fetch("/api/v1/tables/c", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }), // Envia o `id` no corpo da requisição
  });

  const result = await response.json();
  console.log(result);
}

async function removeNota(id) {
  const response = await fetch("/api/v1/tables/nota", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }), // Envia o `id` no corpo da requisição
  });

  const result = await response.json();
  console.log(result);
}

async function removePapelC(id) {
  const response = await fetch("/api/v1/tables/c/papel", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }), // Envia o `id` no corpo da requisição
  });

  const result = await response.json();
  console.log(result);
}
async function removePessoal(id) {
  const response = await fetch("/api/v1/tables/gastos/pessoal", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }), // Envia o `id` no corpo da requisição
  });

  const result = await response.json();
  console.log(result);
}

async function removeSaidaP(id) {
  const response = await fetch("/api/v1/tables/gastos/pessoal/saida", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }), // Envia o `id` no corpo da requisição
  });

  const result = await response.json();
  console.log(result);
}

async function removeSaidaO(id) {
  const response = await fetch("/api/v1/tables/gastos/oficina/saida", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }), // Envia o `id` no corpo da requisição
  });

  const result = await response.json();
  console.log(result);
}

async function removeOficina(id) {
  const response = await fetch("/api/v1/tables/gastos/oficina", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }), // Envia o `id` no corpo da requisição
  });

  const result = await response.json();
  console.log(result);
}

async function removePapel(id) {
  const response = await fetch("/api/v1/tables/gastos/papel", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }), // Envia o `id` no corpo da requisição
  });

  const result = await response.json();
  console.log(result);
}

async function removeDeve(codigo) {
  const response = await fetch("/api/v1/tables/deve", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo }),
  });

  const result = await response.json();
  console.log(result);
}

async function removeDeveById(deveid) {
  try {
    const response = await fetch("/api/v1/tables/deve", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deveid }),
    });
    if (!response.ok) {
      throw new Error("Falha ao remover dívida");
    }
    return await response.json();
  } catch (error) {
    console.error("Erro em removeDeveById:", error);
    throw error;
  }
}

async function removeAviso(avisoid) {
  try {
    const response = await fetch("/api/v1/tables/aviso", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avisoid }),
    });

    if (!response.ok) {
      throw new Error("Falha ao remover o aviso");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro em removeAviso:", error);
    throw error;
  }
}

async function removeDevo(codigo) {
  const response = await fetch("/api/v1/tables/devo", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo }),
  });

  const result = await response.json();
  console.log(result);
}

async function updateDevo(codigo, valor) {
  try {
    const response = await fetch(`/api/v1/tables/devo`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, valor }),
    });

    if (!response.ok) throw new Error("Erro ao atualizar Devo");
    return await response.json();
  } catch (error) {
    console.error("Erro no updateDevo:", error);
    throw error;
  }
}

async function removeDevoById(id, r) {
  const response = await fetch("/api/v1/tables/calculadora/devo", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, r }),
  });

  const result = await response.json();
  console.log(result);
}

async function removeTemp(itemId) {
  try {
    const response = await fetch(`/api/v1/tables/temp`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: itemId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `Erro ao excluir item Temp ${itemId} (Status: ${response.status})`,
      }));
      throw new Error(errorData.error || `Erro HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erro em removeTemp (ID ${itemId}):`, error);
    throw error;
  }
}

async function removePagamentoById(id) {
  try {
    const response = await fetch(`/api/v1/tables/pagamentos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }), // Send ID in the body
    });

    if (!response.ok) {
      let errorMsg = `Erro ao excluir pagamento ID ${id} (Status: ${response.status})`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch (parseError) {
        // Ignore if body is not valid JSON
      }
      throw new Error(errorMsg);
    }
    // Handle 204 No Content or non-JSON responses
    if (
      response.status === 204 ||
      !response.headers.get("content-type")?.includes("application/json")
    ) {
      return { message: `Pagamento com ID ${id} deletado com sucesso.` };
    }
    return await response.json();
  } catch (error) {
    console.error(`Erro em removePagamentoById (ID ${id}):`, error);
    throw error;
  }
}

async function deleteAllPagamentos() {
  try {
    const response = await fetch(`/api/v1/tables/pagamentos`, {
      // Sem query param 'r'
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      let errorMsg = `Erro ao deletar todos os pagamentos (Status: ${response.status})`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch (parseError) {
        // Ignora se o corpo não for JSON válido
      }
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error(`Erro em deleteAllPagamentos:`, error);
    throw error;
  }
}

const loginUser = async (username, password) => {
  try {
    const response = await fetch("/api/v1/tables/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      let errorMsg = `Erro ao tentar fazer login (Status: ${response.status})`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch (parseError) {
        // Ignora se o corpo não for JSON válido
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro em loginUser:`, error);
    throw error;
  }
};

async function receiveUsers() {
  try {
    const response = await fetch("/api/v1/tables/login"); // GET request by default
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Erro ao carregar usuários (Status: ${response.status})`,
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return []; // Return empty array on error to prevent crashes
  }
}

async function updateUser(userData) {
  try {
    const response = await fetch("/api/v1/tables/login", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData), // userData should include id, usuario, senha
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Try to parse error
      throw new Error(
        errorData.message ||
          `Erro ao atualizar usuário (Status: ${response.status})`,
      );
    }
    return await response.json(); // Expecting the updated user object back
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error; // Re-throw to be handled by the component
  }
}

async function receiveFromC(r) {
  try {
    // Este endpoint agora busca todos os itens, ativos e finalizados.
    const response = await fetch(
      `/api/v1/tables/c?r=${r}&includeFinished=true`,
    );
    if (!response.ok) throw new Error("Erro ao carregar todos os dados de C");
    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar todos os dados de C:", error);
    return [];
  }
}

async function receiveFromPlotterC(r) {
  try {
    const response = await fetch(`/api/v1/tables/c/plotter?r=${r}`);
    if (!response.ok) throw new Error("Erro ao carregar os dados de PlotterC");
    const data = await response.json();
    return Array.isArray(data.rows) ? data.rows : [];
  } catch (error) {
    console.error("Erro ao buscar dados PlotterC:", error);
    return [];
  }
}

async function removePlotterC(id) {
  const response = await fetch("/api/v1/tables/c/plotter", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });

  const result = await response.json();
  console.log(result);
}

async function swapSimNaoPlotterC(id) {
  try {
    const response = await fetch("/api/v1/tables/c/plotter", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      throw new Error("Erro ao trocar Sim e Não");
    }
  } catch (error) {
    console.error("Erro em swapSimNaoPlotterC:", error);
    throw error;
  }
}

async function archiveAllFinalizado(r) {
  try {
    const response = await fetch("/api/v1/tables/c/plotter/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ r }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao arquivar registros.");
    }
    return await response.json();
  } catch (error) {
    console.error("Erro em archiveAllFinalizado:", error);
    throw error;
  }
}

const execute = {
  archiveAllFinalizado,
  receiveFromPlotterC,
  removePlotterC,
  swapSimNaoPlotterC,
  sendTrueMR,
  sendToR,
  sendToDeve,
  sendToAviso,
  sendToDeveUpdate,
  sendToDevo,
  sendToC,
  sendToNota,
  sendToPessoal,
  sendToSaidaP,
  sendToSaidaO,
  sendToOficina,
  sendToPapel,
  sendToPapelC,
  sendToPagamentos,
  receiveFromTemp,
  sendToTemp,
  receiveFromC,
  receiveAnualFromC,
  receiveFromCGastos,
  receiveFromPessoal,
  receiveFromSaidaP,
  receiveAnualFromSaidaP,
  receiveAnualFromSaidaO,
  receiveFromSaidaO,
  receiveFromSaidaOficina,
  receiveFromOficina,
  receiveFromCData,
  receiveAnualFromPapelC,
  receiveFromConfig,
  receiveFromPapel,
  receiveFromPapelByItem,
  receiveFromPapelCalculadora,
  receiveFromPapelC,
  receiveFromPapelCData,
  receiveFromRDeveDevo,
  receiveFromDeve,
  receiveFromAviso,
  receiveFromDec,
  receiveFromDeveJustValor,
  receiveFromDevo,
  receiveFromDevoJustValor,
  receiveFromNota,
  receiveFromPagamentos,
  receiveFromR,
  receiveFromRJustBSA,
  receiveAllCad, // Added
  receiveFromCad,
  removeC,
  removeNota,
  removePapel,
  removePapelC,
  removePessoal,
  removeSaidaP,
  removeSaidaO,
  removeOficina,
  removeMandR,
  PayAllMandR,
  removeDeve,
  removeDeveById,
  removeAviso,
  removeDevo,
  updateDevo,
  removeDevoById,
  removePagamentoById,
  removeTemp,
  deleteAllPagamentos,
  loginUser,
  receiveUsers, // Added
  updateUser, // Added
};

export default execute;
