import { VoiceChannel } from "discord.js";
import { loadConfig } from "../core/config/configLoader.js";
import { logger } from "../core/logging/logger.js";
import { DiscordMemberService } from "../services/discord/DiscordMemberService.js";
import { VoiceChannelService } from "../services/discord/VoiceChannelService.js";
import { MinecraftCommandService } from "../services/minecraft/MinecraftCommandService.js";
import { parseChatCommand, parseJsonWhisperCommand } from "../utils/commandParser.js";
export const config = loadConfig();
// Service instances
const voiceChannelService = new VoiceChannelService();
const discordMemberService = new DiscordMemberService();
const minecraftCommandService = new MinecraftCommandService();
export function setupVoiceChatListener(bot, targetGuild) {
    bot.on("text", (packet) => handleTextPacket(packet, bot, targetGuild));
}
async function handleTextPacket(packet, bot, guild) {
    const messageHandler = getMessageHandler(packet.type);
    if (!messageHandler)
        return;
    try {
        await messageHandler(packet, bot, guild);
    }
    catch (error) {
        logger.error(`Error handling ${packet.type} message: ${error.message}`);
    }
}
function getMessageHandler(type) {
    const handlers = {
        json_whisper: handleJsonWhisperMessage,
        chat: handleChatMessage,
    };
    return handlers[type];
}
async function handleJsonWhisperMessage(packet, bot, guild) {
    const { command, requester, args } = parseJsonWhisperCommand(packet);
    switch (command) {
        case "createVoiceChannel":
            await handleCreateVoiceChannel(requester, args, bot, guild);
            break;
        case "invite":
            await handleInviteToChannel(requester, args, bot, guild);
            break;
    }
}
async function handleChatMessage(packet, bot, guild) {
    const { command, args } = parseChatCommand(packet);
    const requester = packet.source_name;
    switch (command) {
        case "createVoiceChannel":
            await handleCreateVoiceChannel(requester, args, bot, guild);
            break;
        case "invite":
            await handleInviteToChannel(requester, args, bot, guild);
            break;
    }
}
async function handleCreateVoiceChannel(requester, args, bot, guild) {
    const [channelName, ...memberNames] = args;
    try {
        // Fetch and validate members
        const members = await discordMemberService.fetchMembers(guild, memberNames);
        const usersInPrivateChannels = discordMemberService.validateMembersNotInPrivateChannel(members);
        if (usersInPrivateChannels.length > 0) {
            minecraftCommandService.sendMessage(bot, requester, `§8[§9VC Error§8] §6The following users are already in a private voice channel ${usersInPrivateChannels}. Your request has been canceled`);
            return;
        }
        // Create the channel with proper typing
        const channel = await voiceChannelService.createPrivateChannel(guild, `v${channelName}`, members.map((member) => member.id));
        // Move members to the new channel
        for (const member of members) {
            await member.voice.setChannel(channel.id);
            await member.voice.setMute(false);
            await member.voice.setDeaf(false);
        }
        logger.info(`Created voice channel: ${channel.name}`);
        minecraftCommandService.sendMessage(bot, requester, `§8[§9VC§8] §2Voice channel created successfully!`);
    }
    catch (error) {
        logger.error(`Error creating voice channel: ${error.message}`);
        minecraftCommandService.sendMessage(bot, requester, `§8[§9VC Error§8] §6Failed to create voice channel: ${error.message}`);
    }
}
async function handleInviteToChannel(requester, args, bot, guild) {
    const [channelName, invitedUser] = args;
    try {
        // Validate requester is in the channel
        const requesterMember = await discordMemberService.fetchMember(guild, requester);
        const currentChannel = requesterMember.voice.channel;
        if (!currentChannel || !(currentChannel instanceof VoiceChannel) || currentChannel.name !== `v${channelName}`) {
            minecraftCommandService.sendMessage(bot, requester, `§8[§9VC Error§8] §6You must be in channel ${channelName} to invite others`);
            return;
        }
        // Fetch and move invited user
        const invitedMember = await discordMemberService.fetchMember(guild, invitedUser);
        await voiceChannelService.updateChannelPermissions(currentChannel, invitedMember.id, {
            ViewChannel: true,
            Connect: true,
            UseVAD: true,
            Speak: true,
        });
        await invitedMember.voice.setChannel(currentChannel.id);
        await invitedMember.voice.setMute(false);
        await invitedMember.voice.setDeaf(false);
        minecraftCommandService.sendMessage(bot, requester, `§8[§9VC§8] §2Successfully invited ${invitedUser} to the channel`);
        minecraftCommandService.sendMessage(bot, invitedUser, `§8[§9VC§8] §2You have been invited to channel ${channelName}`);
    }
    catch (error) {
        logger.error(`Error inviting to channel: ${error.message}`);
        minecraftCommandService.sendMessage(bot, requester, `§8[§9VC Error§8] §6Failed to invite user: ${error.message}`);
    }
}
