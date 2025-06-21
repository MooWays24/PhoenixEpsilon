import { Client, GatewayIntentBits } from "discord.js";
import { registerCommands } from "../translation/registerCommands.js";
import { checkAndDeleteEmptyChannels } from "../voiceChat_listener/voiceChatCleanUp.js";
import { handleChatMessage, handleCommand } from "./message_handler.js";
import { handleWhitelistCommand } from "./whitelist_manager.js";
/**
 * Creates and sets up the Discord client with proper intents
 * @returns Configured Discord client
 */
export function createDiscordClient() {
    const { Guilds, GuildMessages, MessageContent, GuildVoiceStates } = GatewayIntentBits;
    return new Client({
        intents: [Guilds, GuildMessages, MessageContent, GuildVoiceStates],
    });
}
/**
 * Initializes Discord channels from configuration
 *
 * @param client The Discord client
 * @param config The application configuration
 * @returns Object containing channel references
 */
export async function initializeChannels(client, config) {
    const channels = {
        mainChannel: null,
        anticheatChannel: null,
        systemCommandsChannel: null,
    };
    try {
        // Set up main channel
        if (config.channel) {
            const fetchedChannel = await client.channels.fetch(config.channel);
            if (fetchedChannel?.isTextBased()) {
                channels.mainChannel = fetchedChannel;
                const channelName = "name" in fetchedChannel ? fetchedChannel.name : "Direct Message";
                console.log(`Found main channel: ${channelName} (ID: ${channels.mainChannel.id})`);
            }
        }
        // Set up anticheat channel
        if (config.antiCheatEnabled && config.antiCheatLogsChannel) {
            const fetchedChannel = await client.channels.fetch(config.antiCheatLogsChannel);
            if (fetchedChannel?.isTextBased()) {
                channels.anticheatChannel = fetchedChannel;
                console.log(`Found anticheat channel: ID ${channels.anticheatChannel.id}`);
            }
            else {
                console.log(`Could not find the anticheat channel in Discord.`);
            }
        }
        // Set up system commands channel
        if (config.logSystemCommands && config.systemCommandsChannel) {
            const fetchedChannel = await client.channels.fetch(config.systemCommandsChannel);
            if (fetchedChannel?.isTextBased()) {
                channels.systemCommandsChannel = fetchedChannel;
                console.log(`Found system commands channel: ID ${channels.systemCommandsChannel.id}`);
            }
            else {
                console.log(`Could not find the system commands channel in Discord.`);
            }
        }
        // Find the guild
        const guildObj = client.guilds.cache.get(config.guild);
        if (guildObj) {
            console.log(`Found guild: ${guildObj.name}`);
        }
        else {
            console.error(`Guild with ID ${config.guild} not found.`);
        }
    }
    catch (error) {
        console.error("Error initializing channels:", error);
    }
    return channels;
}
/**
 * Sets up Discord client event handlers
 *
 * @param client The Discord client
 * @param config The app configuration
 * @param channels Discord channels config
 * @param bot Minecraft client
 * @param whitelistData Whitelist data object
 */
export function setupDiscordEventHandlers(client, config, channels, bot, whitelistData) {
    // Handle incoming Discord messages
    client.on("messageCreate", (message) => {
        if (message.author.bot)
            return;
        const isAdmin = config.admins.includes(message.author.id);
        const isAnticheatChannel = channels.anticheatChannel && message.channel.id === channels.anticheatChannel.id;
        // Handle commands with the configured prefix
        if (message.content.startsWith(config.cmdPrefix)) {
            handleCommand(message, isAdmin, isAnticheatChannel, bot, config.cmdPrefix);
        }
        // Handle whitelist commands
        else if (message.content.startsWith("$")) {
            const newWhitelistData = handleWhitelistCommand(message, isAdmin, isAnticheatChannel);
            if (newWhitelistData) {
                whitelistData = newWhitelistData;
            }
        }
        // Handle regular chat messages to relay to Minecraft
        else if (channels.mainChannel && message.channel.id === channels.mainChannel.id) {
            handleChatMessage(message, bot, channels.anticheatChannel);
        }
    });
    // Handle voice channel cleanup
    client.on("voiceStateUpdate", (newState) => {
        checkAndDeleteEmptyChannels(newState.guild);
    });
    // Handle context menu commands
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isMessageContextMenuCommand())
            return;
        if (interaction.commandName === "Toggle TTX Translation") {
            // Import the execute function dynamically to avoid circular dependencies
            const { execute } = await import("../translation/translateContextMenu.js");
            await execute(interaction);
        }
    });
}
/**
 * Initialize the Discord client
 *
 * @param client The Discord client
 * @param token Discord bot token
 */
export async function initializeDiscordClient(client, token) {
    try {
        await client.login(token);
        console.log(`Discord bot logged in as ${client.user?.tag}`);
        // Register context menu commands
        await registerCommands().catch(console.error);
    }
    catch (error) {
        console.error("Failed to initialize Discord client:", error);
        process.exit(1);
    }
}
