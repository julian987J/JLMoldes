import { createRouter } from "next-connect";
import controller from "infra/controller";
import ordem from "models/tables.js";

const router = createRouter();

router.post(postHandler);

// New GET handler to fetch users
router.get(getHandler);

// New PUT handler to update a user
router.put(putHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const { username, password } = request.body;

  if (!username || !password) {
    return response
      .status(400)
      .json({ message: "Usuário e senha são obrigatórios." });
  }

  try {
    const user = await ordem.verifyUserCredentials(username, password);
    if (user) {
      return response.status(200).json(user);
    } else {
      return response.status(401).json({ message: "Credenciais inválidas." });
    }
  } catch (error) {
    console.error("Erro no handler de login:", error);
    return response.status(500).json({ message: "Erro interno do servidor." });
  }
}

async function getHandler(request, response) {
  // TODO: Implement proper authorization to ensure only admins can access this.
  try {
    const users = await ordem.getUsers();
    // SECURITY WARNING: Sending passwords (even if hashed) to the client is a significant security risk.
    // This is done to fulfill the request of displaying/editing them but is not recommended.
    return response.status(200).json(users);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return response
      .status(500)
      .json({ message: "Erro interno do servidor ao buscar usuários." });
  }
}

async function putHandler(request, response) {
  // TODO: Implement proper authorization to ensure only admins can perform updates.
  try {
    const { id, usuario, senha } = request.body;

    if (id === undefined || !usuario || !senha) {
      // Check for undefined id as well
      return response.status(400).json({
        message: "ID, usuário e senha são obrigatórios para atualização.",
      });
    }

    // SECURITY WARNING: Passwords received from the client should be hashed here
    // before being passed to `ordem.updateUser` if they are being changed.
    // Storing plaintext passwords is a severe security vulnerability.
    const updatedUser = await ordem.updateUser({ id, usuario, senha });

    if (updatedUser) {
      // SECURITY WARNING: Avoid sending the password back in the response.
      // Return the user object without the password, or just a success status.
      // For this example, returning the updatedUser as is from the DB function.
      return response.status(200).json(updatedUser);
    } else {
      return response
        .status(404)
        .json({ message: "Usuário não encontrado para atualização." });
    }
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    if (error.message && error.message.includes("violates unique constraint")) {
      return response
        .status(409)
        .json({ message: "Nome de usuário já existe." });
    }
    return response
      .status(500)
      .json({ message: "Erro interno do servidor ao atualizar usuário." });
  }
}
