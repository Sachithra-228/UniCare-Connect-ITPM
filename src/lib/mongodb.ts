import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  // In demo mode we allow the app to run without a database connection.
  console.warn("MONGODB_URI is not set. Falling back to demo mode.");
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export function getMongoClient() {
  if (!uri) {
    throw new Error("MONGODB_URI not configured");
  }

  if (client) {
    return Promise.resolve(client);
  }

  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect().then((connectedClient) => {
      client = connectedClient;
      return connectedClient;
    });
  }

  return clientPromise;
}
