import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

const router = createRouter();

router.post(postHandlerDeve);
router.get(getHandlerDeve);

export default router.handler(controller.errorHandlers);

async function postHandlerDeve(request, response) {
  const ordemInputValues = request.body;
  const newMOrdem = await ordem.createDeve(ordemInputValues);
  return response.status(201).json(newMOrdem);
}

async function getHandlerDeve(request, response) {
  const ordemGetValues = await ordem.getDeve();
  return response.status(200).json(ordemGetValues);
}
