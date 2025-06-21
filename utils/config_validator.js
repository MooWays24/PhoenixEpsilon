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
/**
 * Validates the loaded configuration against the default configuration structure
 * @param config The loaded configuration
 * @returns Validated configuration with any missing properties filled from default
 */
export function validateConfig(config) {
    const validatedConfig = { ...DEFAULT_CONFIG };
    let missingKeys = [];
    let warningShown = false;
    // Check all keys in default config exist in loaded config
    Object.keys(DEFAULT_CONFIG).forEach((key) => {
        const typedKey = key;
        if (config[typedKey] === undefined) {
            missingKeys.push(key);
            warningShown = true;
        }
        else {
            validatedConfig[typedKey] = config[typedKey];
        }
    });
    // Log warnings for missing configuration
    if (missingKeys.length > 0) {
        console.warn(`⚠️ The following configuration keys are missing and will use default values: ${missingKeys.join(", ")}`);
    }
    // Check for critical configuration values
    const criticalConfigs = [
        { key: "token", value: validatedConfig.token, name: "Discord Bot Token" },
        { key: "username", value: validatedConfig.username, name: "Minecraft Username" },
        { key: "host", value: validatedConfig.host, name: "Server IP" },
        { key: "guild", value: validatedConfig.guild, name: "Discord Guild ID" },
        { key: "channel", value: validatedConfig.channel, name: "Discord Channel ID" },
    ];
    const emptyConfigs = criticalConfigs.filter(({ value }) => !value).map(({ name }) => name);
    if (emptyConfigs.length > 0) {
        console.error(`❌ ERROR: The following critical configuration values are empty: ${emptyConfigs.join(", ")}`);
        console.error("Please update your local.env file with these values.");
        process.exit(1);
    }
    // Check for potentially problematic configurations
    if (!validatedConfig.antiCheatEnabled && validatedConfig.logSystemCommands) {
        console.warn("⚠️ System command logging is enabled but anti-cheat is disabled.");
    }
    // Check for extra keys that don't exist in default config
    const extraKeys = Object.keys(config).filter((key) => !Object.prototype.hasOwnProperty.call(DEFAULT_CONFIG, key));
    if (extraKeys.length > 0) {
        console.warn(`⚠️ Found unknown configuration keys: ${extraKeys.join(", ")}. These will be ignored.`);
    }
    // Log successful validation if no warnings
    if (!warningShown && extraKeys.length === 0) {
        console.log("✅ Configuration validated successfully");
    }
    return validatedConfig;
}
