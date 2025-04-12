import { Conversation } from "@grammyjs/conversations";
import { BotContext } from "../../../types/BotContext";
import { ConversationContext } from "../../../types/ConversationContext";
import { MessageEntity } from "grammy/types";
import Bottleneck from "bottleneck";
import { UserRepository } from "../../../../database/User";
import BotInstance from "../../../bot";

export async function sendMailingConversation(conversation: Conversation<BotContext, ConversationContext>, ctx: ConversationContext) {
  const menu = conversation.menu("sendMailingConversationMenu")
    .text("❌ Cancel", async ctx => {
      await ctx.deleteMessage();
      await conversation.halt();
    });

  const conversationInitMessage = await ctx.reply(
    "✉️ Send me a message you want to send to all users.\n\n" +
    "You can send:\n" +
    "• Text message\n" +
    "• Photo with/out caption\n\n" +
    "⚠️ <b>Warning:</b> Mailing will start instantly after you send me a message",
    { parse_mode: "HTML", reply_markup: menu }
  );

  const result = await conversation.waitFor(["message:text", "message:photo"]);
  await ctx.api.deleteMessage(result.message.chat.id, result.message.message_id);

  let text = "";
  let entities: MessageEntity[] = [];
  let photoFileId: string | undefined = undefined;

  if (result.message.photo) {
    photoFileId = result.message.photo[0].file_id;
    text = result.message.caption || "";
    entities = result.message.caption_entities || [];
  } else {
    text = result.message.text || "";
    entities = result.message.entities || [];
  }

  await conversationInitMessage.editText("✉️ Sending messages to users...");
  const deliveredCount = await startMailing({
    text,
    entities,
    photoFileId
  }, result.message.from.id);
  await conversationInitMessage.editText(`✉️ Message sent to <b>${deliveredCount}</b> users`, { parse_mode: "HTML" });
}

export async function startMailing(
  message: {
    text: string;
    entities: MessageEntity[];
    photoFileId?: string;
  },
  exceptUserId?: number
): Promise<number> {
  let deliveredCount = 0;
  try {
    const { text, entities } = message;

    const bot = new BotInstance();
    const userRepository = new UserRepository();
    const users = await userRepository.getAllUsers();
    const limiter = new Bottleneck({
      maxConcurrent: 15,
      minTime: 33,
      reservoir: 30,
      reservoirRefreshAmount: 30,
      reservoirRefreshInterval: 1000
    });
    
    for (const user of users) {
      if (user.userId === exceptUserId) continue; // Skip if user is admin
      await limiter.schedule(async () => {
        if (message.photoFileId) {
          await bot.sendPhoto(user.userId, message.photoFileId, { text, entities });
        } else {
          await bot.sendMessage(user.userId, text, { entities });
        }
        deliveredCount++;
      });
    }
  } catch (error) {
    console.error("Error in mailing:", error);
  } finally {
    return deliveredCount;
  }
}