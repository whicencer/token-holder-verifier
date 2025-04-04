export interface IUser {
  userId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  tonAddress: string | null;
  jettonWalletAddress: string | null;
  verified: boolean;
  lastCheckedAt: number | null;
  createdAt: number;
  errorReason?: string | null;
}

export interface IUserRepository {
  exists(userId: number): Promise<boolean>;
  create(userData: Partial<IUser>): Promise<void>;
  updateVerification(
    userId: number, 
    tonAddress: string, 
    jettonWalletAddress: string | null, 
    verified: boolean,
  ): Promise<void>;
  getVerificationStatus(userId: number): Promise<boolean>;
}