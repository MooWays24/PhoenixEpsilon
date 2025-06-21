import { ChannelType, PermissionsBitField } from "discord.js";
import { loadConfig } from "../core/config/configLoader.js";
const config = loadConfig();
export class VoiceChannelService {
    async createPrivateChannel(guild, channelName, memberIDs) {
        const category = this.findVoiceCategory(guild);
        return await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildVoice,
            parent: category.id,
            permissionOverwrites: this.buildPermissionOverwrites(guild, memberIDs),
        });
    }
    findVoiceCategory(guild) {
        return guild.channels.cache.find((ch) => ch.type === ChannelType.GuildCategory && ch.name === config.voiceChannelsCategory);
    }
    buildPermissionOverwrites(guild, memberIDs) {
        return [
            {
                id: config.voiceAdminRoleID,
                allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel],
            },
            ...memberIDs.map((id) => ({
                id,
                allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.UseVAD, PermissionsBitField.Flags.Speak],
            })),
            {
                id: guild.roles.everyone,
                deny: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel],
            },
        ];
    }
}
