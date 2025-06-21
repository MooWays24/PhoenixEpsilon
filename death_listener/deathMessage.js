import { EmbedBuilder } from "discord.js";
import { loadConfig } from "../core/config/configLoader.js";
import { sendToChannel } from "../utils/discord_helpers.js";
import { processMinecraftMessage } from "../utils/text_corrections.js";
export const config = loadConfig();
/**
 * Sets up a listener for death messages in the Minecraft chat
 * @param bot The Minecraft client
 * @param channelId The Discord channel to send messages to
 */
export function setupDeathListener(bot, channelId) {
    bot.on("text", (packet) => {
        if (!packet.message.includes("death")) {
            return;
        }
        processDeathMessage(packet, channelId);
    });
}
/**
 * Process a death message packet and send formatted message to Discord
 * @param packet The text packet containing death information
 * @param channelId The Discord channel to send the message to
 */
function processDeathMessage(packet, channelId) {
    let playername = packet.parameters[0];
    // Handle special case for tamed animals
    if (playername.includes("%entity")) {
        playername = "A tamed Animal";
    }
    // Use the processMinecraftMessage function to get the death reason
    const correctedMessage = processMinecraftMessage(packet.message, packet.parameters);
    const content = `[In Game] ${playername}: ${correctedMessage}`;
    if (config.useEmbed) {
        const embed = new EmbedBuilder().setColor(config.setColor).setTitle(config.setTitle).setDescription(content).setAuthor({ name: "‎", iconURL: config.logoURL });
        sendToChannel(channelId, { embeds: [embed] }, "Could not find the in-game channel in Discord.");
    }
    else {
        sendToChannel(channelId, `${content}`, "Could not find the in-game channel in Discord.");
    }
}
