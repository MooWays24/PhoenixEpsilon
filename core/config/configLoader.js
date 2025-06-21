import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { logger } from "../logging/logger.js";
const DEFAULT_CONFIG = {
    // Discord Configuration
    token: "",
    guild: "",
    channel: "",
    clientId: "",
    cmdPrefix: "!",
    admins: [],
    // Minecraft Configuration
    username: "",
    host: "",
    port: 19132,
    version: "1.20.0",
    isRealm: false,
    realmInviteCode: "",
    // Feature Flags
    debug: false,
    antiCheatEnabled: true,
    useSystemPlayerJoinMessage: false,
    logSystemCommands: false,
    sendWhisperMessages: false,
    useEmbed: true,
    AuthType: false,
    logBadActors: true,
    // Channel Configuration
    antiCheatChannelId: "",
    antiCheatLogsChannel: "",
    systemCommandsChannel: "",
    // Voice Channel Configuration
    voiceChannelCommandPrefix: "$",
    voiceChannelsCategory: "Voice Channels",
    voiceAdminRoleID: "",
    // UI Configuration
    setColor: [0, 153, 255],
    setTitle: "Phoenix Epsilon",
    logoURL: "https://i.imgur.com/XfoZ8XS.jpg",
    // Device Configuration
    blacklistDeviceTypes: [],
    // Logging Configuration
    logLevel: "info",
};
function parseBoolean(value, defaultValue) {
    if (value === undefined)
        return defaultValue;
    return value.toLowerCase() === "true";
}
function parseArray(value, defaultValue) {
    if (value === undefined)
        return defaultValue;
    return value.split(",").map((item) => item.trim());
}
function parseColor(value, defaultValue) {
    if (value === undefined)
        return defaultValue;
    try {
        const colorArray = value.split(",").map((n) => parseInt(n.trim()));
        if (colorArray.length === 3 && colorArray.every((n) => !isNaN(n) && n >= 0 && n <= 255)) {
            return [colorArray[0], colorArray[1], colorArray[2]];
        }
    }
    catch (error) {
        logger.log("Invalid color format. Using default."); // Changed to error() since warn() doesn't exist
    }
    return defaultValue;
}
function validateConfig(config) {
    const criticalFields = [
        { field: "token", name: "Discord Bot Token" },
        { field: "username", name: "Minecraft Username" },
        { field: "guild", name: "Discord Guild ID" },
        { field: "channel", name: "Discord Channel ID" },
        { field: "clientId", name: "Discord Application Client ID" },
    ];
    const missingFields = criticalFields.filter(({ field }) => !config[field]).map(({ name }) => name);
    if (missingFields.length > 0) {
        logger.error(`Critical configuration values are missing: ${missingFields.join(", ")}`);
        throw new Error("Missing critical configuration values");
    }
}

export function loadConfig() {
    try {
        const envPath = path.join(process.cwd(), "local.env");
        if (fs.existsSync(envPath)) {
            dotenv.config({ path: envPath });
        } else {
            dotenv.config();
        }

        const config = {
            ...DEFAULT_CONFIG,
            debug: parseBoolean(process.env.DEBUG, DEFAULT_CONFIG.debug),
            token: process.env.TOKEN || DEFAULT_CONFIG.token,
            username: process.env.USERNAME || DEFAULT_CONFIG.username,
            isRealm: parseBoolean(process.env.IS_REALM, DEFAULT_CONFIG.isRealm),
            realmInviteCode: process.env.REALM_INVITE_CODE || DEFAULT_CONFIG.realmInviteCode,
            host: process.env.IP || DEFAULT_CONFIG.host,
            port: parseInt(process.env.PORT || String(DEFAULT_CONFIG.port)),
            guild: process.env.GUILD || DEFAULT_CONFIG.guild,
            channel: process.env.CHANNEL || DEFAULT_CONFIG.channel,
            antiCheatEnabled: parseBoolean(process.env.ANTI_CHEAT_ENABLED, DEFAULT_CONFIG.antiCheatEnabled),
            antiCheatChannelId: process.env.ANTI_CHEAT_CHANNEL_ID || DEFAULT_CONFIG.antiCheatChannelId,
            antiCheatLogsChannel: process.env.ANTI_CHEAT_LOGS_CHANNEL || DEFAULT_CONFIG.antiCheatLogsChannel,
            cmdPrefix: process.env.CMD_PREFIX || DEFAULT_CONFIG.cmdPrefix,
            useSystemPlayerJoinMessage: parseBoolean(process.env.USE_SYSTEM_PLAYER_JOIN_MESSAGE, DEFAULT_CONFIG.useSystemPlayerJoinMessage),
            logSystemCommands: parseBoolean(process.env.LOG_SYSTEM_COMMANDS, DEFAULT_CONFIG.logSystemCommands),
            systemCommandsChannel: process.env.SYSTEM_COMMANDS_CHANNEL || DEFAULT_CONFIG.systemCommandsChannel,
            sendWhisperMessages: parseBoolean(process.env.SEND_WHISPER_MESSAGES, DEFAULT_CONFIG.sendWhisperMessages),
            useEmbed: parseBoolean(process.env.USE_EMBED, DEFAULT_CONFIG.useEmbed),
            setColor: parseColor(process.env.SET_COLOR, DEFAULT_CONFIG.setColor),
            setTitle: process.env.SET_TITLE || DEFAULT_CONFIG.setTitle,
            AuthType: parseBoolean(process.env.AUTH_TYPE, DEFAULT_CONFIG.AuthType),
            admins: parseArray(process.env.ADMINS, DEFAULT_CONFIG.admins),
            blacklistDeviceTypes: parseArray(process.env.BLACKLIST_DEVICE_TYPES, DEFAULT_CONFIG.blacklistDeviceTypes),
            voiceChannelCommandPrefix: process.env.VOICE_CHANNEL_COMMAND_PREFIX || DEFAULT_CONFIG.voiceChannelCommandPrefix,
            voiceChannelsCategory: process.env.VOICE_CHANNELS_CATEGORY || DEFAULT_CONFIG.voiceChannelsCategory,
            voiceAdminRoleID: process.env.VOICE_ADMIN_ROLE_ID || DEFAULT_CONFIG.voiceAdminRoleID,
            logBadActors: parseBoolean(process.env.LOG_BAD_ACTORS, DEFAULT_CONFIG.logBadActors),
            logoURL: process.env.LOGO_URL || DEFAULT_CONFIG.logoURL,
            clientId: process.env.CLIENT_ID || DEFAULT_CONFIG.clientId,
            logLevel: process.env.LOG_LEVEL || DEFAULT_CONFIG.logLevel,
        };

        validateConfig(config);
        return config;
    } catch (error) {
        logger.error(`Failed to load configuration: ${error.message}`);
        throw error;
    }
}
