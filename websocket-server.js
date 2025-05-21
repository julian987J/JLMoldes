// Importa o pacote ws
const WebSocket = require("ws");

// Porta definida por variável de ambiente (para Railway) ou padrão 8080
const PORT = process.env.PORT || 8080;

// Cria o servidor WebSocket
const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`✅ WebSocket server está rodando na porta ${PORT}`);
});

// Evento de conexão
wss.on("connection", function connection(ws) {
  console.log("🔗 Novo cliente conectado");

  // Envia uma mensagem ao cliente ao conectar
  ws.send("👋 Olá! Conexão WebSocket estabelecida com sucesso.");

  // Evento de recebimento de mensagem
  ws.on("message", function incoming(message) {
    console.log("📩 Mensagem recebida: %s", message);

    // Ecoa a mensagem de volta ao cliente
    ws.send(`🔁 Você enviou: ${message}`);
  });

  // Evento de desconexão
  ws.on("close", () => {
    console.log("❌ Cliente desconectado");
  });

  // Evento de erro
  ws.on("error", (error) => {
    console.error("⚠️ Erro no WebSocket:", error);
  });
});

// Trata erros no servidor
wss.on("error", (err) => {
  console.error("🚨 Erro no servidor WebSocket:", err);
});
