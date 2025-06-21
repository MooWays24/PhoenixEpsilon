import { createClient } from "bedrock-protocol";
import { Client as DiscordClient } from "discord.js";
import { ServiceManager } from "./core/services/ServiceManager";
import { loadConfig } from "./core/config/configLoader";
import { logger } from "./core/logging/logger";
async function main() {
    try {
        // Load configuration
        const config = loadConfig();
        // Initialize Minecraft client
        const bot = createClient({
            host: config.host,
            port: config.port,
            username: config.username,
            version: config.version,
            offline: false,
            profilesFolder: "authentication_tokens",
        });
        // Initialize Discord client
        const discordClient = new DiscordClient({
            intents: ["GuildMessages", "MessageContent"],
        });
        await discordClient.login(config.token);
        // Get Discord channel
        const channel = (await discordClient.channels.fetch(config.channel));
        if (!channel) {
            throw new Error(`Could not find channel with ID: ${config.channel}`);
        }
        // Initialize services
        const serviceManager = new ServiceManager();
        serviceManager.initializeServices(bot, channel);
        // Handle bot events
        bot.on("error", (error) => {
            logger.error(`Bot error: ${error.message}`);
        });
        bot.on("disconnect", () => {
            logger.info("Disconnected from Minecraft server");
        });
    }
    catch (error) {
        logger.error(`Failed to start bot: ${error.message}`);
        process.exit(1);
    }
}
main();
