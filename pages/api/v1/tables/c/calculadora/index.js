import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

const router = createRouter();

router.get(getHandler);
router.put(updateHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const { codigo, r, data, dec } = request.query;
  try {
    const valores = await ordem.getCData(codigo, data, r, dec);
    response.status(200).json(valores);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
}

async function updateHandler(request, response) {
  const { codigo, r, data, dec } = request.query;
  try {
    const result = await ordem.updateCBSA(
      codigo,
      decodeURIComponent(data),
      r,
      dec,
      request.body,
    );
    response.status(200).json(result);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
}
