import database from "infra/database.js";

async function notifyWebSocketServer(data) {
  const wsNotifyUrl = process.env.RAILWAY_WB
    ? `https://${process.env.RAILWAY_WB}/broadcast`
    : null;

  if (!wsNotifyUrl) {
    console.warn(
      "RAILWAY_WB environment variable is not set. WebSocket notification will be skipped.",
    );
    return;
  }

  try {
    const response = await fetch(wsNotifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        `Erro WebSocket (${response.status}) ao enviar notificação: ${errorData}. Dados:`,
        data,
      );
    } else {
      // console.log("Notificação WebSocket enviada com sucesso:", data);
    }
  } catch (error) {
    console.error(
      "Falha ao conectar/enviar notificação WebSocket:",
      error,
      "Dados:",
      data,
    );
  }
}

async function createC(ordemInputValues) {
  const result = await database.query({
    text: `
      INSERT INTO "C" (codigo,dec, data, nome, sis, alt, base, real, pix, r) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `,
    values: [
      ordemInputValues.codigo,
      ordemInputValues.dec,
      ordemInputValues.data,
      ordemInputValues.nome,
      ordemInputValues.sis,
      ordemInputValues.alt,
      ordemInputValues.base,
      ordemInputValues.real,
      ordemInputValues.pix,
      ordemInputValues.r,
    ],
  });

  return result;
}

async function createNota(ordemInputValues) {
  const result = await database.query({
    text: `
      INSERT INTO "Nota" (texto, r, colum) 
      VALUES ($1, $2, $3)
      RETURNING *;
    `,
    values: [
      ordemInputValues.texto,
      ordemInputValues.r,
      ordemInputValues.colum,
    ],
  });

  return result;
}

async function createPessoal(ordemInputValues) {
  const result = await database.query({
    text: `
      INSERT INTO "Pessoal" (dec, item, quantidade, unidade, valor, gastos, pago, proximo, dia, alerta) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `,
    values: [
      ordemInputValues.letras,
      ordemInputValues.item,
      ordemInputValues.quantidade,
      ordemInputValues.unidade,
      ordemInputValues.valor,
      ordemInputValues.gastos,
      ordemInputValues.pago,
      ordemInputValues.proximo,
      ordemInputValues.dia,
      ordemInputValues.alerta,
    ],
  });

  return result;
}

async function createSaidaP(ordemInputValues) {
  const result = await database.query({
    text: `
      INSERT INTO "SaidaP" (dec, gastos, valor, pago) 
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `,
    values: [
      ordemInputValues.letras,
      ordemInputValues.gastos,
      ordemInputValues.valor,
      ordemInputValues.pago,
    ],
  });

  return result;
}

async function createSaidaO(ordemInputValues) {
  const result = await database.query({
    text: `
      INSERT INTO "SaidaO" (dec, oficina, gastos, valor, pago) 
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `,
    values: [
      ordemInputValues.letras,
      ordemInputValues.oficina,
      ordemInputValues.gastos,
      ordemInputValues.valor,
      ordemInputValues.pago,
    ],
  });

  return result;
}

async function createOficina(ordemInputValues) {
  const result = await database.query({
    text: `
      INSERT INTO "Oficina" (dec, item, quantidade, unidade, valor, gastos, pago, proximo, dia, alerta) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `,
    values: [
      ordemInputValues.letras,
      ordemInputValues.item,
      ordemInputValues.quantidade,
      ordemInputValues.unidade,
      ordemInputValues.valor,
      ordemInputValues.gastos,
      ordemInputValues.pago,
      ordemInputValues.proximo,
      ordemInputValues.dia,
      ordemInputValues.alerta,
    ],
  });

  return result;
}

async function createPapel(ordemInputValues) {
  const result = await database.query({
    text: `
      INSERT INTO "Papel" (dec, item, quantidade, unidade, valor, gastos, pago, alerta, metragem) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `,
    values: [
      ordemInputValues.letras,
      ordemInputValues.item,
      ordemInputValues.quantidade,
      ordemInputValues.unidade,
      ordemInputValues.valor,
      ordemInputValues.gastos,
      ordemInputValues.pago,
      ordemInputValues.alerta,
      ordemInputValues.metragem,
    ],
  });

  return result;
}

async function createPapelC(ordemInputValues) {
  const result = await database.query({
    text: `
      INSERT INTO "PapelC" (deveid, codigo, data, nome, multi, papel, papelpix, papelreal, encaixepix, encaixereal, desperdicio, util, perdida, comentarios, r, comissao ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *;
    `,
    values: [
      ordemInputValues.deveid,
      ordemInputValues.codigo,
      ordemInputValues.data,
      ordemInputValues.nome,
      ordemInputValues.multi,
      ordemInputValues.papel,
      ordemInputValues.papelpix,
      ordemInputValues.papelreal,
      ordemInputValues.encaixepix,
      ordemInputValues.encaixereal,
      ordemInputValues.desperdicio,
      ordemInputValues.util,
      ordemInputValues.perdida,
      ordemInputValues.comentarios,
      ordemInputValues.r,
      ordemInputValues.comissao,
    ],
  });

  return result;
}

