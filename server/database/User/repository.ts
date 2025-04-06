import { Collection } from "mongodb";
import { IUser, IUserRepository } from "./types";
import { Database } from "../db";

export class UserRepository implements IUserRepository {
  private collection: Collection<IUser>;
  private db: Database = new Database();
  constructor() {
    this.collection = this.db.database.collection<IUser>("users");
  }

  public async exists(userId: number, throwError: boolean = false): Promise<boolean> {
    const user = await this.collection.findOne({ userId });
    
    if (user) {
      return true;
    } else {
      if (throwError) {
        throw new Error(`User with ID ${userId} does not exist`);
      }
      return false;
    }
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
      verified: false,
      lastCheckedAt: null,
      joinedChannelId: null,
      createdAt: Date.now(),
    };

    const isUserExists = await this.exists(userData.userId);
    if (!isUserExists) {
      await this.collection.insertOne(newUserData);
    }
  }

  public async setAttribute(userId: number, key: string, value: any): Promise<void> {
    await this.exists(userId, true);
    await this.collection.updateOne({ userId }, { $set: { [key]: value } });
  }

  public async getUserById(userId: number): Promise<IUser | null> {
    return await this.collection.findOne({ userId });
  }

  public async getRecentCheckedUsersBatch(batchAmount: number): Promise<IUser[]> {
    return await this.collection
      .find({ verified: true, tonAddress: { $ne: null } })
      .sort({ lastCheckedAt: 1 })
      .limit(batchAmount)
      .toArray();
  }
}