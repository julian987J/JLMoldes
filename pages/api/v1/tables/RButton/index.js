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
        `Erro WebSocket (${response.status}) para RButton: ${errorData}`,
      );
    }
  } catch (error) {
    console.error("Erro ao notificar WebSocket para RButton:", error);
  }
}

const router = createRouter();

router.put(updateHandler);

export default router.handler(controller.errorHandlers);

async function updateHandler(request, response) {
  const updatedData = request.body;
  const result = await ordem.updateRButton(updatedData);

  if (result) {
    await notifyWebSocketServer({
      type: "TABELAM_UPDATED_ITEM",
      payload: result,
    });
  }

  return response.status(200).json(result);
}