async function createM(ordemInputValues) {
  const result = await database.query({
    text: `
      INSERT INTO "Mtable" (oficina, observacao, codigo, dec, nome, sis, base, alt) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `,
    values: [
      ordemInputValues.oficina,
      ordemInputValues.observacao,
      ordemInputValues.codigo,
      ordemInputValues.dec,
      ordemInputValues.nome,
      ordemInputValues.sis,
      ordemInputValues.base,
      ordemInputValues.alt,
    ],
  });

  return result;
}

async function createRBSA(ordemInputValues) {
  const result = await database.query({
    text: `
      INSERT INTO "RBSA" (id, dec, r, codigo, nome, sis, alt, base) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `,
    values: [
      ordemInputValues.id,
      ordemInputValues.dec,
      ordemInputValues.r,
      ordemInputValues.codigo,
      ordemInputValues.nome,
      ordemInputValues.sis,
      ordemInputValues.alt,
      ordemInputValues.base,
    ],
  });

  return result;
}
async function createDevo(ordemInputValues) {
  const result = await database.query({
    text: `
      INSERT INTO "Devo" (codigo, nome, valor, r) 
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `,
    values: [
      ordemInputValues.codigo,
      ordemInputValues.nome,
      ordemInputValues.valor,
      ordemInputValues.r,
    ],
  });

  return result;
}

async function createDeve(ordemInputValues) {
  const result = await database.query({
    text: `
      INSERT INTO "Deve" (deveid, codigo, nome, valor, data, r, valorpapel, valorcomissao) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `,
    values: [
      ordemInputValues.deveid,
      ordemInputValues.codigo,
      ordemInputValues.nome,
      ordemInputValues.valor,
      ordemInputValues.data,
      ordemInputValues.r,
      ordemInputValues.valorpapel,
      ordemInputValues.valorcomissao,
    ],
  });

  return result;
}

async function createAviso(ordemInputValues) {
  const result = await database.query({
    text: `
      INSERT INTO "Aviso" (avisoid, data, codigo, r, nome, valorpapel, valorcomissao, valor) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `,
    values: [
      ordemInputValues.avisoid,
      ordemInputValues.data,
      ordemInputValues.codigo,
      ordemInputValues.r,
      ordemInputValues.nome,
      ordemInputValues.valorpapel,
      ordemInputValues.valorcomissao,
      ordemInputValues.valor,
    ],
  });

  return result;
}

async function createTemp(tempData) {
  const valuesPlaceholders = Array.from(
    { length: 28 },
    (_, i) => `$${i + 7}`,
  ).join(", ");
  const valuesColumns = Array.from(
    { length: 28 },
    (_, i) => `v${String(i + 1).padStart(2, "0")}`,
  ).join(", ");

  const result = await database.query({
    text: `
      INSERT INTO "Temp" (nome, codigo, multi, r, data, comissao, ${valuesColumns})
      VALUES ($1, $2, $3, $4, $5, $6, ${valuesPlaceholders})
      RETURNING *;
    `,
    values: [
      tempData.nome,
      tempData.codigo,
      tempData.multi,
      tempData.r,
      tempData.data,
      tempData.comissao,
      ...tempData.values_array,
    ],
  });
  return result.rows[0];
}

async function createPagamento(pagamentoData) {
  // Ensure you have a "Pagamentos" table with columns: nome, r, data, pix, real, etc.
  // Adjust column names and placeholders ($1, $2, etc.) as per your table structure.
  const result = await database.query({
    text: `
      INSERT INTO "Pagamentos" (nome, r, data, pix, real) 
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *; 
    `,
    values: [
      pagamentoData.nome,
      pagamentoData.r,
      pagamentoData.data, // Ensure this is in a format PostgreSQL understands (e.g., ISO string)
      parseFloat(pagamentoData.pix) || 0,
      parseFloat(pagamentoData.real) || 0,
    ],
  });
  return result; // The handler expects result.rows[0]
}

async function updateAltSis(updatedData) {
  const { id, r1, r2, r3, r4, ...otherFields } = updatedData; // Desestruture r1, r2, r3

  const updatableFields = ["observacao", "dec", "nome", "sis", "alt"].filter(
    (field) => otherFields[field] !== undefined,
  );

  const queryValues = updatableFields.map((field) => otherFields[field]);
  let placeholderIndex = 1;

  const setClauses = updatableFields.map(
    (field) => `"${field}" = $${placeholderIndex++}`,
  );

  // Adicione r1, r2, r3 e r4 com cast explícito para BOOLEAN
  if (r1 !== undefined) {
    setClauses.push(`"r1" = $${placeholderIndex++}::BOOLEAN`);
    queryValues.push(r1);
  }
  if (r2 !== undefined) {
    setClauses.push(`"r2" = $${placeholderIndex++}::BOOLEAN`);
    queryValues.push(r2);
  }
  if (r3 !== undefined) {
    setClauses.push(`"r3" = $${placeholderIndex++}::BOOLEAN`);
    queryValues.push(r3);
  }
  if (r4 !== undefined) {
    setClauses.push(`"r4" = $${placeholderIndex++}::BOOLEAN`);
    queryValues.push(r4);
  }

  if (setClauses.length === 0) {
    return { rows: [] };
  }

  let whereClause;
  if (Array.isArray(id)) {
    const idPlaceholders = id.map(() => `$${placeholderIndex++}`).join(", ");
    whereClause = `id IN (${idPlaceholders})`;
    queryValues.push(...id);
  } else {
    whereClause = `id = $${placeholderIndex++}`;
    queryValues.push(id);
  }

  const queryText = `
    UPDATE "Mtable"
    SET ${setClauses.join(", ")}
    WHERE ${whereClause}
    RETURNING *;
  `;

  return database.query({
    text: queryText,
    values: queryValues,
  });
}

