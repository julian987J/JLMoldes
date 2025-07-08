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
        `Erro WebSocket (${response.status}) para tables/aviso: ${errorData}`,
      );
    }
  } catch (error) {
    console.error("Erro ao notificar WebSocket para tables/aviso:", error);
  }
}

const router = createRouter();

router.post(postHandlerAviso);
router.get(getHandlerAviso);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandlerAviso(request, response) {
  const ordemInputValues = request.body;
  const newAvisoItemResult = await ordem.createAviso(ordemInputValues);

  if (newAvisoItemResult?.rows?.length > 0) {
    await notifyWebSocketServer({
      type: "AVISO_NEW_ITEM",
      payload: newAvisoItemResult.rows[0],
    });
  }
  return response.status(201).json(newAvisoItemResult);
}

async function getHandlerAviso(request, response) {
  const { r } = request.query;
  const ordemGetValues = await ordem.getAviso(r);
  return response.status(200).json(ordemGetValues);
}

async function deleteHandler(request, response) {
  const { avisoid } = request.body;
  const result = await ordem.deleteAviso(avisoid);

  await notifyWebSocketServer({
    type: "AVISO_DELETED_ITEM",
    payload: { avisoid: avisoid },
  });

  return response.status(200).json(result);
}
