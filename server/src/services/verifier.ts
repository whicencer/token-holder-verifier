import { TonClient, Address, JettonMaster, JettonWallet, fromNano } from "@ton/ton";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { getEnvVariable } from "../../config/getEnvVariable";
import { IVerifyResult } from "../types/IVerifyResult";
import { Database } from "../../database/db";
import dedent from "dedent";

class Verifier {
  private db: Database = new Database();
  constructor() {}

  public async verifyUser(userId: number, userWallet: string): Promise<IVerifyResult> {
    if (!userWallet) {
      throw new Error("Wallet address is required");
    }
  
    const friendlyAddress = Address.parse(userWallet).toString({ bounceable: false });
    const MIN_HOLDER_BALANCE = Number(getEnvVariable("MIN_HOLDER_BALANCE"));
    const JETTON_MINTER_ADDRESS = getEnvVariable("JETTON_MASTER_ADDRESS");
  
    if (!MIN_HOLDER_BALANCE || !JETTON_MINTER_ADDRESS) {
      throw new Error("Missing environment variables: MIN_HOLDER_BALANCE or JETTON_MASTER_ADDRESS");
    }
  
    try {
      const { jettonWallet, balanceTON } = await this.getJettonBalance(friendlyAddress, JETTON_MINTER_ADDRESS);
      
      if (jettonWallet && balanceTON >= MIN_HOLDER_BALANCE) {
        await this.db.userUpdateVerification(userId, friendlyAddress, jettonWallet, true);
        return {
          isVerified: true,
          message: dedent`
            ✅ Congratulations! You are a verified token holder. Your wallet meets the minimum token balance requirement.
            Your link to join the group: [Join Group](https://t.me/+a5SJFUuwH7QwZTli)
          `,
          tokenAmount: balanceTON,
          jettonWallet: jettonWallet
        };
      }
  
      await this.db.userUpdateVerification(userId, friendlyAddress, jettonWallet, false);
      return {
        isVerified: false,
        message: "🚫 You are not a holder. Your wallet does not meet the minimum token balance requirement."
      };
    } catch (error) {
      console.error("Error verifying holder:", error);
      await this.db.userUpdateVerification(userId, friendlyAddress, null, false);
      return {
        isVerified: false,
        message: "Error verifying holder",
      };
    }
  }

  private async getJettonBalance(userWallet: string, jettonMinterAddress: string) {
    try {
      const endpoint = await getHttpEndpoint({ network: "mainnet" });
      const client = new TonClient({ endpoint, apiKey: getEnvVariable("TON_CLIENT_API_KEY") });
  
      const userAddress = Address.parse(userWallet);
      const jettonMaster = client.open(JettonMaster.create(Address.parse(jettonMinterAddress)));
  
      const jettonWalletAddress = await jettonMaster.getWalletAddress(userAddress);
      const jettonWallet = client.open(JettonWallet.create(jettonWalletAddress));
      
      const balanceNano = await jettonWallet.getBalance();
      const balance = fromNano(balanceNano);
      const balanceNumber = Number(balance);
  
      return {
        jettonWallet: jettonWalletAddress.toString(),
        balanceTON: balanceNumber
      };
    } catch (error) {
      console.error("Error fetching jetton balance:", error);
      return {
        jettonWallet: null,
        balanceTON: null,
      };
    }
  }
}

export const verifier = new Verifier();