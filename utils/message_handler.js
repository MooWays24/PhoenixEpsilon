import { EmbedBuilder } from "discord.js";
import { idList } from "../services/anticheat/AntiCheatService.js";
import { loadConfig } from "../core/config/configLoader.js";
import { parseColor } from "./color_utils.js";
import { sendToChannel } from "./discord_helpers.js";
const config = loadConfig();
/**
 * Handles commands sent from Discord to Minecraft
 * @param message Discord message containing the command
 * @param isAdmin Whether the user is an admin
 * @param isAnticheatChannel Whether the message is in the anticheat channel
 * @param bot The Minecraft client to send commands to
 * @param cmdPrefix The command prefix to use
 */
export function handleCommand(message, isAdmin, isAnticheatChannel, bot, cmdPrefix) {
    if (!isAdmin || !isAnticheatChannel)
        return;
    const command = message.content.startsWith(cmdPrefix + "/") ? message.content.slice(2) : message.content.slice(cmdPrefix.length);
    const type = message.content.startsWith(cmdPrefix + "/") ? "command_request" : "text";
    bot.queue(type, {
        type: "chat",
        needs_translation: false,
        source_name: config.username,
        xuid: "",
        platform_chat_id: "",
        message: command,
        filtered_message: "",
    });
    console.log(`Command received: ${command} From: ${message.author.id}`);
}
/**
 * Handles chat messages sent from Discord to Minecraft
 * @param message Discord message to send to Minecraft
 * @param bot The Minecraft client to send messages to
 * @param anticheatChannelId The anticheat channel to log to (if needed)
 */
export function handleChatMessage(message, bot, anticheatChannelId) {
    const isBadActor = idList.includes(message.author.id);
    const cmd = isBadActor ? `/say §8[§9Discord§8] §4${message.author.username} (Known Hacker/Troll) : §f${message.content}` : `/say §8[§9Discord§8] §7${message.author.username}: §f${message.content}`;
    console.log(`Sending command to Minecraft server: ${cmd}`);
    bot.queue("command_request", {
        command: cmd,
        origin: {
            type: "player",
            uuid: "",
            request_id: "",
        },
        internal: false,
        version: 52,
    });
    if (isBadActor && config.logBadActors && anticheatChannelId) {
        const msgEmbed = new EmbedBuilder()
            .setColor(parseColor(config.setColor))
            .setTitle(config.setTitle)
            .setDescription(`Message sent to the bot from Discord from Author: ${message.author.username} ` + `Content: ${message.content} Unique ID: ${message.author.id}`)
            .setAuthor({ name: "‎", iconURL: config.logoURL })
            .setThumbnail("https://static.wikia.nocookie.net/minecraft_gamepedia/images/7/76/Impulse_Command_Block.gif/revision/latest?cb=20191017044126");
        sendToChannel(anticheatChannelId, { embeds: [msgEmbed] }, "Could not find anticheat channel");
    }
}
/**
 * Send a message from the bot to a Discord channel
 * @param channel The channel to send to
 * @param message The message content
 */
export function sendMessageToChannel(channel, message) {
    if (!channel) {
        console.log("Channel is undefined or null");
        return;
    }
    try {
        if (config.useEmbed) {
            const msgEmbed = new EmbedBuilder().setColor(parseColor(config.setColor)).setTitle(config.setTitle).setDescription(message).setAuthor({ name: "‎", iconURL: config.logoURL });
            sendToChannel(channel, { embeds: [msgEmbed] }, "Could not send embed message");
        }
        else {
            sendToChannel(channel, message, "Could not send text message");
        }
    }
    catch (error) {
        console.error("Error in sendMessageToChannel:", error);
    }
}
/**
 * Handles a disconnection from the Minecraft server
 * @param anticheatChannelId The channel to notify about the disconnection
 * @param programName The name of the program to display in messages
 */
export function handleDisconnection(anticheatChannelId, programName) {
    let remainingTime = 2 * 60;
    sendMessageToChannel(anticheatChannelId, `[${programName}]: The client has lost connection to the server and will initiate a reboot in: ${remainingTime} Seconds`);
    const interval = setInterval(() => {
        remainingTime--;
        if (remainingTime <= 0) {
            clearInterval(interval);
            process.exit();
        }
    }, 1000);
}
