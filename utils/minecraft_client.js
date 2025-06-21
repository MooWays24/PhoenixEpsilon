import { createClient } from "bedrock-protocol";
import { handleDisconnection } from "./message_handler.js";
import { decodeTTX, processMinecraftMessage } from "./text_corrections.js";
import { isTTXEncoded } from "../translation/translation.js";
import fs from "fs";
import path from "path";
/**
 * Creates and configures a Minecraft client based on the provided configuration
 *
 * @param config The application configuration
 * @param programName The name of the program to display in messages
 * @returns Configured Minecraft client
 */
export function setupMinecraftClient(config, programName) {
    // Determine client connection options based on config
    const options = config.isRealm
        ? {
            host: "realm.bedrock.server",
            port: 19132,
            username: config.username,
            offline: false,
            profilesFolder: "./authentication_tokens",
        }
        : {
            host: config.host,
            port: config.port,
            username: config.username,
            offline: config.AuthType,
            profilesFolder: "./authentication_tokens",
        };
    console.log(config.isRealm ? "Connecting to a realm" : "Connecting to a server");
    // Create the client with the configured options
    const authPath = path.resolve("./authentication_tokens");
    fs.mkdirSync(authPath, { recursive: true });
    const bot = createClient(options);
    return bot;
}
/**
 * Sets up event handlers for the Minecraft client
 *
 * @param bot The Minecraft client
 * @param channelId The main Discord channel for game messages
 * @param anticheatChannelId The channel for anti-cheat messages
 * @param programName The name of the program to display in messages
 * @param username The minecraft username
 */
export function setupClientEventHandlers(bot, channelId, anticheatChannelId, programName, username) {
    // Global variables
    const globals = {
        clientGamemode: "",
    };
    // Set up event handlers
    bot.on("spawn", () => {
        console.log(`Bedrock bot logged in as ${username}`);
        if (anticheatChannelId) {
            anticheatChannelId.send(`[${programName}]: Client is logged in.`);
        }
    });
    bot.on("start_game", (packet) => {
        globals.clientGamemode = packet.player_gamemode.toString();
    });
    bot.on("login", () => {
        console.log("Client has been authenticated by the server.");
    });
    bot.on("join", () => {
        console.log("The client is ready to receive game packets.");
    });
    bot.on("close", () => {
        console.log("The server has closed the connection.");
        if (anticheatChannelId) {
            handleDisconnection(anticheatChannelId, programName);
        }
    });
    // Handle text messages from Minecraft
    bot.on("text", (packet) => {
        // Skip if there's no channel to send to
        if (!channelId) {
            console.log("Channel not found.");
            return;
        }
        const message = packet.message;
        const sender = packet.source_name || "Unknown";
        const params = packet.parameters || [];
        // Skip messages that originated from Discord (sent by the bot using /say)
        if (message.match(/\[(?:§[0-9a-lr])*Discord(?:§[0-9a-lr])*\]/)) {
            return;
        }
        // Try to extract player name from JSON if available
        let playerName = sender;
        let messageContent = message;
        // Check if this is a JSON message with rawtext
        try {
            if (message.startsWith("{") && message.includes("rawtext")) {
                const parsed = JSON.parse(message);
                if (parsed.rawtext && Array.isArray(parsed.rawtext)) {
                    // Try to extract player name if message has format <Player> Message
                    const fullText = parsed.rawtext.map((item) => item.text || "").join("");
                    const playerMatch = fullText.match(/<([^>]+)>/);
                    if (playerMatch && playerMatch[1]) {
                        playerName = playerMatch[1].trim();
                        // Remove player name prefix from message
                        messageContent = fullText.replace(/<[^>]+>\s*/, "");
                    }
                    else {
                        messageContent = fullText;
                    }
                }
            }
        }
        catch (e) {
            // If JSON parsing fails, continue with original message
            console.log("Failed to parse JSON in minecraft_client:", e);
        }
        // Process the message with TTX decoding and text corrections
        messageContent = processMinecraftMessage(messageContent, params);
        if (isTTXEncoded(messageContent)) {
            messageContent = decodeTTX(messageContent);
        }
        // Send message to Discord
        const discordMessage = `**${playerName}**: ${messageContent}`;
        channelId.send(discordMessage).catch(console.error);
    });
}
