import database from "infra/database.js"; // Certifique-se de que esse arquivo existe e faz a conexão corretamente

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response
      .status(405)
      .json({ error: `Method "${request.method}" not allowed` });
  }

  const { data, descricao, dec, nome, sis, base, alt } = request.body;

  if (!data || !descricao || !dec || !nome || !sis || !base || !alt) {
    return response
      .status(400)
      .json({ error: "Todos os campos são obrigatórios!" });
  }

  let dbClient;
  try {
    dbClient = await database.getNewClient(); // Obtém uma conexão com o banco de dados

    const query = `
      INSERT INTO "m1table" (data, descricao, dec, nome, sis, base, alt) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [data, descricao, dec, nome, sis, base, alt];

    const responseult = await dbClient.query(query, values);

    return response.status(201).json({
      message: "Dados inseridos com sucesso!",
      data: responseult.rows[0],
    });
  } catch (error) {
    console.error("Erro ao inserir dados:", error);
    return response.status(500).json({ error: "Erro interno do servidor." });
  } finally {
    if (dbClient) await dbClient.end(); // Fecha a conexão com o banco de dados
  }
}
