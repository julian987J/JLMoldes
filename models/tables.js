import database from "infra/database.js";

async function createM1(ordemInputValues) {
  const result = await database.query({
    text: `
      INSERT INTO "m1table" (descricao, codigo, dec, nome, sis, base, alt) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `,
    values: [
      ordemInputValues.descricao,
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

const Mordem = {
  createM1,
  getM1Table,
  deleteM1,
};

export default Mordem;