async function updateC(updatedData) {
  const result = await database.query({
    text: `
      UPDATE "C"
      SET 
        nome = $1,
        base = $2,
        sis = $3,
        alt = $4,
        real = $5,
        pix = $6
      WHERE id = $7
      RETURNING *;
    `,
    values: [
      updatedData.nome,
      updatedData.base,
      updatedData.sis,
      updatedData.alt,
      updatedData.real,
      updatedData.pix,
      updatedData.id,
    ],
  });

  return result;
}

async function updateDec(updatedData) {
  const client = await database.getNewClient();
  try {
    const setClauses = [];
    const queryValues = [];
    let placeholderIndex = 1;

    // Handle 'on' state
    if (updatedData.on !== undefined) {
      setClauses.push(`"on" = $${placeholderIndex++}`);
      queryValues.push(updatedData.on);
    }

    if (updatedData.on === false) {
      // Explicitly setting values (e.g., to 0 when turning off)
      if (updatedData.sis !== undefined) {
        setClauses.push(`sis = $${placeholderIndex++}`);
        queryValues.push(Number(updatedData.sis));
      }
      if (updatedData.base !== undefined) {
        setClauses.push(`base = $${placeholderIndex++}`);
        queryValues.push(Number(updatedData.base));
      }
      if (updatedData.alt !== undefined) {
        setClauses.push(`alt = $${placeholderIndex++}`);
        queryValues.push(Number(updatedData.alt));
      }
    } else {
      if (updatedData.sis !== undefined) {
        setClauses.push(`sis = COALESCE(sis, 0) + $${placeholderIndex++}`);
        queryValues.push(Number(updatedData.sis));
      }
      if (updatedData.base !== undefined) {
        setClauses.push(`base = COALESCE(base, 0) + $${placeholderIndex++}`);
        queryValues.push(Number(updatedData.base));
      }
      if (updatedData.alt !== undefined) {
        setClauses.push(`alt = COALESCE(alt, 0) + $${placeholderIndex++}`);
        queryValues.push(Number(updatedData.alt));
      }
    }

    if (setClauses.length === 0) {
      throw new Error(
        "updateDec: No fields to update were provided in the payload.",
      );
    }

    if (!updatedData.r || !updatedData.dec) {
      throw new Error(
        "updateDec: 'r' and 'dec' are required for the WHERE clause.",
      );
    }

    queryValues.push(updatedData.r, updatedData.dec);

    const queryText = `
      UPDATE "Dec"
      SET ${setClauses.join(", ")}
      WHERE r = $${placeholderIndex++} AND dec = $${placeholderIndex++}
      RETURNING *;
    `;

    const result = await client.query(queryText, queryValues);

    if (result.rows.length > 0) {
      await notifyWebSocketServer({
        type: "DEC_UPDATED_ITEM",
        payload: result.rows[0],
      });
    }
    return result;
  } catch (error) {
    console.error("Error in updateDec:", error);
    throw error; // Re-throw the error to be handled by the caller
  } finally {
    await client.release();
  }
}

async function updateNota(updatedData) {
  const result = await database.query({
    text: `
      UPDATE "Nota"
      SET 
        texto = $1
      WHERE id = $2
      RETURNING *;
    `,
    values: [updatedData.texto, updatedData.id],
  });

  return result;
}

async function updateConfig(updatedData) {
  const result = await database.query({
    text: `
      UPDATE "config"
      SET 
        m = $1,
        e = $2,
        d = $3
      WHERE id = $4
      RETURNING *;
    `,
    values: [updatedData.m, updatedData.e, updatedData.d, updatedData.id],
  });

  return result;
}

async function updateCBSA(codigo, data, r, dec, newValues) {
  return await database.query({
    text: `UPDATE "C"
           SET
             sis  = sis  + $5,
             alt  = alt  + $6,
             base = base + $7,
             real = real + $8,
             pix  = pix  + $9
           WHERE codigo = $1
             AND data   = $2
             AND r      = $3
             AND dec    = $4
           RETURNING *;`,
    values: [
      codigo,
      data,
      r,
      dec,
      newValues.sis,
      newValues.alt,
      newValues.base,
      newValues.real,
      newValues.pix,
    ],
  });
}

async function updatePapelC(updatedData) {
  const result = await database.query({
    text: `
      UPDATE "PapelC"
      SET 
        nome = $1,
        multi = $2,
        papel = $3,
        papelpix = $4,
        papelreal = $5,
        encaixereal = $6,
        encaixepix = $7,
        desperdicio = $8,
        util = $9,
        perdida = $10,
        comentarios = $11
      WHERE id = $12
      RETURNING *;
    `,
    values: [
      updatedData.nome,
      updatedData.multi,
      updatedData.papel,
      updatedData.papelpix,
      updatedData.papelreal,
      updatedData.encaixereal,
      updatedData.encaixepix,
      updatedData.desperdicio,
      updatedData.util,
      updatedData.perdida,
      updatedData.comentarios,
      updatedData.id,
    ],
  });

  return result;
}

