import { DatabaseConnection } from "./database/db";
import BotInstance from "./src/bot";

(async () => {
  const db = DatabaseConnection.getInstance();
  await db.connect();
  
  const bot = new BotInstance();
  bot.run();
})();