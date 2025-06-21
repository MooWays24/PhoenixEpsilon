import { loadConfig } from "../core/config/configLoader.js";
const config = loadConfig();
export function parseJsonWhisperCommand(packet) {
    const obj = JSON.parse(packet.message);
    const inputString = obj.rawtext[0].text;
    // Extract requester from §7username: format
    const requesterIndex = inputString.indexOf("§7");
    let requester = "";
    if (requesterIndex !== -1) {
        const colonIndex = inputString.indexOf(":", requesterIndex);
        if (colonIndex !== -1) {
            requester = inputString.substring(requesterIndex + 2, colonIndex).trim();
        }
    }
    // Extract command and args
    const index = inputString.indexOf("§r");
    const commandText = index !== -1 ? inputString.substring(index + 2) : "";
    const parts = commandText.trim().split(" ");
    const command = parts[0].replace(config.voiceChannelCommandPrefix, "");
    const args = parts.slice(1);
    return { command, requester, args };
}
export function parseChatCommand(packet) {
    const obj = JSON.parse(packet.message);
    const messageText = obj.rawtext[0].text;
    const parts = messageText.trim().split(" ");
    const command = parts[0].replace(config.voiceChannelCommandPrefix, "");
    const args = parts.slice(1);
    return {
        command,
        requester: packet.source_name || "",
        args,
    };
}
