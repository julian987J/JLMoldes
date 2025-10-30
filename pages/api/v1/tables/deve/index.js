import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

async function notifyWebSocketServer(data) {
  // Descomente se este endpoint precisar notificar
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
        `Erro WebSocket (${response.status}) para tables/deve: ${errorData}`,
      );
    } else {
      // console.log("Notificação WebSocket para tables/deve enviada:", data);
    }
  } catch (error) {
    console.error("Erro ao notificar WebSocket para tables/deve:", error);
  }
}

const router = createRouter();

router.post(postHandlerDeve);
router.get(getHandlerDeve);
router.delete(deleteHandler);
router.put(updateHandler);

export default router.handler(controller.errorHandlers);

async function postHandlerDeve(request, response) {
  const ordemInputValues = request.body;
  const newDeveItemResult = await ordem.createDeve(ordemInputValues);

  if (newDeveItemResult?.rows?.length > 0) {
    await notifyWebSocketServer({
      type: "DEVE_NEW_ITEM",
      payload: newDeveItemResult.rows[0], // Assume que createDeve retorna o item criado
    });
  }
  return response.status(201).json(newDeveItemResult);
}

async function getHandlerDeve(request, response) {
  const { r } = request.query;
  const ordemGetValues = await ordem.getDeve(r);
  return response.status(200).json(ordemGetValues);
}

async function deleteHandler(request, response) {
  const { codigo, deveid } = request.body;

  if (deveid) {
    const result = await ordem.deleteDeveById(deveid);
    if (result && result.length > 0) {
      await notifyWebSocketServer({
        type: "DEVE_DELETED_ITEM",
        payload: { deveid: result[0].deveid, r: result[0].r },
      });
    }
    return response.status(200).json(result);
  }

  if (codigo) {
    const result = await ordem.deleteDeve(codigo);
    if (result && result.length > 0) {
      await notifyWebSocketServer({
        type: "DEVE_DELETED_ITEM",
        payload: { codigo: codigo, r: result[0].r },
      });
    }
    return response.status(200).json(result);
  }

  return response.status(400).json({ error: "codigo or deveid is required" });
}

async function updateHandler(request, response) {
  try {
    const updatedData = request.body;
    const { updatedDeves, updatedPapelCs, deletedDevesIds } =
      await ordem.updateDeve(updatedData);

    for (const deve of updatedDeves) {
      await notifyWebSocketServer({ type: "DEVE_UPDATED_ITEM", payload: deve });
    }

    for (const papelc of updatedPapelCs) {
      await notifyWebSocketServer({
        type: "PAPELC_UPDATED_ITEM",
        payload: papelc,
      });
    }

    for (const deveid of deletedDevesIds) {
      await notifyWebSocketServer({
        type: "DEVE_DELETED_ITEM",
        payload: { deveid: deveid },
      });
    }

    response
      .status(200)
      .json({ success: true, updatedDeves, updatedPapelCs, deletedDevesIds });
  } catch (error) {
    console.error("Erro no updateHandler de Deve:", error);
    response.status(500).json({ success: false, message: error.message });
  }
}
