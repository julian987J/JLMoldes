import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const { r } = request.body;

  if (typeof r === "undefined" || r === null) {
    return response
      .status(400)
      .json({ error: "O parâmetro 'r' é obrigatório." });
  }

  try {
    const result = await ordem.archivePorR(r);
    return response.status(200).json(result);
  } catch (error) {
    console.error("Erro ao arquivar registros:", error);
    return response.status(500).json({ error: "Erro interno do servidor." });
  }
}
