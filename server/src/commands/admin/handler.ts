import dedent from "dedent";
import { IUserRepository, UserRepository } from "../../../database/User";
import { adminMenu } from "./menu";
import { BotContext } from "../../types/BotContext";
import { getEnvVariable } from "../../../config/getEnvVariable";

export const adminCommandHandler = async (ctx: BotContext) => {
  const usersCollection: IUserRepository = new UserRepository();

  const users = await usersCollection.getAllUsers();
  const usersCount = users.length;
  const verifiedUsersCount = await usersCollection.getTotalVerifiedUsers();
  const connectedWalletsCount = await usersCollection.getTotalConnectedWallets();
  const usersJoinedChannelsCount = await usersCollection.getTotalUsersJoinedChannels();
  const allUsersTotalBalance = await usersCollection.getTotalUsersBalance();

  const message = dedent`
    <b>🤖 Statistics</b>

    <b>👤 Users</b>
          &#160;|– <i>Total count: ${usersCount} users</i>
          ╰ <i>Joined private group: ${usersJoinedChannelsCount} users</i>

    <b>👛 Wallets</b>
          &#160;|– <i>Connected: ${connectedWalletsCount} wallets</i>
          &#160;|– <i>Total balance: ${allUsersTotalBalance} ${getEnvVariable("TOKEN_TITLE")}</i>
          ╰ <i>Verified: ${verifiedUsersCount} wallets</i>
  `;
  await ctx.reply(message, {
    parse_mode: "HTML",
    reply_markup: adminMenu
  });
}