async function updatePessoal(updatedData) {
  const result = await database.query({
    text: `
      UPDATE "Pessoal"
      SET 
        item = $1,
        quantidade = $2,
        unidade = $3,
        valor = $4,
        gastos = $5,
        pago = $6,
        proximo = $7,
        dia = $8,
        alerta = $9
      WHERE id = $10
      RETURNING *;
    `,
    values: [
      updatedData.item,
      updatedData.quantidade,
      updatedData.unidade,
      updatedData.valor,
      updatedData.gastos,
      updatedData.pago,
      updatedData.proximo,
      updatedData.dia,
      updatedData.alerta,
      updatedData.id,
    ],
  });

  return result;
}

async function updateSaidaP(updatedData) {
  const result = await database.query({
    text: `
      UPDATE "SaidaP"
      SET 
        gastos = $1,
        valor = $2
      WHERE id = $3
      RETURNING *;
    `,
    values: [updatedData.gastos, updatedData.valor, updatedData.id],
  });

  return result;
}

async function updateSaidaO(updatedData) {
  const result = await database.query({
    text: `
      UPDATE "SaidaO"
      SET 
        gastos = $1,
        valor = $2
      WHERE id = $3
      RETURNING *;
    `,
    values: [updatedData.gastos, updatedData.valor, updatedData.id],
  });

  return result;
}

async function updateOficina(updatedData) {
  const result = await database.query({
    text: `
      UPDATE "Oficina"
      SET 
        item = $1,
        quantidade = $2,
        unidade = $3,
        valor = $4,
        gastos = $5,
        pago = $6,
        proximo = $7,
        dia = $8,
        alerta = $9
      WHERE id = $10
      RETURNING *;
    `,
    values: [
      updatedData.item,
      updatedData.quantidade,
      updatedData.unidade,
      updatedData.valor,
      updatedData.gastos,
      updatedData.pago,
      updatedData.proximo,
      updatedData.dia,
      updatedData.alerta,
      updatedData.id,
    ],
  });

  return result;
}

async function updatePapel(updatedData) {
  const result = await database.query({
    text: `
      UPDATE "Papel"
      SET
        item = COALESCE($1, item),
        quantidade = COALESCE($2, quantidade),
        unidade = COALESCE($3, unidade),
        valor = COALESCE($4, valor),
        gastos = COALESCE($5, gastos),
        pago = COALESCE($6, pago),
        alerta = COALESCE($7, alerta),
        metragem = COALESCE($8, metragem)
      WHERE id = $9
      RETURNING *;
    `,
    values: [
      updatedData.item !== undefined ? updatedData.item : null,
      updatedData.quantidade !== undefined ? updatedData.quantidade : null,
      updatedData.unidade !== undefined ? updatedData.unidade : null,
      updatedData.valor !== undefined ? updatedData.valor : null,
      updatedData.gastos !== undefined ? updatedData.gastos : null,
      updatedData.pago !== undefined ? updatedData.pago : null,
      updatedData.alerta !== undefined ? updatedData.alerta : null,
      updatedData.metragem !== undefined ? updatedData.metragem : null,
      updatedData.id,
    ],
  });

  return result;
}

async function updateRButton(updatedData) {
  // Extrai a chave dinâmica (ex: 'r1', 'r2') dos dados recebidos
  const rColumn = Object.keys(updatedData).find(
    (key) => key.startsWith("r") && key !== "id" && /^r\d+$/.test(key), // Valida o formato 'r' seguido de números
  );

  if (!rColumn) {
    throw new Error("Coluna R inválida");
  }

  // Usa a coluna identificada na query SQL
  const result = await database.query({
    text: `
      UPDATE "Mtable"
        SET ${rColumn} = $1
        WHERE id = $2
          AND r1 = false
          AND r2 = false
          AND r3 = false
        RETURNING *;
    `,
    values: [true, updatedData.id],
  });

  return result.rows[0];
}

async function updateAltSisR(updatedData) {
  const result = await database.query({
    text: `
      UPDATE "RBSA"
      SET 
        nome = $1,
        base = $2,
        sis = $3,
        alt = $4
      WHERE id = $5
      RETURNING *;
    `,
    values: [
      updatedData.nome,
      updatedData.base || 0,
      updatedData.sis || 0,
      updatedData.alt || 0,
      updatedData.id,
    ],
  });

  return result;
}

// models/tables.js

