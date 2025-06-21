import { ContextMenuCommandBuilder, ApplicationCommandType } from "discord.js";
import { translateFromTTX, translateToTTX, isTTXEncoded } from "./translation.js";
export const data = new ContextMenuCommandBuilder().setName("Toggle TTX Translation").setType(ApplicationCommandType.Message);
export async function execute(interaction) {
    const targetMessage = interaction.targetMessage;
    const content = targetMessage.content;
    if (!content) {
        await interaction.reply({ content: "This message has no text to translate." });
        return;
    }
    // Detect if message is already TTX-encoded
    const encoded = isTTXEncoded(content);
    // Translate accordingly
    const translated = encoded ? translateFromTTX(content) : translateToTTX(content);
    await interaction.reply({
        content: `**${encoded ? "Decoded from" : "Encoded to"} TTX:**\n${translated}`,
    });
}
