import { Menu } from "@grammyjs/menu";
import { ADMIN_MENU_ID } from "./constants";
import { BotContext } from "../../types/BotContext";
import { getTopHolders } from "./features/topHolders";

export const adminMenu = new Menu<BotContext>(ADMIN_MENU_ID)
  .text("🔍 Find wallet", async (ctx) => await ctx.conversation.enter("findWalletConversation")).row()
  .text("🏆 Top holders", getTopHolders).row()
  .text("📫 Mailing", async (ctx) => await ctx.conversation.enter("sendMailingConversation"));