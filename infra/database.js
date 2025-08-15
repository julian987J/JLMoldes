import { Pool } from "pg";
import { ServiceError } from "./errors.js";

let pool;

function getPool() {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: getSSLValues(),
    // Configuração do pool é importante para ambientes serverless
    max: 10, // Limita o número de conexões concorrentes
    idleTimeoutMillis: 30000, // Fecha clientes ociosos após 30 segundos
    connectionTimeoutMillis: 20000, // Retorna um erro após 20 segundos se a conexão não puder ser estabelecida
  });

  pool.on("error", (err) => {
    console.error(
      "Erro inesperado em um cliente ocioso do banco de dados:",
      err,
    );
  });

  return pool;
}

async function query(queryObject) {
  const pool = getPool();
  try {
    // O pool gerencia o ciclo de vida do cliente (pegar, usar, devolver)
    const result = await pool.query(queryObject);
    return result;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      message: "Erro na conexão com o Banco ou na Query",
      cause: error,
    });
    throw serviceErrorObject;
  }
}

async function getNewClient() {
  // Para quando você precisar de um cliente dedicado para transações.
  // O chamador é responsável por chamar client.release() quando terminar.
  const pool = getPool();
  return pool.connect();
}

const database = {
  query,
  getNewClient,
};

export default database;

function getSSLValues() {
  // Caso você queira usar um certificado (não é o caso no Railway)
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
      rejectUnauthorized: true,
    };
  }

  // SSL apenas em produção e preview (ex: Railway)
  const env = process.env.NODE_ENV;
  const isProdOrPreview = env === "production" || env === "preview";

  return isProdOrPreview ? { rejectUnauthorized: false } : false;
}
