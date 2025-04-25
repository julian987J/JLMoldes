import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const { letras } = request.query;
  const result = await ordem.getCByDec(letras);
  return response.status(200).json(result);
}
