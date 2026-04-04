import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME ?? process.env.MONGODB_DB ?? "unicare_connect";
const allowInsecureTls = process.env.MONGODB_TLS_INSECURE === "true";
const forceIpv4 = process.env.MONGODB_FORCE_IPV4 === "true";
const shouldLogTiming = process.env.DEBUG_AUTH_TIMING === "true";
const awaitIndexes = process.env.MONGODB_AWAIT_INDEXES === "true";

const MAX_CONNECT_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 2000;

if (!uri) {
  console.warn("MONGODB_URI is not set. Falling back to demo mode.");
}

if (allowInsecureTls) {
  console.warn("MONGODB_TLS_INSECURE=true enabled. Use only for local debugging.");
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;
let indexesReady: Promise<void> | null = null;
type GlobalMongoCache = {
  client?: MongoClient;
  clientPromise?: Promise<MongoClient>;
  indexesReady?: Promise<void>;
};

function getGlobalMongoCache(): GlobalMongoCache {
  const globalWithMongo = globalThis as typeof globalThis & { __unicareMongoCache?: GlobalMongoCache };
  if (!globalWithMongo.__unicareMongoCache) {
    globalWithMongo.__unicareMongoCache = {};
  }
  return globalWithMongo.__unicareMongoCache;
}

export function isMongoTlsHandshakeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  const cause = (error as { cause?: unknown }).cause;
  const causeMessage =
    cause && typeof cause === "object" ? String((cause as { message?: string }).message ?? "").toLowerCase() : "";
  return (
    message.includes("ssl3_read_bytes") ||
    message.includes("tlsv1 alert internal error") ||
    message.includes("err_ssl_tlsv1_alert_internal_error") ||
    causeMessage.includes("ssl3_read_bytes") ||
    causeMessage.includes("tlsv1 alert internal error") ||
    causeMessage.includes("err_ssl_tlsv1_alert_internal_error")
  );
}

function isMongoNetworkError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = (error as { name?: string }).name;
  return (
    name === "MongoServerSelectionError" ||
    name === "MongoNetworkTimeoutError" ||
    name === "MongoNetworkError"
  );
}

export function resetMongoClient() {
  if (client) {
    client.close().catch(() => {});
  }
  client = null;
  clientPromise = null;
  indexesReady = null;
  const globalCache = getGlobalMongoCache();
  globalCache.client = undefined;
  globalCache.clientPromise = undefined;
  globalCache.indexesReady = undefined;
}

export function getMongoClient() {
  if (!uri) {
    throw new Error("MONGODB_URI not configured");
  }

  const globalCache = getGlobalMongoCache();
  if (!client && globalCache.client) {
    client = globalCache.client;
  }
  if (!clientPromise && globalCache.clientPromise) {
    clientPromise = globalCache.clientPromise;
  }
  if (!indexesReady && globalCache.indexesReady) {
    indexesReady = globalCache.indexesReady;
  }

  if (client) {
    return Promise.resolve(client);
  }

  if (!clientPromise) {
    const connectStart = shouldLogTiming ? Date.now() : 0;

    clientPromise = connectWithRetry()
      .then((connectedClient) => {
        if (shouldLogTiming) {
          console.info(`[mongodb] connect in ${Date.now() - connectStart}ms`);
        }
        client = connectedClient;
        globalCache.client = connectedClient;
        return connectedClient;
      })
      .catch((error) => {
        clientPromise = null;
        globalCache.clientPromise = undefined;
        throw error;
      });

    globalCache.clientPromise = clientPromise;
  }

  return clientPromise;
}

async function connectWithRetry(): Promise<MongoClient> {
  const baseOptions = {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 20000,
    socketTimeoutMS: 45000,
    maxPoolSize: 5,
    minPoolSize: 0,
    retryWrites: true,
    retryReads: true,
    maxIdleTimeMS: 60000,
    tlsAllowInvalidCertificates: allowInsecureTls,
    tlsAllowInvalidHostnames: allowInsecureTls
  };

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_CONNECT_RETRIES; attempt++) {
    try {
      const mongoClient = new MongoClient(uri!, {
        ...baseOptions,
        ...(forceIpv4 ? { family: 4 } : {})
      });
      return await mongoClient.connect();
    } catch (error) {
      lastError = error;

      if (!forceIpv4 && isMongoTlsHandshakeError(error)) {
        try {
          const ipv4Client = new MongoClient(uri!, {
            ...baseOptions,
            family: 4
          });
          const connected = await ipv4Client.connect();
          console.warn("[mongodb] TLS handshake failed; reconnected using IPv4 fallback.");
          return connected;
        } catch {
          lastError = error;
        }
      }

      if (attempt < MAX_CONNECT_RETRIES && (isMongoTlsHandshakeError(error) || isMongoNetworkError(error))) {
        const delay = RETRY_BASE_DELAY_MS * attempt;
        console.warn(
          `[mongodb] connect attempt ${attempt}/${MAX_CONNECT_RETRIES} failed (${
            error instanceof Error ? error.message.substring(0, 80) : "unknown"
          }), retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

export async function getMongoDatabase(): Promise<Db> {
  const dbStart = shouldLogTiming ? Date.now() : 0;
  let connectedClient: MongoClient;

  try {
    connectedClient = await getMongoClient();
  } catch (error) {
    if (isMongoTlsHandshakeError(error) || isMongoNetworkError(error)) {
      resetMongoClient();
    }
    throw error;
  }

  const db = connectedClient.db(dbName);
  if (shouldLogTiming) {
    console.info(`[mongodb] getMongoDatabase in ${Date.now() - dbStart}ms`);
  }

  if (!indexesReady) {
    const indexStart = shouldLogTiming ? Date.now() : 0;
    indexesReady = (async () => {
      const users = db.collection("users");
      await Promise.all([
        users.createIndex({ firebaseUid: 1 }, { name: "users_firebaseUid" }),
        users.createIndex({ email: 1 }, { name: "users_email" }),
        users.createIndex({ createdAt: -1 }, { name: "users_createdAt" })
      ]);
    })().catch((error) => {
      indexesReady = null;
      console.warn("[mongodb] Failed to ensure indexes:", error instanceof Error ? error.message : error);
    }).finally(() => {
      if (shouldLogTiming) {
        console.info(`[mongodb] ensureIndexes in ${Date.now() - indexStart}ms`);
      }
    });
    const globalCache = getGlobalMongoCache();
    globalCache.indexesReady = indexesReady;
  }

  if (awaitIndexes && indexesReady) {
    await indexesReady;
  }

  return db;
}
