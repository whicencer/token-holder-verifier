export interface IUser {
  userId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  tonAddress: string | null;
  jettonBalance: number | null;
  verified: boolean;
  lastCheckedAt: number | null;
  createdAt: number;
  joinedChannelId: number | null;
  isAdmin: boolean;
}

export interface CreateUserDto {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
}

export interface IUserRepository {
  exists(userId: number, throwError?: boolean): Promise<boolean>;
  create(userData: Partial<IUser>): Promise<void>;
  setAttribute(userId: number, key: string, value: any): Promise<void>;
  getUserById(userId: number): Promise<IUser | null>;
  getRecentCheckedUsersBatch(batchAmount: number): Promise<IUser[]>;
  isUserAdmin(userId: number): Promise<boolean>;
  getAllUsers(): Promise<IUser[]>;
  findByTonAddress(tonAddress: string): Promise<IUser | null>;

  getTotalUsersBalance(): Promise<number>;
  getTotalVerifiedUsers(): Promise<number>;
  getTotalConnectedWallets(): Promise<number>;
  getTotalUsersJoinedChannels(): Promise<number>;
  getTopHolders(limit: number): Promise<IUser[]>;
}