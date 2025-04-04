import { Collection } from "mongodb";
import { IUser, IUserRepository } from "./types";
import { DatabaseConnection } from "../db";

export class UserRepository implements IUserRepository {
  private collection: Collection<IUser>;

  constructor() {
    const connection = DatabaseConnection.getInstance();
    this.collection = connection.db.collection<IUser>("users");
  }

  public async exists(userId: number): Promise<boolean> {
    const user = await this.collection.findOne({ userId });
    return !!user;
  }

  public async create(
    userData: {
      userId: number,
      username: string,
      firstName: string,
      lastName: string
    }
  ): Promise<void> {
    const newUserData = {
      ...userData,
      tonAddress: null,
      jettonWalletAddress: null,
      verified: false,
      lastCheckedAt: null,
      
      createdAt: Date.now(),
    };

    const isUserExists = await this.exists(userData.userId);
    if (!isUserExists) {
      await this.collection.insertOne(newUserData);
    }
  }

  public async updateVerification(
    userId: number,
    tonAddress: string,
    jettonWalletAddress: string | null,
    verified: boolean
  ): Promise<void> {
    await this.collection.updateOne(
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

  public async getVerificationStatus(userId: number): Promise<boolean> {
    const user = await this.collection.findOne({ userId });

    return user?.verified ?? false;
  }
}