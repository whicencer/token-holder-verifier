import { UserRepository } from "../../database/User";
import { BotContext } from "../types/BotContext";

export async function checkAdmin(ctx: BotContext, next: () => Promise<void>) {
  const usersCollection = new UserRepository();

  if (!ctx.from) {
    return;
  }

  const userId = ctx.from.id;
  const isAdmin = await usersCollection.isUserAdmin(userId);

  if (isAdmin) {
    await next();
  } else {
    await ctx.reply("You do not have permission to access this command.");
  }
}