async function updateRCalculadora(updatedDataArray) {
  if (!Array.isArray(updatedDataArray) || updatedDataArray.length === 0) {
    throw new Error("updateRCalculadora: precisa receber um array não-vazio");
  }

  // todas as linhas têm mesmo codigo e r
  const { codigo, r } = updatedDataArray[0];

  // preparamos só o dec + valores que serão desejados
  const simpleUpdates = updatedDataArray.map(({ dec, base, sis, alt }) => ({
    dec,
    base: Number(base) || 0,
    sis: Number(sis) || 0,
    alt: Number(alt) || 0,
  }));

  const result = await database.query({
    text: `
      WITH updates AS (
        -- converte o JSONB em tabela (uma linha por dec)
        SELECT
          u.dec,
          u.base  AS desired_base,
          u.sis   AS desired_sis,
          u.alt   AS desired_alt
        FROM jsonb_to_recordset($1::jsonb) AS u(
          dec     text,
          base    numeric,
          sis     numeric,
          alt     numeric
        )
      ),
      current_totals AS (
        -- soma os valores atuais por dec
        SELECT
          dec,
          COALESCE(SUM(base),0) AS total_base,
          COALESCE(SUM(sis),0)  AS total_sis,
          COALESCE(SUM(alt),0)  AS total_alt
        FROM "RBSA"
        WHERE codigo = $2
          AND r      = $3
        GROUP BY dec
      ),
      diffs AS (
        -- para cada dec, quanto precisa subtrair do total
        SELECT
          ct.dec,
          (ct.total_base - u.desired_base) AS diff_base,
          (ct.total_sis  - u.desired_sis)  AS diff_sis,
          (ct.total_alt  - u.desired_alt)  AS diff_alt,
          ct.total_base,
          ct.total_sis,
          ct.total_alt
        FROM updates u
        JOIN current_totals ct
          ON ct.dec = u.dec
      )
      UPDATE "RBSA" AS r1
      SET
        base = CASE
          WHEN d.total_base = 0 THEN 0
          ELSE r1.base
               - d.diff_base * (r1.base / d.total_base)
        END,
        sis = CASE
          WHEN d.total_sis = 0 THEN 0
          ELSE r1.sis
               - d.diff_sis  * (r1.sis  / d.total_sis)
        END,
        alt = CASE
          WHEN d.total_alt = 0 THEN 0
          ELSE r1.alt
               - d.diff_alt  * (r1.alt  / d.total_alt)
        END
      FROM diffs d
      WHERE
        r1.codigo = $2
        AND r1.r      = $3
        AND r1.dec    = d.dec
      RETURNING r1.*;
    `,
    values: [
      JSON.stringify(simpleUpdates), // $1: JSONB com [ {dec, base, sis, alt}, ... ]
      codigo, // $2
      r, // $3
    ],
  });

  return result.rows;
}

async function updateBase(updatedData) {
  const result = await database.query({
    text: `
      UPDATE "Mtable"
      SET 
        observacao = $1,
        dec = $2,
        nome = $3,
        base = $4
      WHERE id = $5
      RETURNING *;
    `,
    values: [
      updatedData.observacao,
      updatedData.dec,
      updatedData.nome,
      updatedData.base,
      updatedData.id,
    ],
  });

  return result;
}
async function updateDeveCalculadora(updatedData) {
  const result = await database.query({
    text: `
      UPDATE "Deve"
      SET avisado = $1
      WHERE codigo = $2 AND r = $3 AND deveid = $4
      RETURNING *;
    `,
    values: [
      updatedData.avisado,
      updatedData.codigo,
      updatedData.r,
      updatedData.deveid,
    ],
  });

  if (result.rows.length > 0) {
    await notifyWebSocketServer({
      type: "DEVE_UPDATED_ITEM",
      payload: result.rows[0],
    });
    return result.rows[0];
  }

  return null;
}

