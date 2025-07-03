import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

const router = createRouter();

router.get(getHandlerDeveJustValor);
router.put(putHandlerDeveAvisado);

export default router.handler(controller.errorHandlers);

async function getHandlerDeveJustValor(request, response) {
  const { codigo, r } = request.query;
  try {
    const valores = await ordem.getDeveJustValor(codigo, r);
    response.status(200).json(valores);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
}

async function putHandlerDeveAvisado(request, response) {
  try {
    // A função no model espera um objeto com os dados
    const updatedItem = await ordem.updateDeveCalculadora(request.body);
    if (updatedItem) {
      response.status(200).json(updatedItem);
    } else {
      response
        .status(404)
        .json({ error: "Item não encontrado para atualizar." });
    }
  } catch (error) {
    console.error("Erro no handler de atualização de 'Deve':", error);
    response.status(500).json({ error: error.message });
  }
}
