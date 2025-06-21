import { loadConfig } from "./core/config/configLoader.js";
import { validateConfig } from "./utils/config_validator.js";
import { createDiscordClient, initializeDiscordClient, initializeChannels, setupDiscordEventHandlers } from "./utils/discord_client.js";
import { setupMinecraftClient, setupClientEventHandlers } from "./utils/minecraft_client.js";
import { setupDeathListener } from "./death_listener/deathMessage.js";
import { addPlayerListener } from "./player_device_listener/playerDeviceLogging.js";
import { setupSystemCommandsListener } from "./system_commands_listener/systemCommandsLogging.js";
import { setupVoiceChatListener } from "./handlers/onChat.js";
import { setupAntiCheatListener } from "./anticheat_listener/anticheat_logs.js";
import { loadWhitelist } from "./utils/whitelist_manager.js";
import { programName, programVersion } from "./utils/metadata.js";
/**
 * Main application entry point
 */
async function main() {
    console.log(`${programName} v${programVersion}`);
    // Load and validate configuration
    const loadedConfig = loadConfig();
    const config = validateConfig(loadedConfig);
    // Load whitelist data
    let whitelistData = loadWhitelist();
    // Setup Discord client
    const discordClient = createDiscordClient();
    await initializeDiscordClient(discordClient, config.token);
    // Initialize Discord channels
    const channels = await initializeChannels(discordClient, config);
    // Setup Minecraft client
    const bot = setupMinecraftClient(config, programName);
    // Setup client event handlers
    setupClientEventHandlers(bot, channels.mainChannel, channels.anticheatChannel, programName, config.username);
    // Setup Discord event handlers
    setupDiscordEventHandlers(discordClient, config, channels, bot, whitelistData);
    // Setup feature-specific listeners
    if (channels.mainChannel) {
        setupDeathListener(bot, channels.mainChannel);
        addPlayerListener(bot, channels.mainChannel, whitelistData);
    }
    if (channels.anticheatChannel && config.antiCheatEnabled) {
        setupAntiCheatListener(bot, channels.anticheatChannel);
    }
    if (channels.systemCommandsChannel && config.logSystemCommands) {
        setupSystemCommandsListener(bot, channels.systemCommandsChannel);
    }
    // Set up voice chat listener
    const guild = discordClient.guilds.cache.get(config.guild);
    if (guild) {
        setupVoiceChatListener(bot, guild);
    }
}
// Run the application
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
