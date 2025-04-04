import { Db, MongoClient } from "mongodb";
import { getEnvVariable } from "../config/getEnvVariable";

export class Database {
  private client: MongoClient = new MongoClient(getEnvVariable("MONGODB_URI"));
  private db = this.client.db("holder_verifier");
  constructor() {}

  public async connect() {
    try {
      await this.client.connect();
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
    }
  }

  public get database(): Db {
    return this.db;
  }
}