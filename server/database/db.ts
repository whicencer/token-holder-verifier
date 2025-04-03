import { MongoClient } from "mongodb";
import { getEnvVariable } from "../config/getEnvVariable";

export class Database {
  private client: MongoClient = new MongoClient(getEnvVariable("MONGODB_URI"));
  private db = this.client.db("holder_verifier");
  private users_collection = this.db.collection("users");
  constructor() {}

  public async connect() {
    try {
      await this.client.connect();
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
    }
  }

  public async checkUserExists(userId: number) {
    const user = await this.users_collection.findOne({ userId });
    if (user) {
      return true;
    } else {
      return false;
    }
  }

  public async createNewUser(
    userId: number,
    username: string = "",
    firstName: string = "",
    lastName: string = ""
  ) {
    const newUserData = {
      userId,
      username,
      firstName,
      lastName,
      tonAddress: null,
      jettonWalletAddress: null,
      verified: false,
      lastCheckedAt: null,
      
      createdAt: Date.now(),
    };

    const isUserExists = await this.checkUserExists(userId);
    if (!isUserExists) {
      await this.users_collection.insertOne(newUserData);
    }
  }

  public async userUpdateVerification(userId: number, tonAddress: string, jettonWalletAddress: string | null, verified: boolean) {
    await this.users_collection.updateOne(
      { userId },
      {
        $set: {
          verified,
          tonAddress,
          jettonWalletAddress,
          lastCheckedAt: Date.now(),
        }
      }
    );
  }

  public async isUserVerificated(userId: number) {
    const user = await this.users_collection.findOne({ userId });
    return user;
  }
}