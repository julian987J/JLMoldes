import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const { r, oficina, ano } = request.query;

  if (!r || !oficina) {
    return response.status(400).json({
      error: "Parâmetros 'r' e 'oficina' são obrigatórios",
    });
  }

  try {
    if (ano) {
      // Retorna dados específicos de um ano
      const anoData = await ordem.getTContentAnoByYear(
        parseInt(ano),
        parseInt(r),
        oficina,
      );
      if (!anoData) {
        return response.status(404).json({
          error: "Dados do ano não encontrados",
        });
      }
      return response.status(200).json(anoData);
    } else {
      // Retorna lista de anos disponíveis
      const anos = await ordem.getTContentAno(parseInt(r), oficina);
      return response.status(200).json(anos);
    }
  } catch (error) {
    console.error("Erro no getHandler de TContentAno:", error);
    return response.status(500).json({
      error: "Erro ao buscar dados",
    });
  }
}

async function postHandler(request, response) {
  const {
    ano,
    r,
    oficina,
    papel_data,
    despesas_data,
    encaixes_data,
    bobinas_data,
  } = request.body;

  // Validação dos campos obrigatórios
  if (
    !ano ||
    !r ||
    !oficina ||
    !papel_data ||
    !despesas_data ||
    !encaixes_data ||
    !bobinas_data
  ) {
    return response.status(400).json({
      error: "Todos os campos são obrigatórios",
    });
  }

  try {
    // Verifica se já existe um registro para este ano/r/oficina
    const exists = await ordem.checkTContentAnoExists(
      parseInt(ano),
      parseInt(r),
      oficina,
    );

    if (exists) {
      return response.status(400).json({
        error: "TCONTENT_ANO_EXISTS",
        message:
          "Já existe um snapshot salvo para este ano, R e Oficina. Delete o existente antes de criar um novo.",
      });
    }

    // Cria o novo registro
    const newAno = await ordem.createTContentAno({
      ano: parseInt(ano),
      r: parseInt(r),
      oficina,
      papel_data,
      despesas_data,
      encaixes_data,
      bobinas_data,
    });

    return response.status(201).json(newAno.rows[0]);
  } catch (error) {
    console.error("Erro no postHandler de TContentAno:", error);
    return response.status(500).json({
      error: "Erro ao criar snapshot",
    });
  }
}
