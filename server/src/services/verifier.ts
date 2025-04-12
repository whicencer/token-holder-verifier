import { TonClient, Address, JettonMaster, JettonWallet, fromNano } from "@ton/ton";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { getEnvVariable } from "../../config/getEnvVariable";
import dedent from "dedent";
import { UserRepository } from "../../database/User";

interface IVerifyResult {
  verified: boolean;
  message: string;
  walletAddress?: string;
  jettonBalance?: number;
}

class Verifier {
  private userRepository: UserRepository = new UserRepository();
  constructor() {}

  public async verifyWallet(userId: number, walletAddress: string): Promise<IVerifyResult> {
    if (!walletAddress) {
      throw new Error("Wallet address is required");
    }

    const friendlyTONAddress = Address.parse(walletAddress).toString({ bounceable: false });
    const MIN_HOLDER_BALANCE = Number(getEnvVariable("MIN_HOLDER_BALANCE"));
    const JETTON_MINTER_ADDRESS = getEnvVariable("JETTON_MASTER_ADDRESS");
  
    if (!MIN_HOLDER_BALANCE || !JETTON_MINTER_ADDRESS) {
      throw new Error("Missing environment variables: MIN_HOLDER_BALANCE or JETTON_MASTER_ADDRESS");
    }
  
    try {
      const jettonBalance = await this.getJettonBalance(friendlyTONAddress, JETTON_MINTER_ADDRESS);
      
      if (jettonBalance && jettonBalance >= MIN_HOLDER_BALANCE) {
        return {
          verified: true,
          message: dedent`
            ✅ Congratulations! You are a verified token holder. Your wallet meets the minimum token balance requirement.
            Your link to join the group: [Join Group](https://t.me/+a5SJFUuwH7QwZTli)
          `,
          walletAddress: friendlyTONAddress,
          jettonBalance
        };
      }

      return {
        verified: false,
        message: dedent`
          🚫 You are not a holder. Your wallet does not meet the minimum token balance requirement.
          You can buy tokens [here](https://app.ston.fi/swap?ft=TON&tt=EQBlWgKnh_qbFYTXfKgGAQPxkxFsArDOSr9nlARSzydpNPwA&chartVisible=true&chartInterval=1w&ta=20)

          If you believe this is a mistake, please contact @support.
        `,
        walletAddress: friendlyTONAddress,
      };
    } catch (error) {
      console.error("Error verifying holder:", error);
      return {
        verified: false,
        message: "Error verifying holder"
      };
    } finally {
      await this.userRepository.setAttribute(userId, "lastCheckedAt", Date.now());
    }
  }

  private async getJettonBalance(walletAddress: string, jettonMinterAddress: string): Promise<number | null> {
    try {
      const endpoint = await getHttpEndpoint({ network: "mainnet" });
      const client = new TonClient({ endpoint, apiKey: getEnvVariable("TON_CLIENT_API_KEY") });
  
      const userWalletAddress = Address.parse(walletAddress);
      const jettonMaster = client.open(JettonMaster.create(Address.parse(jettonMinterAddress)));
  
      const jettonWalletAddress = await jettonMaster.getWalletAddress(userWalletAddress);
      const jettonWallet = client.open(JettonWallet.create(jettonWalletAddress));
      
      const balanceNano = await jettonWallet.getBalance();
      const balance = fromNano(balanceNano);
      const jettonBalance = Number(balance);
  
      return jettonBalance;
    } catch (error) {
      console.error("Error fetching jetton balance:", error);
    }
    
    return null;
  }
}

export const verifier = new Verifier();