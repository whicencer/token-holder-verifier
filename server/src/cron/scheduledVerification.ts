import { CronJob } from 'cron';
import { UserRepository } from '../../database/User';
import { verifier } from '../services/verifier';
import BotInstance from '../bot';
import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 100,
  reservoir: 10,
  reservoirRefreshAmount: 10,
  reservoirRefreshInterval: 1000
});

export const scheduledVerificationJob = new CronJob(
	'0 */30 * * * *',
	async () => {
		try {
			const bot = new BotInstance();
			const userRepository = new UserRepository();
			const users = await userRepository.getRecentCheckedUsersBatch(100); // Will handle 100 users at ~`80 seconds
			
			if (users.length > 0) {
				const start = Date.now();
				console.log(`Starting test batch of ${users.length} users...`);
				for (const user of users) {
					await limiter.schedule(async () => {
						if (user.tonAddress) {
							const { message, verified } = await verifier.verifyWallet(user.userId, user.tonAddress);
							if (!verified && user.joinedChannelId) {
								await bot.kickChatMember(user.joinedChannelId, user.userId);
								await bot.sendMessage(user.userId, `${message} \n\n You were kicked from the group.`, { parse_mode: "Markdown" });
								await userRepository.setAttribute(user.userId, "verified", false);
							}
						}
					});
				}
				const end = Date.now();
				console.log(`✅ Finished in ${(end - start) / 1000}s`);
			}
		} catch (error) {
			console.error("Error in scheduled verification job:", error);
		}
	}
);