import { Context } from "grammy";
import { Conversation } from "@grammyjs/conversations";
import { HydrateFlavor } from "@grammyjs/hydrate";
import dedent from "dedent";
import { BotContext } from "../../../types/BotContext";
import { IUserRepository, UserRepository } from "../../../../database/User";
import { getEnvVariable } from "../../../../config/getEnvVariable";

type MyConversationContext = HydrateFlavor<Context>;

export async function findWalletConversation(conversation: Conversation<BotContext, MyConversationContext>, ctx: MyConversationContext) {
  const usersCollection: IUserRepository = new UserRepository();
  const menu = conversation.menu("findWalletConversationMenu")
    .text("❌ Cancel", async ctx => {
      await ctx.deleteMessage();
      await conversation.halt();
    });

  const sendAddressMessage = await ctx.reply("🔍 Send me an TON address you want to check <b>(Non-bounceable)</b>", { parse_mode: "HTML", reply_markup: menu });
  const { message } = await conversation.waitFor("message:text");
  
  await ctx.api.deleteMessage(message.chat.id, message.message_id);
  await sendAddressMessage.editText(`Finding address, <code>${message.text}</code>`, { parse_mode: "HTML" });

  const user = await usersCollection.findByTonAddress(message.text);
  if (!user) {
    await sendAddressMessage.editText("😓 User with this address not found");
    return await conversation.halt();
  }

  const successMessage = dedent`
    ✅ User found!

    <b>Wallet address:</b> <code>${user.tonAddress}</code>
    <b>Balance:</b> <code>${user.jettonBalance} $${getEnvVariable("TOKEN_TITLE")}</code>

    <b>Telegram ID:</b> ${user.userId}
    <b>Username:</b> <a href="https://t.me/${user.username}">${user.username || "N/A"}</a>
    <b>First name:</b> ${user.firstName || "N/A"}
    <b>Last name:</b> ${user.lastName || "N/A"}

    <b>Verification status:</b> ${user.verified ? "✅ Verified" : "❌ Not verified"}
    <b>Joined private group/channel:</b> ${user.joinedChannelId ? "✅ Yes" : "❌ No"}
    <b>Group/Channel ID:</b> ${`<code>${user.joinedChannelId || "N/A"}</code>`}
  `;
  
  await sendAddressMessage.editText(
    successMessage,
    {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      reply_markup: {
        inline_keyboard: [
          [{ text: "👤 Open Telegram profile", url: `https://t.me/${user.username}` }],
          [{ text: "🔵 Tonviewer", url: `https://tonviewer.com/${user.tonAddress}` }],
        ]
      }
    }
  );
}
