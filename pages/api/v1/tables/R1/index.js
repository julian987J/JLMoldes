import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

const router = createRouter();

router.post(postHandlerR1BSA);
router.get(getHandlerR1BSA);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandlerR1BSA(request, response) {
  const ordemInputValues = request.body;
  const newMOrdem = await ordem.createR1BSA(ordemInputValues);
  return response.status(201).json(newMOrdem);
}

async function getHandlerR1BSA(request, response) {
  const ordemGetValues = await ordem.getR1BSA();
  return response.status(200).json(ordemGetValues);
}

async function deleteHandler(request, response) {
  const { id } = request.body;
  const result = await ordem.deleteR1(id);
  return response.status(200).json(result);
}
