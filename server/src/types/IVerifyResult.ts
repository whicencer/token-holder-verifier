export interface IVerifyResult {
  isVerified: boolean;
  message: string;
  address?: string;
  tokenAmount?: number;
  jettonWallet?: string;
}