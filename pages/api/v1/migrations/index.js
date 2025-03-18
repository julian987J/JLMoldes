import { createRouter } from "next-connect";
import controller from "infra/controller";
import migrator from "models/migrator.js";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const pendingMigrations = await migrator.listPendingMigrations();

  if (pendingMigrations.length > 0) {
    // Dispara a execução das migrations
    fetch("/api/v1/migrations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data) => console.log("Migrations Executadas:", data))
      .catch((error) => console.error("Falha:", error));
  }

  return response.status(200).json(pendingMigrations);
}

async function postHandler(request, response) {
  const migratedMigrations = await migrator.runPendingMigrations();

  if (migratedMigrations.length > 0) {
    return response.status(201).json(migratedMigrations);
  }

  return response.status(200).json(migratedMigrations);
}
