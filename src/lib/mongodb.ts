import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME ?? process.env.MONGODB_DB ?? "unicare_connect";
const allowInsecureTls = process.env.MONGODB_TLS_INSECURE === "true";
const forceIpv4 = process.env.MONGODB_FORCE_IPV4 === "true";
const shouldLogTiming = process.env.DEBUG_AUTH_TIMING === "true";
const awaitIndexes = process.env.MONGODB_AWAIT_INDEXES === "true";

if (!uri) {
  // In demo mode we allow the app to run without a database connection.
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
    const mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 20000,
      tlsAllowInvalidCertificates: allowInsecureTls,
      tlsAllowInvalidHostnames: allowInsecureTls,
      ...(forceIpv4 ? { family: 4 } : {})
    });

    clientPromise = mongoClient
      .connect()
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

export async function getMongoDatabase(): Promise<Db> {
  const dbStart = shouldLogTiming ? Date.now() : 0;
  const connectedClient = await getMongoClient();
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
