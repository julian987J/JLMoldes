import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

const router = createRouter();

router.get(getHandler);
router.put(updateHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const { codigo, data, r } = request.query;
  const dataObj = JSON.parse(decodeURIComponent(data));
  const exists = await ordem.getCData(codigo, dataObj, r);
  return response.status(200).json({ exists });
}

async function updateHandler(request, response) {
  const updatedData = request.body;
  const result = await ordem.updateCBSA(updatedData);
  return response.status(200).json(result);
}
