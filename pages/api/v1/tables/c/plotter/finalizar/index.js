import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const { r, bobina } = request.body;

  if (!r) {
    return response
      .status(400)
      .json({ error: "O valor de 'r' é obrigatório." });
  }

  const finalBobina =
    bobina || `bobina_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const result = await ordem.finalizePorR(r, finalBobina);
  return response.status(200).json(result);
}
