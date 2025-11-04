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
        `Erro WebSocket (${response.status}) para plotter/archive: ${errorData}`,
      );
    }
  } catch (error) {
    console.error("Erro ao notificar WebSocket para plotter/archive:", error);
  }
}

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const { r } = request.body;
  if (!r) {
    return response
      .status(400)
      .json({ error: "O parâmetro 'r' é obrigatório." });
  }

  try {
    const result = await ordem.archivePorR(r);

    // Função auxiliar para notificar
    const notify = (type, rows) => {
      if (rows && rows.length > 0) {
        rows.forEach((row) => {
          notifyWebSocketServer({ type, payload: row });
        });
      }
    };

    // Envia as notificações após a transação ser concluída com sucesso
    notify("C_UPDATED_ITEM", result.c);
    notify("PAPELC_UPDATED_ITEM", result.papelC);
    notify("PLOTTER_C_UPDATED_ITEM", result.plotterC);

    return response.status(200).json(result);
  } catch (error) {
    console.error(`Erro ao arquivar para r=${r}:`, error);
    return response.status(500).json({
      error: "Falha ao arquivar os registros.",
      details: error.message,
    });
  }
}
