import dotenv from "dotenv";
dotenv.config();

import dedent from "dedent";
import { Bot, Context, RawApi } from "grammy";
import { verifier } from "./services/verifier";
import { getEnvVariable } from "../config/getEnvVariable";
import { IUserRepository, UserRepository } from "../database/User";
import { Other } from "grammy/out/core/api";

export default class BotInstance {
  private bot: Bot = new Bot(getEnvVariable("BOT_TOKEN"));
  private usersCollection: IUserRepository = new UserRepository();
  constructor() {}

  public async run() {
    this.registerHandlers();
    await this.bot.start();
  }

  public async sendMessage(userId: number, message: string, options?: Other<RawApi, "sendMessage", "text" | "chat_id">) {
    try {
      await this.bot.api.sendMessage(userId, message, { link_preview_options: { is_disabled: true }, ...options });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  public async kickChatMember(chatId: number, userId: number) {
    try {
      await this.banChatMember(chatId, userId);
      await this.unbanChatMember(chatId, userId);
    } catch (error) {
      console.error("Error kicking user:", error);
    }
  }

  public async banChatMember(chatId: number, userId: number) {
    try {
      await this.bot.api.banChatMember(chatId, userId);
    } catch (error) {
      console.error("Error kicking user:", error);
    }
  }

  public async unbanChatMember(chatId: number, userId: number) {
    try {
      await this.bot.api.unbanChatMember(chatId, userId);
    } catch (error) {
      console.error("Error unbanning user:", error);
    }
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

      const verifyResult = await verifier.verifyWallet(ctx.from.id, connectedWallet);
      if (verifyResult.verified) {
        await this.usersCollection.setAttribute(ctx.from.id, "tonAddress", connectedWallet);
        await this.usersCollection.setAttribute(ctx.from.id, "verified", true);
      }
      await ctx.reply(verifyResult.message, { parse_mode: "Markdown" });
    }
  }

  private chatJoinRequestHandler = async (ctx: Context) => {
    if (!ctx.from) {
      return;
    }

    const chatId = ctx.chat?.id;
    const userId = ctx.from.id;
    const user = await this.usersCollection.getUserById(userId);
    if (chatId && user && user.verified) {
      ctx.approveChatJoinRequest(userId);
      await this.sendMessage(userId, `Welcome to the group of $${getEnvVariable("TOKEN_TITLE")} whales!`);
      await this.usersCollection.setAttribute(userId, "joinedChannelId", chatId);
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
      Hello! I am a bot to verify $${getEnvVariable("TOKEN_TITLE")} token holders.
      Please, click the button below to verify.
    `;

    await this.usersCollection.create({
      userId: ctx.from.id,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name
    });
    await ctx.reply(message, {
      reply_markup: {
        keyboard: [
          [{ text: "✅ Verify", web_app: { url: getEnvVariable("MINI_APP_URL") } }],
        ],
        resize_keyboard: true
      }
    });
  }
}