import { VoiceChannel } from "discord.js";
import { AntiCheatService } from "../../services/anticheat/AntiCheatService.js";
import { DiscordMemberService } from "../../services/discord/DiscordMemberService.js";
import { VoiceChannelService } from "../../services/discord/VoiceChannelService.js";
import { DeathMessageService } from "../../services/minecraft/DeathMessageService.js";
import { MinecraftCommandService } from "../../services/minecraft/MinecraftCommandService.js";
import { PacketListenerService } from "../../services/minecraft/PacketListenerService.js";
import { logger } from "../logging/logger.js";
export class ServiceManager {
    antiCheatService;
    deathMessageService;
    packetListenerService;
    voiceChannelService;
    discordMemberService;
    minecraftCommandService;
    constructor() {
        this.antiCheatService = new AntiCheatService();
        this.deathMessageService = new DeathMessageService();
        this.packetListenerService = new PacketListenerService();
        this.voiceChannelService = new VoiceChannelService();
        this.discordMemberService = new DiscordMemberService();
        this.minecraftCommandService = new MinecraftCommandService();
    }
    initializeServices(bot, channel, guild) {
        try {
            // Initialize packet listener service first
            this.packetListenerService.setupListeners(bot, channel, guild);
            logger.info("Packet listener service initialized");
            // Register feature-specific handlers
            this.registerAntiCheatHandler(bot, channel);
            this.registerDeathMessageHandler(bot, channel);
            if (guild) {
                this.registerVoiceChatHandlers(bot, guild);
            }
            logger.info("All services initialized successfully");
        }
        catch (error) {
            logger.error(`Failed to initialize services: ${error.message}`);
            throw error;
        }
    }
    registerAntiCheatHandler(bot, channel) {
        this.packetListenerService.registerTextHandler("anticheat", /\[§\d(Scythe|Paradox)§\d\]/, (packet) => this.antiCheatService.processAntiCheatMessage(packet, channel));
        logger.info("Anti-cheat handler registered");
    }
    registerDeathMessageHandler(bot, channel) {
        this.packetListenerService.registerTextHandler("death", "death", (packet) => this.deathMessageService.processDeathMessage(packet, channel));
        logger.info("Death message handler registered");
    }
    registerVoiceChatHandlers(bot, guild) {
        if (!guild) {
            logger.error("Cannot register voice chat handlers: Guild not provided");
            return;
        }
        // Register JSON whisper command handlers
        this.packetListenerService.registerJsonWhisperHandler("createVoiceChannel-whisper", "createVoiceChannel", (packet) => this.handleCreateVoiceChannel(packet, bot, guild));
        this.packetListenerService.registerJsonWhisperHandler("invite-whisper", "invite", (packet) => this.handleInviteToChannel(packet, bot, guild));
        // Register chat command handlers
        this.packetListenerService.registerChatHandler("createVoiceChannel-chat", "createVoiceChannel", (packet) => this.handleCreateVoiceChannel(packet, bot, guild));
        this.packetListenerService.registerChatHandler("invite-chat", "invite", (packet) => this.handleInviteToChannel(packet, bot, guild));
        logger.info("Voice chat handlers registered");
    }
    async handleCreateVoiceChannel(packet, bot, guild) {
        const { command, requester, args } = this.parseCommand(packet);
        if (command !== "createVoiceChannel")
            return;
        const [channelName, ...memberNames] = args;
        try {
            // Fetch and validate members
            const members = await this.discordMemberService.fetchMembers(guild, memberNames);
            const usersInPrivateChannels = this.discordMemberService.validateMembersNotInPrivateChannel(members);
            if (usersInPrivateChannels.length > 0) {
                this.minecraftCommandService.sendMessage(bot, requester, `§8[§9VC Error§8] §6The following users are already in a private voice channel ${usersInPrivateChannels}. Your request has been canceled`);
                return;
            }
            // Create the channel with proper typing
            const channel = await this.voiceChannelService.createPrivateChannel(guild, `v${channelName}`, members.map((member) => member.id));
            // Move members to the new channel
            for (const member of members) {
                await member.voice.setChannel(channel.id);
                await member.voice.setMute(false);
                await member.voice.setDeaf(false);
            }
            logger.info(`Created voice channel: ${channel.name}`);
            this.minecraftCommandService.sendMessage(bot, requester, `§8[§9VC§8] §2Voice channel created successfully!`);
        }
        catch (error) {
            logger.error(`Error creating voice channel: ${error.message}`);
            this.minecraftCommandService.sendMessage(bot, requester, `§8[§9VC Error§8] §6Failed to create voice channel: ${error.message}`);
        }
    }
    async handleInviteToChannel(packet, bot, guild) {
        const { command, requester, args } = this.parseCommand(packet);
        if (command !== "invite")
            return;
        const [channelName, invitedUser] = args;
        try {
            // Validate requester is in the channel
            const requesterMember = await this.discordMemberService.fetchMember(guild, requester);
            const currentChannel = requesterMember.voice.channel;
            if (!currentChannel || !(currentChannel instanceof VoiceChannel)) {
                this.minecraftCommandService.sendMessage(bot, requester, `§8[§9VC Error§8] §6You must be in a voice channel to invite others`);
                return;
            }
            if (currentChannel.name !== `v${channelName}`) {
                this.minecraftCommandService.sendMessage(bot, requester, `§8[§9VC Error§8] §6You must be in channel ${channelName} to invite others`);
                return;
            }
            // Fetch and move invited user
            const invitedMember = await this.discordMemberService.fetchMember(guild, invitedUser);
            await this.voiceChannelService.updateChannelPermissions(currentChannel, invitedMember.id, {
                ViewChannel: true,
                Connect: true,
                UseVAD: true,
                Speak: true,
            });
            await invitedMember.voice.setChannel(currentChannel.id);
            await invitedMember.voice.setMute(false);
            await invitedMember.voice.setDeaf(false);
            this.minecraftCommandService.sendMessage(bot, requester, `§8[§9VC§8] §2Successfully invited ${invitedUser} to the channel`);
            this.minecraftCommandService.sendMessage(bot, invitedUser, `§8[§9VC§8] §2You have been invited to channel ${channelName}`);
        }
        catch (error) {
            logger.error(`Error inviting to channel: ${error.message}`);
            this.minecraftCommandService.sendMessage(bot, requester, `§8[§9VC Error§8] §6Failed to invite user: ${error.message}`);
        }
    }
    parseCommand(packet) {
        // For json_whisper packets
        if (packet.type === "json_whisper") {
            try {
                const jsonContent = JSON.parse(packet.message);
                const command = jsonContent.command;
                const requester = jsonContent.requester || "";
                const args = jsonContent.args || [];
                return { command, requester, args };
            }
            catch (error) {
                logger.error(`Error parsing JSON whisper command: ${error.message}`);
                return { command: "", requester: "", args: [] };
            }
        }
        // For chat packets
        if (packet.type === "chat") {
            const parts = packet.message.split(" ");
            const command = parts[0];
            const requester = packet.source_name || "";
            const args = parts.slice(1);
            return { command, requester, args };
        }
        return { command: "", requester: "", args: [] };
    }
}
