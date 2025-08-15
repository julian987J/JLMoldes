import "../styles/globals.css";
import { WebSocketProvider } from "../contexts/WebSocketContext";
import { AuthProvider } from "../contexts/AuthContext"; // Novo import
import Head from "next/head";

function MyApp({ Component, pageProps }) {
  const webSocketUrl =
    process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080";

  return (
    <AuthProvider>
      <Head>
        <title>JLMoldes</title>
        <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
      </Head>
      {/* Envolve com AuthProvider */}
      <WebSocketProvider url={webSocketUrl}>
        <Component {...pageProps} />
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default MyApp;
