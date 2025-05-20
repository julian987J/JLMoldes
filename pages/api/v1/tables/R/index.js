import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

async function notifyWebSocketServer(data) {
  // Descomente se este endpoint precisar notificar
  const wsHttpPort = parseInt(process.env.WS_PORT || "8080") + 1;
  const wsNotifyUrl = `http://localhost:${wsHttpPort}/broadcast`;

  try {
    const response = await fetch(wsNotifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        `Erro WebSocket (${response.status}) para tables/R: ${errorData}`,
      );
    } else {
      // console.log("Notificação WebSocket para tables/R enviada:", data);
    }
  } catch (error) {
    console.error("Erro ao notificar WebSocket para tables/R:", error);
  }
}

const router = createRouter();

router.post(postHandler);
router.get(getHandler);
router.delete(deleteHandler);
router.put(updateHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const ordemInputValues = request.body;
  const newMOrdem = await ordem.createRBSA(ordemInputValues);
  return response.status(201).json(newMOrdem);
}

async function getHandler(request, response) {
  const { r } = request.query;
  try {
    const valores = await ordem.getRBSA(r);
    response.status(200).json(valores);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
}

async function deleteHandler(request, response) {
  const { id } = request.body;
  const idsToDelete = Array.isArray(id) ? id : [id];
  const result = await ordem.deleteR(idsToDelete);
  return response.status(200).json(result);
}

async function updateHandler(request, response) {
  const updatedData = request.body;
  const result = await ordem.updateAltSisR(updatedData);

  if (result?.rows?.length > 0 && updatedData.id_mtable) {
    const mtableItem = await ordem.getMTableById(updatedData.id_mtable); // Função hipotética
    await notifyWebSocketServer({
      type: "TABELAM_UPDATED_ITEM",
      payload: mtableItem.rows[0],
    });
  }
  return response.status(200).json(result);
}
