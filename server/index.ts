import { Database } from "./database/db";
import BotInstance from "./src/bot";
import { scheduledVerificationJob } from "./src/cron/scheduledVerification";

(async () => {
  const db = new Database();
  await db.connect();

  scheduledVerificationJob.start();
  
  const bot = new BotInstance();
  await bot.run();
})();