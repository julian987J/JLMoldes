import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

export const WebSocketProvider = ({ children, url }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const pingIntervalRef = useRef(null); // Adicionado para gerenciar o intervalo de ping

  const connect = useCallback(() => {
    console.log("Tentando conectar ao WebSocket em:", url);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("WebSocket conectado a", url);
      setIsConnected(true);
      // Inicia o envio de pings para manter a conexão ativa
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({ type: "PING", timestamp: new Date().getTime() }),
          );
        }
      }, 30000); // Envia ping a cada 30 segundos
    };

    ws.onmessage = (event) => {
      try {
        const messageData = JSON.parse(event.data);
        console.log("Mensagem recebida do WebSocket:", messageData);
        const message = {
          id: `${new Date().getTime()}-${Math.random()}`, // ID único
          data: messageData,
          timestamp: new Date().getTime(),
        };
        setLastMessage(message);
      } catch (error) {
        console.error(
          "Erro ao processar mensagem WebSocket:",
          event.data,
          error,
        );
        const message = {
          id: `${new Date().getTime()}-${Math.random()}`, // ID único
          data: event.data,
          timestamp: new Date().getTime(),
          error: true,
        };
        setLastMessage(message);
      }
    };

    ws.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
    };

    ws.onclose = (event) => {
      console.log("WebSocket desconectado:", event.reason, "Code:", event.code);
      setIsConnected(false);
      // Limpa o intervalo de ping ao desconectar
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      // Tentativa de reconexão automática
      setTimeout(() => {
        if (!socket || socket.readyState === WebSocket.CLOSED) {
          console.log("Tentando reconectar o WebSocket...");
          connect();
        }
      }, 3000); // Tenta reconectar após 3 segundos
    };

    setSocket(ws);
  }, [url]);

  useEffect(() => {
    if (url && !socket) {
      connect();
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("Fechando WebSocket ao desmontar o provider.");
        socket.close();
      }
      // Limpa o intervalo de ping também ao desmontar o componente
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, connect, socket]);

  const sendMessage = useCallback(
    (message) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        console.warn(
          "WebSocket não está conectado. Mensagem não enviada:",
          message,
        );
      }
    },
    [socket],
  );

  return (
    <WebSocketContext.Provider
      value={{ socket, isConnected, lastMessage, sendMessage, connect }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
