import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const { codigo, data } = request.query;
  const dataObj = JSON.parse(decodeURIComponent(data));
  const exists = await ordem.getPapelData(codigo, dataObj);
  return response.status(200).json({ exists });
}
