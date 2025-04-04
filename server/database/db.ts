import { Db, MongoClient } from "mongodb";
import { getEnvVariable } from "../config/getEnvVariable";

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private client: MongoClient;
  private _db: Db | null = null;

  private constructor() {
    this.client = new MongoClient(getEnvVariable("MONGODB_URI"));
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (!this._db) {
      try {
        await this.client.connect();
        this._db = this.client.db("holder_verifier");
        console.log("Connected to MongoDB");
      } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
      }
    }
  }

  public get db(): Db {
    if (!this._db) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this._db;
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this._db = null;
      console.log("Disconnected from MongoDB");
    }
  }
}