import { createRouter } from "next-connect";
import controller from "infra/controller";
import Mordem from "models/tables.js";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);
router.delete(deleteHandler);
router.put(updateHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const ordemGetValues = await Mordem.getM1Table();
  return response.status(200).json(ordemGetValues);
}

async function postHandler(request, response) {
  const ordemInputValues = request.body;
  const newMOrdem = await Mordem.createM1(ordemInputValues);
  return response.status(201).json(newMOrdem);
}

async function deleteHandler(request, response) {
  const { id } = request.body;
  const result = await Mordem.deleteM1(id);
  return response.status(200).json(result);
}

async function updateHandler(request, response) {
  const updatedData = request.body;
  const result = await Mordem.updateM1(updatedData);
  return response.status(200).json(result);
}
