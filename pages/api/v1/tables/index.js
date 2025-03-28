import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

const router = createRouter();

router.get(getSisAltHandler);
router.post(postHandler);
router.delete(deleteHandler);
router.put(updateHandler);

export default router.handler(controller.errorHandlers);

async function getSisAltHandler(request, response) {
  const ordemGetValues = await ordem.getM1TableAltSis();
  return response.status(200).json(ordemGetValues);
}

async function postHandler(request, response) {
  const ordemInputValues = request.body;
  const newMOrdem = await ordem.createM1(ordemInputValues);
  return response.status(201).json(newMOrdem);
}

async function deleteHandler(request, response) {
  const { id } = request.body;
  const idsToDelete = Array.isArray(id) ? id : [id];
  const result = await ordem.deleteM1(idsToDelete);
  return response.status(200).json(result);
}

async function updateHandler(request, response) {
  const updatedData = request.body;
  const result = await ordem.updateAltSis(updatedData);
  return response.status(200).json(result);
}
