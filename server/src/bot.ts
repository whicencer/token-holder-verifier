import dotenv from "dotenv";
dotenv.config();

import { Bot, RawApi } from "grammy";
import { verifier } from "./services/verifier";
import { getEnvVariable } from "../config/getEnvVariable";
import { IUserRepository, UserRepository } from "../database/User";
import { Other } from "grammy/out/core/api";
import { commandsList } from "./commands/commands";
import { adminMenu } from "./commands/admin/menu";
import { BotContext } from "./types/BotContext";
import { hydrate } from "@grammyjs/hydrate";
import { conversations, createConversation } from "@grammyjs/conversations";
import { findWalletConversation } from "./commands/admin/features/findWallet";
import { sendMailingConversation } from "./commands/admin/features/sendMailing";
import { MessageEntity } from "grammy/types";

export default class BotInstance {
  private bot = new Bot<BotContext>(getEnvVariable("BOT_TOKEN"));
  private usersCollection: IUserRepository = new UserRepository();
  constructor() {}

  private registerCommandHandlers() {
    Object.entries(commandsList).forEach(([command, handlers]) => {
      this.bot.command(command, ...handlers);
    });
  }

  private registerHandlers() {
    this.registerCommandHandlers();
    this.bot.on("msg:web_app_data", this.webAppDataHandler);
    this.bot.on("chat_join_request", this.chatJoinRequestHandler);
  }

  public async run() {
    this.bot
      .use(conversations())
      .use(createConversation(findWalletConversation, { plugins: [hydrate()] }))
      .use(createConversation(sendMailingConversation, { plugins: [hydrate()] }))
      .use(adminMenu);
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

  public async sendPhoto(userId: number, photoFileId: string, caption: { text: string; entities: MessageEntity[] }) {
    try {
      await this.bot.api.sendPhoto(userId, photoFileId, { caption: caption.text, caption_entities: caption.entities });
    } catch (error) {
      console.error("Error sending photo:", error);
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

  private webAppDataHandler = async (ctx: BotContext) => {
    if (!ctx.from) {
      return;
    }

    const data = ctx.msg?.web_app_data?.data;
    if (data) {
      const { connectedWallet } = JSON.parse(data);

      const verifyResult = await verifier.verifyWallet(ctx.from.id, connectedWallet);

      if (verifyResult.walletAddress) {
        const existingUser = await this.usersCollection.findByTonAddress(verifyResult.walletAddress);
        
        if (existingUser) {
          await ctx.reply("This TON wallet is already linked to another user 🚫");
          return;
        }
      }

      if (verifyResult.verified) {
        await this.usersCollection.setAttribute(ctx.from.id, "verified", true);
        await this.usersCollection.setAttribute(ctx.from.id, "jettonBalance", verifyResult.jettonBalance);
      }
      await this.usersCollection.setAttribute(ctx.from.id, "tonAddress", verifyResult.walletAddress);
      await ctx.reply(verifyResult.message, { parse_mode: "Markdown" });
    }
  }

  private chatJoinRequestHandler = async (ctx: BotContext) => {
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
}