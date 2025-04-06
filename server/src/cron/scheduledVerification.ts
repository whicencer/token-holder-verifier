import { CronJob } from 'cron';
import { UserRepository } from '../../database/User';
import { verifier } from '../services/verifier';
import BotInstance from '../bot';

export const scheduledVerificationJob = new CronJob(
	'*/30 * * * * *',
	async () => {
		console.log("Running scheduled verification job...");
		const bot = new BotInstance();
		try {
			const userRepository = new UserRepository();
			const users = await userRepository.getRecentCheckedUsersBatch(50);
			
			if (users.length > 0) {
				users.forEach(async (user) => {
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
		} catch (error) {
			console.error("Error in scheduled verification job:", error);
		}
	}
);