import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

async function notifyWebSocketServer(data) {
  const wsNotifyUrl = `https://${process.env.RAILWAY_WB}/broadcast`;

  try {
    const response = await fetch(wsNotifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        `Erro WebSocket (${response.status}) para tables/devo: ${errorData}`,
      );
    } else {
      // console.log("Notificação WebSocket para tables/devo enviada:", data);
    }
  } catch (error) {
    console.error("Erro ao notificar WebSocket para tables/devo:", error);
  }
}

const router = createRouter();

router.get(getHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const { codigo, r } = request.query;
  try {
    const valores = await ordem.getDevoJustValor(codigo, r);
    response.status(200).json(valores);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
}

async function deleteHandler(request, response) {
  const { id, r } = request.body;
  const result = await ordem.deleteDevoID(id);

  // Notifica sobre a exclusão usando o código
  await notifyWebSocketServer({
    type: "DEVO_DELETED_ITEM",
    payload: { id: id, r: r }, // Envia o código do item deletado
  });

  return response.status(200).json(result);
}
