import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const { r } = request.body;

  if (!r) {
    return response
      .status(400)
      .json({ error: "O valor de 'r' é obrigatório." });
  }

  const result = await ordem.finalizePorR(r);
  return response.status(200).json(result);
}
