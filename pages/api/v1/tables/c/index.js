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
        `Erro WebSocket (${response.status}) para tables/c: ${errorData}`,
      );
    } else {
      // console.log("Notificação WebSocket para tables/c enviada:", data);
    }
  } catch (error) {
    console.error("Erro ao notificar WebSocket para tables/c:", error);
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

  // Nova lógica para pagamentos parciais usando r_bsa_ids
  if (ordemInputValues.r_bsa_ids && ordemInputValues.r_bsa_ids.length > 0) {
    const existingC = await ordem.findCByRbsaIds(
      ordemInputValues.r,
      ordemInputValues.r_bsa_ids,
    );

    if (existingC) {
      // Se já existe um registro C, atualize-o
      const updatedData = {
        id: existingC.id,
        base: ordemInputValues.base,
        sis: ordemInputValues.sis,
        alt: ordemInputValues.alt,
        real: ordemInputValues.real,
        pix: ordemInputValues.pix,
        r_bsa_ids: ordemInputValues.r_bsa_ids,
      };
      const updatedResult = await ordem.updateCWithAddition(updatedData);

      if (updatedResult?.rows?.length > 0) {
        await notifyWebSocketServer({
          type: "C_UPDATED_ITEM",
          payload: updatedResult.rows[0],
        });
      }
      return response.status(200).json(updatedResult);
    }
  }

  // Lógica original para criar um novo registro C
  const newCOrdem = await ordem.createC(ordemInputValues);

  if (newCOrdem?.rows?.length > 0) {
    await notifyWebSocketServer({
      type: "C_NEW_ITEM",
      payload: newCOrdem.rows[0],
    });
  }

  return response.status(201).json(newCOrdem);
}

async function getHandler(request, response) {
  const { r, includeFinished } = request.query;
  let result;
  if (includeFinished === "true") {
    result = await ordem.getAllC(r);
  } else {
    result = await ordem.getC(r);
  }
  return response.status(200).json(result);
}

async function deleteHandler(request, response) {
  const { id } = request.body;
  const deletedRows = await ordem.deleteC(id);

  if (deletedRows && deletedRows.length > 0) {
    const deletedItem = deletedRows[0];
    await notifyWebSocketServer({
      type: "C_DELETED_ITEM",
      payload: { id: deletedItem.id, r: deletedItem.r },
    });
    return response.status(200).json(deletedItem);
  }

  // Se nada foi deletado (ex: ID não encontrado), retorne uma resposta apropriada.
  return response.status(200).json(null);
}

async function updateHandler(request, response) {
  const updatedData = request.body;
  const result = await ordem.updateC(updatedData);

  if (result?.rows?.length > 0) {
    const updatedItem = result.rows[0];
    // Coluna-1.js espera 'r' no payload para C_UPDATED_ITEM
    if (updatedItem.r !== undefined) {
      await notifyWebSocketServer({
        type: "C_UPDATED_ITEM",
        payload: updatedItem,
      });
    } else {
      console.warn(
        `Item C atualizado (id: ${updatedItem.id}) não possui 'r'. A notificação WebSocket C_UPDATED_ITEM pode não ser processada corretamente por Coluna-1.js.`,
      );
      // Opcionalmente, você pode decidir enviar a notificação mesmo sem 'r' se outros componentes puderem usá-la
      // await notifyWebSocketServer({ type: "C_UPDATED_ITEM", payload: updatedItem });
    }
  }
  return response.status(200).json(result);
}
