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
async function updateM1(updatedData) {
  const result = await database.query({
    text: `
      UPDATE "m1table"
      SET 
        observacao = $1,
        dec = $2,
        nome = $3,
        sis = $4,
        base = $5,
        alt = $6
      WHERE id = $7
      RETURNING *;
    `,
    values: [
      updatedData.observacao,
      updatedData.dec,
      updatedData.nome,
      updatedData.sis,
      updatedData.base,
      updatedData.alt,
      updatedData.id,
    ],
  });

  return result;
}

async function getM1Table() {
  const result = await database.query({
    text: `SELECT * FROM "m1table" ORDER BY data DESC;`,
  });
  return result;
}

export async function deleteM1(id) {
  return database.query({
    text: `DELETE FROM "m1table" WHERE id = $1 RETURNING *;`,
    values: [id],
  });
}

const ordem = {
  createM1,
  getM1Table,
  deleteM1,
  updateM1,
};

export default ordem;
