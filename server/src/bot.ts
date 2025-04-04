import dedent from "dedent";
import { Bot, Context } from "grammy";
import { verifier } from "./services/verifier";
import { getEnvVariable } from "../config/getEnvVariable";
import { Database } from "../database/db";

export default class BotInstance {
  private bot: Bot = new Bot(getEnvVariable("BOT_TOKEN"));
  private db: Database = new Database();
  constructor() {}

  public run() {
    this.registerHandlers();
    this.bot.start();
  }

  private registerHandlers() {
    this.bot.command("start", this.startCommandHandler);
    this.bot.on("msg:web_app_data", this.webAppDataHandler);
    this.bot.on("chat_join_request", this.chatJoinRequestHandler);
  }

  private webAppDataHandler = async (ctx: Context) => {
    if (!ctx.from) {
      return;
    }

    const data = ctx.msg?.web_app_data?.data;
    if (data) {
      const { connectedWallet } = JSON.parse(data);

      const verifyResult = await verifier.verifyUser(ctx.from.id, connectedWallet);
      await ctx.reply(verifyResult.message, { parse_mode: "Markdown" });
    }
  }

  private chatJoinRequestHandler = async (ctx: Context) => {
    if (!ctx.from) {
      return;
    }

    const userId = ctx.from.id;
    const isUserVerificated = await this.db.isUserVerificated(userId);
    if (isUserVerificated) {
      ctx.approveChatJoinRequest(userId);
    } else {
      ctx.api.sendMessage(userId, "❌ You are not verified. Please verify your wallet first: /start");
      ctx.declineChatJoinRequest(userId);
    }
  }

  private startCommandHandler = async (ctx: Context) => {
    if (!ctx.from) {
      return;
    }

    const message = dedent`
      Hello! I am a bot to verify $SIGMABOY token holders.
      Please, click the button below to verify.
    `;

    await this.db.createNewUser(
      ctx.from.id,
      ctx.from.username,
      ctx.from.first_name,
      ctx.from.last_name
    );
    ctx.reply(message, {
      reply_markup: {
        keyboard: [
          // Past your web app URL here
          [{ text: "✅ Verify", web_app: { url: "https://chicago-naturally-baseline-written.trycloudflare.com" } }],
        ],
        resize_keyboard: true
      }
    });
  }
}