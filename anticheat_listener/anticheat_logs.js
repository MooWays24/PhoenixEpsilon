import { EmbedBuilder } from "discord.js";
import { loadConfig } from "../core/config/configLoader.js";
import { processMinecraftMessage } from "../utils/text_corrections.js";
export var AntiCheatSource;
(function (AntiCheatSource) {
    AntiCheatSource["Paradox"] = "Paradox";
    AntiCheatSource["Scythe"] = "Scythe";
})(AntiCheatSource || (AntiCheatSource = {}));
// Thumbnail mapping with regex patterns
const THUMBNAIL_MAPPING = [
    { pattern: /has banned/, url: "https://i.imgur.com/F18zcLY.png" },
    { pattern: /has been unbanned\./, url: "https://i.imgur.com/0MNCVoM.png" },
    { pattern: /Nuker\/A|Scaffold\/A|KillAura\/A/, url: "https://i.imgur.com/oClQXNb.png" },
];
const config = loadConfig();
export function setupAntiCheatListener(bot, channelId) {
    bot.on("text", (packet) => {
        const antiCheatMessage = parseAntiCheatMessage(packet);
        if (antiCheatMessage) {
            sendMessage(antiCheatMessage, channelId);
        }
    });
}
function parseAntiCheatMessage(packet) {
    try {
        const message = packet.message;
        const obj = JSON.parse(message);
        const rawText = obj.rawtext?.[0]?.text || "";
        // Early return if not a recognized pattern
        if (!isAntiCheatMessage(rawText)) {
            return null;
        }
        const source = detectAntiCheatSource(rawText);
        // Extract any parameters from the message
        const params = extractParameters(rawText);
        const correctedText = processMinecraftMessage(rawText, params);
        if (!correctedText) {
            return null;
        }
        return {
            rawMessage: rawText,
            correctedText,
            source,
        };
    }
    catch (error) {
        console.error("Error parsing anti-cheat message:", error);
        return null;
    }
}
/**
 * Extract parameters from a message using regex
 * @param text The text to extract parameters from
 * @returns Array of parameters
 */
function extractParameters(text) {
    const params = [];
    // Look for player names or other parameters in the message
    // This is a simplified approach and may need adjustment based on actual message formats
    const playerNameRegex = /(?:banned|kicked|reported by|using|detected on)\s+([A-Za-z0-9_]+)/g;
    let match;
    while ((match = playerNameRegex.exec(text)) !== null) {
        if (match[1]) {
            params.push(match[1]);
        }
    }
    return params;
}
function isAntiCheatMessage(text) {
    let antiCheatRegex = /(§[flor0-9])+\[§\d(Scythe|Available Commands|Paradox( AntiCheat Command Help)?)§\d\](§[olrf0-9])*/;
    return antiCheatRegex.test(text);
}
function detectAntiCheatSource(text) {
    if (!isAntiCheatMessage(text)) {
        return null;
    }
    return text.includes("Scythe") ? AntiCheatSource.Scythe : AntiCheatSource.Paradox;
}
function sendMessage(message, channelId) {
    if (config.useEmbed) {
        sendEmbedMessage(message, channelId);
    }
    else {
        const plainMessage = `[In Game] ${message.source}: ${message.rawMessage}`;
        sendToChannel(channelId, plainMessage, "Could not find Discord channel");
    }
}
function sendEmbedMessage(message, channelId) {
    const { correctedText } = message;
    if (correctedText.length >= 2000) {
        sendLongMessage(correctedText, channelId);
        return;
    }
    const embed = createEmbed(correctedText);
    sendToChannel(channelId, { embeds: [embed] }, "Could not find Discord channel");
}
function createEmbed(content, useThumb = true) {
    const embed = new EmbedBuilder()
        .setColor(config.setColor)
        .setTitle(config.setTitle)
        .setDescription("[In Game] " + content)
        .setAuthor({ name: "‎", iconURL: config.logoURL });
    if (useThumb) {
        const thumbUrl = getThumbUrlForMessage(content);
        if (thumbUrl) {
            embed.setThumbnail(thumbUrl);
        }
    }
    return embed;
}
function getThumbUrlForMessage(content) {
    for (const { pattern, url } of THUMBNAIL_MAPPING) {
        if (pattern.test(content)) {
            return url;
        }
    }
    return null;
}
function sendLongMessage(content, channelId) {
    // Define section markers with regex for more flexible matching
    const sections = [
        { name: "Moderation Commands", pattern: /\[Moderation Commands\]/i },
        { name: "Optional Features", pattern: /\[Optional Features\]/i },
        { name: "Tools and Utilities", pattern: /\[Tools and Utilit(?:ies|es)\]/i }, // Handle common misspellings
    ];
    // Find section indices
    const sectionIndices = sections
        .map((section) => ({
        name: section.name,
        index: content.search(section.pattern),
    }))
        .filter((section) => section.index !== -1)
        .sort((a, b) => a.index - b.index); // Ensure sections are in order
    // If no sections found, send the whole content
    if (sectionIndices.length === 0) {
        const embed = createEmbed(content, false);
        sendToChannel(channelId, { embeds: [embed] }, "Could not find Discord channel");
        return;
    }
    // Extract sections
    const sectionContents = [];
    sectionIndices.forEach((section, i) => {
        const startIndex = section.index;
        const endIndex = i < sectionIndices.length - 1 ? sectionIndices[i + 1].index : content.length;
        if (startIndex !== -1 && endIndex !== -1) {
            const sectionContent = content.substring(startIndex, endIndex).trim();
            if (sectionContent) {
                sectionContents.push(sectionContent);
            }
        }
    });
    // Send each section
    sectionContents.forEach((sectionContent) => {
        if (!sectionContent)
            return;
        const embed = createEmbed(sectionContent, false);
        sendToChannel(channelId, { embeds: [embed] }, "Could not find Discord channel");
    });
}
function sendToChannel(channelId, content, errorMessage) {
    if (typeof channelId === "object") {
        channelId.send(content).catch((error) => {
            console.error(`Error sending message: ${error.message}`);
        });
    }
    else {
        console.log(errorMessage);
    }
}
