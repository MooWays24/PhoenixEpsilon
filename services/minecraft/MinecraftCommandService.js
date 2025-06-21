import { logger } from "../../core/logging/logger.js";
export class MinecraftCommandService {
    sendCommand(bot, command) {
        try {
            const commandRequest = {
                command,
                origin: {
                    type: "player",
                    uuid: "",
                    request_id: "",
                },
                internal: false,
                version: 52,
            };
            bot.queue("command_request", commandRequest);
            logger.log(`Sent command to Minecraft: ${command}`);
        }
        catch (error) {
            logger.error(`Failed to send command to Minecraft: ${error.message}`);
            throw new Error(`Failed to send command: ${error.message}`);
        }
    }
    sendMessage(bot, target, message) {
        try {
            // Escape any quotes in the message to prevent command injection
            const escapedMessage = message.replace(/"/g, '\\"');
            const command = `/tellraw ${target} {"rawtext":[{"text":"${escapedMessage}"}]}`;
            this.sendCommand(bot, command);
        }
        catch (error) {
            logger.error(`Failed to send message to ${target}: ${error.message}`);
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }
}
