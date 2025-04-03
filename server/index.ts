import { getEnvVariable } from "./config/getEnvVariable";
import { Database } from "./database/db";
import BotInstance from "./src/bot";

(async () => {
  const db = new Database();
  await db.connect();
  
  const bot = new BotInstance();
  bot.run();
})();