async function updateDeve(updatedData) {
  const client = await database.getNewClient();
  const { codigo, r, pix, real } = updatedData;
  let totalPayment = (parseFloat(pix) || 0) + (parseFloat(real) || 0);

  try {
    await client.query("BEGIN");

    const { rows: deves } = await client.query({
      text: `SELECT * FROM "Deve" WHERE codigo = $1 AND r = $2 AND valor > 0 ORDER BY data ASC`,
      values: [codigo, r],
    });

    const updatedDeves = [];
    const updatedPapelCs = [];
    const deletedDevesIds = [];

    for (const deve of deves) {
      if (totalPayment <= 0) break;

      const paymentForThisDeve = Math.min(totalPayment, parseFloat(deve.valor));
      const remainingDeveValor = parseFloat(deve.valor) - paymentForThisDeve;

      const valorPapelOriginal = parseFloat(deve.valorpapel) || 0;
      const valorComissaoOriginal = parseFloat(deve.valorcomissao) || 0;
      const valorTotalOriginal = valorPapelOriginal + valorComissaoOriginal;

      let paidPapel = 0;
      let paidComissao = 0;

      if (valorTotalOriginal > 0) {
        paidPapel =
          paymentForThisDeve * (valorPapelOriginal / valorTotalOriginal);
        paidComissao =
          paymentForThisDeve * (valorComissaoOriginal / valorTotalOriginal);
      } else {
        paidPapel = paymentForThisDeve / 2;
        paidComissao = paymentForThisDeve / 2;
      }

      const remainingValorPapel = valorPapelOriginal - paidPapel;
      const remainingValorComissao = valorComissaoOriginal - paidComissao;

      if (remainingDeveValor <= 0) {
        // Delete the Deve row if its value becomes 0 or less
        await client.query({
          text: `DELETE FROM "Deve" WHERE deveid = $1;`,
          values: [deve.deveid],
        });
        deletedDevesIds.push(deve.deveid);
      } else {
        // Update the Deve row if its value is still positive
        const { rows: updatedDeveRows } = await client.query({
          text: `
            UPDATE "Deve"
            SET 
              valor = $1,
              valorpapel = $2,
              valorcomissao = $3
            WHERE deveid = $4
            RETURNING *;
          `,
          values: [
            remainingDeveValor,
            remainingValorPapel,
            remainingValorComissao,
            deve.deveid,
          ],
        });
        updatedDeves.push(updatedDeveRows[0]);
      }

      if (deve.deveid) {
        let paidPapelPix = 0;
        let paidPapelReal = 0;
        if (paidPapel > 0) {
          paidPapelPix = paidPapel * ((parseFloat(pix) || 0) / totalPayment);
          paidPapelReal = paidPapel * ((parseFloat(real) || 0) / totalPayment);
        }

        let paidEncaixePix = 0;
        let paidEncaixeReal = 0;
        if (paidComissao > 0) {
          paidEncaixePix =
            paidComissao * ((parseFloat(pix) || 0) / totalPayment);
          paidEncaixeReal =
            paidComissao * ((parseFloat(real) || 0) / totalPayment);
        }

        const { rows: updatedPapelCRows } = await client.query({
          text: `
            UPDATE "PapelC"
            SET
              papelpix = papelpix + $1,
              papelreal = papelreal + $2,
              encaixepix = encaixepix + $3,
              encaixereal = encaixereal + $4
            WHERE deveid = $5
            RETURNING *;
          `,
          values: [
            paidPapelPix,
            paidPapelReal,
            paidEncaixePix,
            paidEncaixeReal,
            deve.deveid,
          ],
        });
        if (updatedPapelCRows.length > 0) {
          updatedPapelCs.push(updatedPapelCRows[0]);
        }
      }
      totalPayment -= paymentForThisDeve;
    }

    await client.query("COMMIT");
    return { updatedDeves, updatedPapelCs, deletedDevesIds };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro na transação updateDeve:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function getC(r) {
  const result = await database.query({
    text: `SELECT * FROM "C" WHERE r = $1;`,
    values: [r],
  });
  return result;
}

async function getDec(r) {
  const result = await database.query({
    text: `SELECT * FROM "Dec" WHERE r = $1;`,
    values: [r],
  });
  return result;
}

async function getAnualC() {
  const result = await database.query({
    text: `SELECT * FROM "C"`,
  });
  return result;
}

async function getCByDec(letras) {
  const result = await database.query({
    text: `SELECT * FROM "C" WHERE dec = $1;`,
    values: [letras],
  });
  return result;
}

async function getPessoal(letras) {
  const result = await database.query({
    text: `SELECT * FROM "Pessoal" WHERE dec = $1;`,
    values: [letras],
  });
  return result.rows;
}

async function getSaidaP(letras) {
  const result = await database.query({
    text: `SELECT * FROM "SaidaP" WHERE dec = $1;`,
    values: [letras],
  });
  return result.rows;
}

async function getAnualSaidaP() {
  const result = await database.query({
    text: `SELECT * FROM "SaidaP"`,
  });
  return result;
}

async function getAnualSaidaO() {
  const result = await database.query({
    text: `SELECT * FROM "SaidaO"`,
  });
  return result;
}

async function getSaidaO(letras) {
  const result = await database.query({
    text: `SELECT * FROM "SaidaO" WHERE dec = $1;`,
    values: [letras],
  });
  return result.rows;
}

async function getOficina(letras) {
  const result = await database.query({
    text: `SELECT * FROM "Oficina" WHERE dec = $1;`,
    values: [letras],
  });
  return result.rows;
}

async function getPapel(letras) {
  const result = await database.query({
    text: `SELECT * FROM "Papel" WHERE dec = $1;`,
    values: [letras],
  });
  return result.rows;
}

async function getPapelCalculadora(oficina) {
  const result = await database.query({
    text: `SELECT * FROM "Papel" WHERE item = $1;`,
    values: [oficina],
  });
  return result;
}

async function getValorOficinas(oficina) {
  const result = await database.query({
    text: `SELECT * FROM "SaidaO" WHERE oficina = $1;`,
    values: [oficina],
  });
  return result.rows;
}

async function getConfig() {
  const result = await database.query({
    text: `SELECT * FROM "config"`,
  });
  return result;
}

// Modificação no getC1Data
async function getCData(codigo, data, r, dec) {
  const result = await database.query({
    text: `SELECT EXISTS(SELECT 1 FROM "C" WHERE codigo = $1 AND data = $2 AND r = $3 AND dec = $4) AS exists;`,
    values: [codigo, data, r, dec],
  });

  return result.rows[0].exists; // Retorna true ou false
}

async function getPapelData(codigo, data) {
  const datas = Array.isArray(data) ? data : [data];

  // Cria placeholders dinâmicos ($2, $3, etc.)
  const placeholders = datas.map((_, i) => `$${i + 2}`).join(",");

  const result = await database.query({
    text: `SELECT EXISTS(
             SELECT 1 
             FROM "Deve" 
             WHERE codigo = $1 
             AND data IN (${placeholders})  -- Usa IN com os placeholders
           ) AS exists;`,
    values: [codigo, ...datas], // Espalha os valores do array
  });

  return result.rows[0].exists;
}

async function getPapelC(r) {
  const result = await database.query({
    text: `SELECT * FROM "PapelC" WHERE r = $1;`,
    values: [r],
  });
  return result;
}

async function getAnualPapelC() {
  const result = await database.query({
    text: `SELECT * FROM "PapelC"`,
  });
  return result;
}

async function getNotas(r, colum) {
  const result = await database.query({
    text: `SELECT * FROM "Nota" WHERE r = $1 AND colum = $2 ORDER BY id DESC;;`,
    values: [r, colum],
  });
  return result;
}

async function getMTableAltSis(oficina) {
  const result = await database.query({
    text: `SELECT id, data, observacao, codigo, dec, nome, sis, alt, r1, r2, r3 
           FROM "Mtable" 
           WHERE oficina = $1 
           AND (sis > 0 OR alt > 0) 
           ORDER BY data DESC;`,
    values: [oficina],
  });
  return result;
}

async function getMTableBase(oficina) {
  const result = await database.query({
    text: `SELECT id, data, observacao, codigo, dec, nome, base, r1, r2, r3 
           FROM "Mtable" 
           WHERE oficina = $1 
           AND base > 0 ORDER BY data DESC;`,
    values: [oficina],
  });
  return result;
}

async function getVerificador(r) {
  const result = await database.query({
    text: `SELECT * FROM "Deve" WHERE r = $1`,
    values: [r],
  });
  return result;
}
async function getRBSA(r) {
  const result = await database.query({
    text: `SELECT * FROM "RBSA" WHERE r=$1`,
    values: [r],
  });
  return result;
}

async function getDeve(r) {
  const result = await database.query({
    text: `SELECT * FROM "Deve" WHERE r = $1`,
    values: [r],
  });
  return result;
}

async function getAviso(r) {
  const result = await database.query({
    text: `SELECT * FROM "Aviso" WHERE r = $1`,
    values: [r],
  });
  return result;
}

async function getDevo(r) {
  const result = await database.query({
    text: `SELECT * FROM "Devo" WHERE r = $1`,
    values: [r],
  });
  return result;
}

async function getRJustBSA(codigo, r) {
  const result = await database.query({
    text: `SELECT 
            dec,
            SUM(base) AS total_base,
            SUM(sis) AS total_sis,
            SUM(alt) AS total_alt,
            array_agg(id) AS ids
          FROM "RBSA" 
          WHERE r = $2 AND codigo = $1
          GROUP BY dec;`,
    values: [codigo, r],
  });
  return result.rows;
}

async function getDeveJustValor(codigo, r) {
  const result = await database.query({
    text: `SELECT
             array_agg(deveid) AS deveids,
             COALESCE(SUM(valor), 0) AS total_valor
          FROM "Deve"
           WHERE codigo = $1 AND r = $2;`,
    values: [codigo, r],
  });

  return result.rows[0];
}

async function getDevoJustValor(codigo) {
  const result = await database.query({
    text: `SELECT 
             SUM(valor) AS total_valor
           FROM "Devo" 
           WHERE codigo = $1;`,
    values: [codigo],
  });

  // Retorna apenas a primeira linha com os totais
  return (
    result.rows[0] || {
      total_valor: 0,
    }
  );
}

async function getTemp() {
  const result = await database.query({
    text: `SELECT * FROM "Temp" ORDER BY data DESC;`,
  });
  return result;
}

async function getPagamentos(r) {
  const result = await database.query({
    text: `SELECT * FROM "Pagamentos" WHERE r = $1 ORDER BY data DESC;`,
    values: [r],
  });
  // The API handler will access result.rows
  return result;
}

async function getComentario(codigo) {
  const result = await database.query({
    // Seleciona todas as colunas da tabela "cadastro" onde o código corresponde.
    // Isso garante que 'codigo' e 'comentario' estejam disponíveis.
    text: `SELECT * FROM "cadastro" WHERE codigo = $1;`,
    values: [codigo],
  });
  // Retorna o array de linhas do resultado da query.
  return result.rows;
}

async function deleteM(ids) {
  const result = await database.query({
    text: `DELETE FROM "Mtable" WHERE id = ANY($1) RETURNING *`,
    values: [ids],
  });
  return result.rows;
}

async function deleteC(ids) {
  const result = await database.query({
    text: `DELETE FROM "C" WHERE id = $1 RETURNING *`,
    values: [ids],
  });
  return result.rows;
}

async function deleteNota(ids) {
  const result = await database.query({
    text: `DELETE FROM "Nota" WHERE id = $1 RETURNING *`,
    values: [ids],
  });
  return result.rows;
}

async function deletePapelC(ids) {
  const result = await database.query({
    text: `DELETE FROM "PapelC" WHERE id = $1 RETURNING *`,
    values: [ids],
  });
  return result.rows;
}

async function deletePessoal(ids) {
  const result = await database.query({
    text: `DELETE FROM "Pessoal" WHERE id = $1 RETURNING *`,
    values: [ids],
  });
  return result.rows;
}

async function deleteSaidaP(ids) {
  const result = await database.query({
    text: `DELETE FROM "SaidaP" WHERE id = $1 RETURNING *`,
    values: [ids],
  });
  return result;
}

async function deleteSaidaO(ids) {
  const result = await database.query({
    text: `DELETE FROM "SaidaO" WHERE id = $1 RETURNING *`,
    values: [ids],
  });
  return result;
}

async function deleteOficina(ids) {
  const result = await database.query({
    text: `DELETE FROM "Oficina" WHERE id = $1 RETURNING *`,
    values: [ids],
  });
  return result.rows;
}
async function deletePapel(ids) {
  const result = await database.query({
    text: `DELETE FROM "Papel" WHERE id = $1 RETURNING *`,
    values: [ids],
  });
  return result.rows;
}

export async function deleteR(ids) {
  const result = await database.query({
    text: `DELETE FROM "RBSA" WHERE id = ANY($1) RETURNING *`,
    values: [ids],
  });
  return result.rows;
}

export async function deleteDevo(codigo) {
  const result = await database.query({
    text: `DELETE FROM "Devo" WHERE codigo = $1 RETURNING *`,
    values: [codigo],
  });
  return result.rows;
}

export async function deleteDeve(codigo) {
  const result = await database.query({
    text: `DELETE FROM "Deve" WHERE codigo = $1 RETURNING *`,
    values: [codigo],
  });
  return result.rows;
}

export async function deleteAviso(avisoid) {
  const result = await database.query({
    text: `DELETE FROM "Aviso" WHERE avisoid = $1 RETURNING *`,
    values: [avisoid],
  });
  return result.rows;
}

export async function deleteTemp(id) {
  const result = await database.query({
    text: `DELETE FROM "Temp" WHERE id = $1 RETURNING id;`,
    values: [id],
  });
  // Retorna o objeto de resultado da query, que inclui rows (com o id do item deletado se encontrado)
  return result;
}

async function deleteAllPagamentos() {
  const result = await database.query({
    text: `DELETE FROM "Pagamentos" RETURNING id;`, // Sem cláusula WHERE
  });
  // result will contain rowCount and potentially the deleted rows if RETURNING was used effectively
  return result;
}

export async function deletePagamentoById(id) {
  const result = await database.query({
    text: `DELETE FROM "Pagamentos" WHERE id = $1 RETURNING id, r;`, // RETURNING id and r for notification payload
    values: [id],
  });
  return result;
}

export async function deletePagamentosByR(rValue) {
  // This function was implied by the API endpoint but might not have been fully implemented or present.
  // Adding a basic implementation.
  const result = await database.query({
    text: `DELETE FROM "Pagamentos" WHERE r = $1 RETURNING id;`,
    values: [rValue],
  });
  return result;
}

async function verifyUserCredentials(username, password) {
  try {
    const result = await database.query({
      text: `SELECT * FROM "users" WHERE usuario = $1 AND senha = $2;`,

      values: [username, password],
    });

    if (result.rows.length > 0) {
      return result.rows[0]; // Returns { id, usuario }
    }
    return null; // User not found or password incorrect
  } catch (error) {
    console.error("Erro ao verificar credenciais do usuário:", error);
    throw error; // Re-throw to be caught by the API handler
  }
}

async function getUsers() {
  // SECURITY WARNING: Selecting 'senha' (password) and sending it to the client is a security risk.
  // Passwords should be hashed in the database and ideally not displayed or directly edited.
  const result = await database.query({
    text: `SELECT id, usuario, senha FROM "users" ORDER BY id ASC;`,
  });
  return result.rows;
}

async function updateUser(userData) {
  // SECURITY WARNING: If 'senha' is being updated, it should be hashed here before saving to the database.
  // Storing plaintext passwords is highly insecure.
  const result = await database.query({
    text: `
      UPDATE "users" 
      SET usuario = $1, senha = $2 
      WHERE id = $3 
      RETURNING id, usuario, senha; 
    `, // Returning 'senha' is also a risk.
    values: [userData.usuario, userData.senha, userData.id],
  });
  // Optionally, notify via WebSocket if user changes should be real-time across admin panels
  // await notifyWebSocketServer({ type: "USER_UPDATED_ITEM", payload: result.rows[0] });
  return result.rows[0]; // Return the updated user
}

const ordem = {
  createM,
  createPessoal,
  createSaidaP,
  createSaidaO,
  createOficina,
  createRBSA,
  createDevo,
  createDeve,
  createAviso,
  createC,
  createNota,
  createPapel,
  createPapelC,
  createTemp,
  createPagamento,
  getTemp,
  getComentario,
  getPessoal,
  getSaidaP,
  getAnualSaidaP,
  getAnualSaidaO,
  getSaidaO,
  getOficina,
  getValorOficinas,
  getC,
  getDec,
  getAnualC,
  getNotas,
  getCByDec,
  getCData,
  getPapel,
  getPapelCalculadora,
  getPapelC,
  getAnualPapelC,
  getPapelData,
  getConfig,
  getRBSA,
  getRJustBSA,
  getMTableAltSis,
  getMTableBase,
  getVerificador,
  getDeve,
  getAviso,
  getDeveJustValor,
  getDevo,
  getDevoJustValor,
  getPagamentos,
  deleteC,
  deleteNota,
  deletePapel,
  deletePapelC,
  deletePessoal,
  deleteSaidaP,
  deleteSaidaO,
  deleteOficina,
  deleteM,
  deleteR,
  deleteDeve,
  deleteAviso,
  deleteDevo,
  deletePagamentoById,
  deletePagamentosByR,
  deleteTemp,
  deleteAllPagamentos,
  updateDeveCalculadora,
  updateDeve,
  updateConfig,
  updateC,
  updateDec,
  updateNota,
  updateCBSA,
  updatePessoal,
  updateSaidaP,
  updateSaidaO,
  updateOficina,
  updatePapel,
  updatePapelC,
  updateAltSis,
  updateAltSisR,
  updateRCalculadora,
  updateBase,
  updateRButton,
  verifyUserCredentials,
  getUsers,
  updateUser,
};

export default ordem;
