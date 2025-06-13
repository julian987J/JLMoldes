import "../styles/globals.css";
import { WebSocketProvider } from "../contexts/WebSocketContext";
import { AuthProvider } from "../contexts/AuthContext"; // Novo import

function MyApp({ Component, pageProps }) {
  const webSocketUrl =
    process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080";

  return (
    <AuthProvider>
      {" "}
      {/* Envolve com AuthProvider */}
      <WebSocketProvider url={webSocketUrl}>
        <Component {...pageProps} />
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default MyApp;
