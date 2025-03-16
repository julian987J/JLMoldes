import database from "infra/database.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Método não permitido" });
  }

  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const responseult = await dbClient.query(
      "SELECT * FROM m1table ORDER BY id DESC",
    );

    return response.status(200).json(responseult.rows);
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return response.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    if (dbClient) await dbClient.end();
  }
}
