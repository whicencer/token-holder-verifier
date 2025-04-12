import { CommandMiddleware } from "grammy";

import { checkAdmin } from "../middleware/checkAdmin";
import { adminCommandHandler } from "./admin/handler";
import { startCommandHandler } from "./start";
import { BotContext } from "../types/BotContext";

export const commandsList: Record<string, CommandMiddleware<BotContext>[]> = {
  start: [startCommandHandler],
  admin: [checkAdmin, adminCommandHandler]
};