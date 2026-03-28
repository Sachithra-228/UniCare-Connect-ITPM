import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME ?? process.env.MONGODB_DB ?? "unicare_connect";
const allowInsecureTls = process.env.MONGODB_TLS_INSECURE === "true";

if (!uri) {
  // In demo mode we allow the app to run without a database connection.
  console.warn("MONGODB_URI is not set. Falling back to demo mode.");
}

if (allowInsecureTls) {
  console.warn("MONGODB_TLS_INSECURE=true enabled. Use only for local debugging.");
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;
type GlobalMongoCache = {
  client?: MongoClient;
  clientPromise?: Promise<MongoClient>;
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

  if (client) {
    return Promise.resolve(client);
  }

  if (!clientPromise) {
    const mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 20000,
      tlsAllowInvalidCertificates: allowInsecureTls,
      tlsAllowInvalidHostnames: allowInsecureTls
    });

    clientPromise = mongoClient
      .connect()
      .then((connectedClient) => {
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
  const connectedClient = await getMongoClient();
  return connectedClient.db(dbName);
}
