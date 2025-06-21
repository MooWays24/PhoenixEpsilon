import { EmbedBuilder } from "discord.js";
import { loadConfig } from "../core/config/configLoader.js";
import { processMinecraftMessage } from "../utils/text_corrections.js";
const config = loadConfig();
const excludedPackets = ["commands.tp.successVictim", "gameMode.changed", "commands.give.successRecipient"];
/**
 * Check if the message is a system command
 */
function isSystemCommand(rawtext) {
    return rawtext?.length > 0 && rawtext[0]?.text === "§e" && !excludedPackets.includes(rawtext?.[3]?.translate || "");
}
function handleTextEvent(packet, systemCommandsChannelId) {
    let rawtext = []; // Declare rawtext array
    // Parse rawtext from packet
    if (packet.type === "json_whisper" || packet.type === "json") {
        try {
            const parsedMessage = JSON.parse(packet.message);
            rawtext = parsedMessage.rawtext || [];
        }
        catch (e) {
            console.error("Error parsing JSON message:", e);
            return;
        }
    }
    else if (packet.type === "chat") {
        rawtext = [{ text: packet.message }];
    }
    if (!isSystemCommand(rawtext)) {
        return;
    }
    if (excludedPackets.some((excludedPacket) => packet.message.includes(excludedPacket))) {
        return; // Exclude this packet
    }
    let systemMessage;
    let successMessage;
    let results = [];
    const playerName = rawtext?.[1]?.translate || "Server";
    if (packet.type === "json") {
        const rawtextArray = rawtext[3]?.with?.rawtext?.map((item) => item.text) || [];
        results = rawtextArray.filter(Boolean);
        systemMessage = results.join(" ");
        successMessage = rawtext?.[3]?.translate;
    }
    // Apply text correction to the success message if it's a translatable string
    if (successMessage) {
        successMessage = processMinecraftMessage(successMessage, results);
    }
    // Process system message for TTX encoding if present
    if (systemMessage) {
        systemMessage = processMinecraftMessage(systemMessage, []);
    }
    let dontSendMessage = false;
    switch (successMessage) {
        case "commands.time.set":
            successMessage = "Set time to";
            break;
        case "commands.gamemode.success.self":
            successMessage = "Set their gamemode ";
            systemMessage = getGamemodeText(results[0]);
            break;
        case "commands.gamemode.success.other":
            successMessage = `Has Set ${results[1]} gamemode `;
            systemMessage = getGamemodeText(results[0]);
            break;
        case "commands.weather.clear":
            systemMessage = "Clear";
            successMessage = "Set the weather to ";
            break;
        case "commands.weather.rain":
            systemMessage = "Rain";
            successMessage = "Set the weather to ";
            break;
        case "commands.weather.thunder":
            systemMessage = "Thunder";
            successMessage = "Set the weather to ";
            break;
        case "commands.difficulty.success":
            successMessage = "Set the world's difficulty to ";
            systemMessage = getDifficultyText(systemMessage);
            break;
        case "commands.setworldspawn.success":
            successMessage = "Set world spawn to: ";
            systemMessage = `X: ${results[0]} Y: ${results[1]} Z: ${results[2]}`;
            break;
        case "commands.tp.success":
            successMessage = "Has teleported: ";
            systemMessage = `${results[0]} to: ${results[1]}`;
            break;
        case "commands.give.success":
            successMessage = "Has given: ";
            systemMessage = `${results[2]} item: ${results[0]}, amount: ${results[1]}`;
            break;
        case "commands.enchant.success":
            successMessage = "Has enchanted an item for: ";
            systemMessage = results[0];
            break;
        case "commands.clear.success":
            successMessage = `Has cleared: ${results[0]} inventory removing a total of: `;
            systemMessage = `${results[1]} items`;
            break;
        case "commands.effect.success":
            successMessage = `Has given an effect to ${results[2]}`;
            systemMessage = `effect type: ${getPotionResult(results[0])} duration: ${results[3]} multiplier: ${results[1]}`;
            break;
        case "commands.message.display.outgoing":
            if (config.sendWhisperMessages === true) {
                successMessage = `Has sent a whisper to: ${results[0]}`;
                systemMessage = `Message: ${results[1]}`;
                break;
            }
        default:
            dontSendMessage = true;
    }
    if (!dontSendMessage) {
        const message = `[System Message] ${playerName}: ${successMessage} ${systemMessage}`;
        if (config.useEmbed) {
            const msgEmbed = new EmbedBuilder().setColor(config.setColor).setTitle(config.setTitle).setDescription(message).setAuthor({ name: "‎", iconURL: config.logoURL });
            if (typeof systemCommandsChannelId === "object") {
                systemCommandsChannelId.send({ embeds: [msgEmbed] });
            }
            else {
                console.log("I could not find the systemCommands channel in Discord. 1");
            }
        }
        else {
            if (typeof systemCommandsChannelId === "object") {
                systemCommandsChannelId.send(message);
            }
            else {
                console.log("I could not find the systemCommands channel in Discord. 2");
            }
        }
    }
}
function getGamemodeText(gamemode) {
    switch (gamemode) {
        case "%createWorldScreen.gameMode.creative":
            return "to Creative";
        case "%createWorldScreen.gameMode.survival":
            return "to Survival";
        case "%createWorldScreen.gameMode.adventure":
            return "to Adventure";
        case "%createWorldScreen.gameMode.spectator":
            return "to Spectator";
        default:
            return "";
    }
}
function getDifficultyText(difficulty) {
    switch (difficulty) {
        case "PEACEFUL":
            return "Peaceful";
        case "EASY":
            return "Easy";
        case "NORMAL":
            return "Normal";
        case "HARD":
            return "Hard";
        default:
            return "";
    }
}
function getPotionResult(result) {
    return result.replace(/%potion|\./g, "");
}
export function setupSystemCommandsListener(bot, systemCommandsChannelId) {
    bot.on("text", (packet) => handleTextEvent(packet, systemCommandsChannelId));
}
