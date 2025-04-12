import { Collection } from "mongodb";
import { CreateUserDto, IUser, IUserRepository } from "./types";
import { Database } from "../db";

export class UserRepository implements IUserRepository {
  private collection: Collection<IUser>;
  private db: Database = new Database();
  constructor() {
    this.collection = this.db.database.collection<IUser>("users");
  }

  public async exists(userId: number, throwError: boolean = false) {
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

  public async create(userData: CreateUserDto): Promise<void> {
    const newUserData = {
      ...userData,
      tonAddress: null,
      verified: false,
      lastCheckedAt: null,
      joinedChannelId: null,
      createdAt: Date.now(),
      jettonBalance: null,
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

  public async getAllUsers() {
    return await this.collection.find().toArray();
  }

  public async getRecentCheckedUsersBatch(batchAmount: number): Promise<IUser[]> {
    return await this.collection
      .find({ verified: true, tonAddress: { $ne: null } })
      .sort({ lastCheckedAt: 1 })
      .limit(batchAmount)
      .toArray();
  }

  public async isUserAdmin(userId: number): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (user) return user.isAdmin;

    return false;
  }

  public async findByTonAddress(tonAddress: string): Promise<IUser | null> {
    return await this.collection.findOne({ tonAddress });
  }
  
  public async getTotalVerifiedUsers(): Promise<number> {
    return await this.collection.countDocuments({ verified: true });
  }

  public async getTotalConnectedWallets(): Promise<number> {
    return await this.collection.countDocuments({ tonAddress: { $ne: null } });
  }

  public async getTotalUsersJoinedChannels(): Promise<number> {
    return await this.collection.countDocuments({ joinedChannelId: { $ne: null } });
  }

  public async getTotalUsersBalance(): Promise<number> {
    const result = await this.collection.aggregate([
      { $match: { jettonBalance: { $ne: null } } },
      { $group: { _id: null, total: { $sum: "$jettonBalance" } } }
    ]).toArray();

    return result.length > 0 ? Math.round(result[0].total) : 0;
  }
}