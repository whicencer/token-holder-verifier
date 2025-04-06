export interface IUser {
  userId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  tonAddress: string | null;
  verified: boolean;
  lastCheckedAt: number | null;
  createdAt: number;
  joinedChannelId: number | null;
}

export interface IUserRepository {
  exists(userId: number, throwError: boolean): Promise<boolean>;
  create(userData: Partial<IUser>): Promise<void>;
  setAttribute(userId: number, key: string, value: any): Promise<void>;
  getUserById(userId: number): Promise<IUser | null>;
  getRecentCheckedUsersBatch(batchAmount: number): Promise<IUser[]>;
}