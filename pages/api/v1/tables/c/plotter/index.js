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
      console.error(`Erro WebSocket (${response.status}) para plotter-c`);
    }
  } catch (error) {
    console.error("Erro ao notificar WebSocket para plotter-c:", error);
  }
}

const router = createRouter();

router.post(postHandler);
router.get(getHandler);
router.delete(deleteHandler);
router.put(updateHandler);
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const newData = request.body;
  const result = await ordem.createPlotterC(newData);

  if (result?.rows?.length > 0) {
    await notifyWebSocketServer({
      type: "PLOTTER_C_NEW_ITEM",
      payload: result.rows[0],
    });
  }
  return response.status(201).json(result);
}

async function getHandler(request, response) {
  const { r } = request.query;
  const result = await ordem.getPlotterC(r);
  return response.status(200).json(result);
}

async function patchHandler(request, response) {
  const { id } = request.body;
  if (!id) {
    return response.status(400).json({ error: "ID is required" });
  }
  const result = await ordem.swapSimNaoPlotterC(id);

  if (result?.rows?.length > 0) {
    await notifyWebSocketServer({
      type: "PLOTTER_C_UPDATED_ITEM",
      payload: result.rows[0],
    });
  }
  return response.status(200).json(result);
}

async function deleteHandler(request, response) {
  const { id } = request.body;
  const result = await ordem.deletePlotterC(id);

  await notifyWebSocketServer({
    type: "PLOTTER_C_DELETED_ITEM",
    payload: { id: id },
  });
  return response.status(200).json(result);
}

async function updateHandler(request, response) {
  const updatedData = request.body;
  const result = await ordem.updatePlotterC(updatedData);

  if (result?.rows?.length > 0) {
    await notifyWebSocketServer({
      type: "PLOTTER_C_UPDATED_ITEM",
      payload: result.rows[0],
    });
  }
  return response.status(200).json(result);
}