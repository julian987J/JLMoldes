import { createRouter } from "next-connect";
import controller from "infra/controller";
import Mordem from "models/tables.js";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

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
