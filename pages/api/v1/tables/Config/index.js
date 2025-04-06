import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

const router = createRouter();

router.get(getHandler);
router.put(updateHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const ordemGetValues = await ordem.getConfig();
  return response.status(200).json(ordemGetValues);
}

async function updateHandler(request, response) {
  const updatedData = request.body;
  const result = await ordem.updateConfig(updatedData);
  return response.status(200).json(result);
}
