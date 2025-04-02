import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

const router = createRouter();

router.post(postHandler);
router.get(getHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const ordemInputValues = request.body;
  const newMOrdem = await ordem.createPapelC1(ordemInputValues);
  return response.status(201).json(newMOrdem);
}

async function getHandler(request, response) {
  const ordemGetValues = await ordem.getPapelC1();
  return response.status(200).json(ordemGetValues);
}

async function deleteHandler(request, response) {
  const { codigo } = request.body;
  const result = await ordem.deletePapelC1(codigo);
  return response.status(200).json(result);
}
