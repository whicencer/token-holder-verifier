import { IUserRepository, UserRepository } from "../../database/User";
import { getEnvVariable } from "../../config/getEnvVariable";
import dedent from "dedent";
import { BotContext } from "../types/BotContext";

export const startCommandHandler = async (ctx: BotContext) => {
  const usersCollection: IUserRepository = new UserRepository();

  if (!ctx.from) {
    return;
  }

  const isSuperAdmin = parseInt(getEnvVariable("ADMIN_TELEGRAM_ID")) === ctx.from.id;
  const existingUser = await usersCollection.getUserById(ctx.from.id);

  const message = dedent`
    Hello! I am a bot to verify $${getEnvVariable("TOKEN_TITLE")} token holders.
    Please, click the button below to verify.

    ${
      isSuperAdmin || existingUser?.isAdmin
        ? "<i>You are an admin. Use command /admin to enter admin panel.</i>"
        : ""
    }
  `;

  await usersCollection.create({
    userId: ctx.from.id,
    username: ctx.from.username,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
    isAdmin: isSuperAdmin
  });
  await ctx.reply(message, {
    parse_mode: "HTML",
    reply_markup: {
      keyboard: [
        [{ text: "✅ Verify", web_app: { url: getEnvVariable("MINI_APP_URL") } }],
      ],
      resize_keyboard: true
    }
  });
}