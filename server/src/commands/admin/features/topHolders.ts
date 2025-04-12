import dedent from "dedent";
import { UserRepository } from "../../../../database/User";
import { BotContext } from "../../../types/BotContext";
import { getEnvVariable } from "../../../../config/getEnvVariable";

export async function getTopHolders(ctx: BotContext) {
  const usersCollection = new UserRepository();
  const topHolders = await usersCollection.getTopHolders(10);

  if (topHolders.length === 0) {
    await ctx.reply("No holders found.");
    return;
  }

  const topHoldersText = topHolders
    .map((holder, index) => {
      return `<b>${index + 1}. ${holder.username || holder.tonAddress}</b> - ${holder.jettonBalance} <i>${getEnvVariable("TOKEN_TITLE")}</i>`;
    })
    .join("\n");

  await ctx.reply(dedent`
    🏆 <b>Top holders:</b>

    ${topHoldersText}
  `, { parse_mode: "HTML" });
}