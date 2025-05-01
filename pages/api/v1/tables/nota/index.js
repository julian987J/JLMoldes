import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

const router = createRouter();

router.post(postHandler);
router.get(getHandler);
router.delete(deleteHandler);
router.put(updateHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const ordemInputValues = request.body;
  const newMOrdem = await ordem.createNota(ordemInputValues);
  return response.status(201).json(newMOrdem);
}

async function getHandler(request, response) {
  const { r } = request.query;
  const result = await ordem.getNotas(r);
  return response.status(200).json(result);
}

async function deleteHandler(request, response) {
  const { id } = request.body;
  const result = await ordem.deleteNota(id);
  return response.status(200).json(result);
}

async function updateHandler(request, response) {
  const updatedData = request.body;
  const result = await ordem.updateNota(updatedData);
  return response.status(200).json(result);
}
