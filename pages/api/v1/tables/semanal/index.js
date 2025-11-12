import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

async function notifyWebSocketServer(data) {
  const wsNotifyUrl = process.env.RAILWAY_WB
    ? `https://${process.env.RAILWAY_WB}/broadcast`
    : null;

  if (!wsNotifyUrl) {
    console.warn(
      "RAILWAY_WB environment variable is not set. WebSocket notification will be skipped.",
    );
    return;
  }
  try {
    await fetch(wsNotifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Erro ao notificar WebSocket para tables/semanal:", error);
  }
}

const router = createRouter();

router.post(postHandler);
router.get(getHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const semanalInputValues = request.body;
  const newSemanalOrdem = await ordem.createSemanal(semanalInputValues);

  if (newSemanalOrdem?.rows?.length > 0) {
    await notifyWebSocketServer({
      type: "SEMANAL_NEW_ITEM",
      payload: newSemanalOrdem.rows[0],
    });
  }

  return response.status(201).json(newSemanalOrdem);
}

async function getHandler(request, response) {
  const { r } = request.query;
  const result = await ordem.getSemanal(r);
  return response.status(200).json(result.rows);
}

async function deleteHandler(req, res) {
  const { r, periodKey } = req.body;

  if (typeof r === "undefined" || typeof periodKey === "undefined") {
    return res
      .status(400)
      .json({ error: "Parâmetros 'r' e 'periodKey' são obrigatórios." });
  }

  try {
    const result = await ordem.deleteSemanalByPeriod(r, periodKey);
    res.status(200).json(result);
  } catch (error) {
    console.error("Erro no endpoint ao deletar período semanal:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
}
