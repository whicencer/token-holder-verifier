import { Menu } from "@grammyjs/menu";
import { ADMIN_MENU_ID } from "./constants";
import { BotContext } from "../../types/BotContext";

export const adminMenu = new Menu<BotContext>(ADMIN_MENU_ID)
  .text("🔍 Find wallet", async (ctx) => {
    await ctx.conversation.enter("findWalletConversation");
  });