import database from "infra/database.js";

async function createM1(ordemInputValues) {
  const result = await database.query({
    text: `
      INSERT INTO "m1table" (observacao, codigo, dec, nome, sis, base, alt) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `,
    values: [
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

async function createR1BSA(ordemInputValues) {
  const result = await database.query({
    text: `
      INSERT INTO "R1BSA" (id, data, codigo, nome, sis, alt, base) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `,
    values: [
      ordemInputValues.id,
      ordemInputValues.data,
      ordemInputValues.codigo,
      ordemInputValues.nome,
      ordemInputValues.sis,
      ordemInputValues.alt,
      ordemInputValues.base,
    ],
  });

  return result;
}

async function updateAltSis(updatedData) {
  const result = await database.query({
    text: `
      UPDATE "m1table"
      SET 
        observacao = $1,
        dec = $2,
        nome = $3,
        sis = $4,
        alt = $5
      WHERE id = $6
      RETURNING *;
    `,
    values: [
      updatedData.observacao,
      updatedData.dec,
      updatedData.nome,
      updatedData.sis,
      updatedData.alt,
      updatedData.id,
    ],
  });

  return result;
}
async function updateAltSisR1(updatedData) {
  const result = await database.query({
    text: `
      UPDATE "R1BSA"
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

async function updateBase(updatedData) {
  const result = await database.query({
    text: `
      UPDATE "m1table"
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

async function getM1TableAltSis() {
  const result = await database.query({
    text: `SELECT id, data, observacao, codigo, dec, nome, sis, alt FROM "m1table" WHERE sis > 0 OR alt > 0 ORDER BY data DESC;`,
  });
  return result;
}

async function getM1TableBase() {
  const result = await database.query({
    text: `SELECT id, data, observacao, codigo, dec, nome, base FROM "m1table" WHERE base > 0 ORDER BY data DESC;`,
  });
  return result;
}

async function getVerificador() {
  const result = await database.query({
    text: `SELECT * FROM "m1table"`,
  });
  return result;
}
async function getR1BSA() {
  const result = await database.query({
    text: `SELECT * FROM "R1BSA"`,
  });
  return result;
}

export async function deleteM1(id) {
  return database.query({
    text: `DELETE FROM "m1table" WHERE id = $1 RETURNING *;`,
    values: [id],
  });
}

export async function deleteR1(id) {
  return database.query({
    text: `DELETE FROM "R1BSA" WHERE id = $1 RETURNING *;`,
    values: [id],
  });
}

const ordem = {
  createM1,
  createR1BSA,
  getR1BSA,
  getM1TableAltSis,
  getM1TableBase,
  getVerificador,
  deleteM1,
  deleteR1,
  updateAltSis,
  updateAltSisR1,
  updateBase,
};

export default ordem;
