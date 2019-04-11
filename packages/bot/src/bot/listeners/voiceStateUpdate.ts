import { Guild as G, Lobby, User as U } from '@r6ru/db';
import { Listener } from 'discord-akairo';
import { CategoryChannel, Channel, Guild, GuildMember, Snowflake, VoiceState } from 'discord.js';

interface IOpts {
    guild?: Guild;
    channel?: Channel;
    member?: GuildMember;
    dbGuild?: G;
    dbUser?: U;
    category?: string;
    ignoreChannel?: Snowflake;
}

export default class VoiceStateUpdate extends Listener {
    public constructor() {
        super('voiceStateUpdate', {
            emitter: 'client',
            event: 'voiceStateUpdate',
        });
    }
    public async exec(oldState: VoiceState, newState: VoiceState) {
        if (oldState.guild.id !== '216649610511384576') { return; }

        // if (oldState.channelID !== newState.channelID) {
        //     const guild = oldState.guild || newState.guild;
        //     const channel = oldState.channel || newState.channel;
        //     const member = oldState.member || newState.member;
        //     const category = channel.parent;
        //     const dbGuild = await G.findByPk(guild.id);
        //     const voices = category.children.filter((ch) => ch.type === 'voice');
        //     console.log(channel.members.size, !newState);
        //     if (channel.members.size === 1 || (channel.members.size === 0 && !(newState.channel))) {
        //         console.log('sync');
        //         if (newState.channel) {
        //             try {
        //                 await channel.clone({ name: `voice #${voices.size + 1}`});
        //             } catch (err) {
        //                 console.log('clone err', err);
        //             }
        //             // await this.syncNames(Object.entries(dbGuild.voiceCategories).find((e) => e[1] === category.id)[0], dbGuild);
        //         } else {
        //             // await this.syncNames(Object.entries(dbGuild.voiceCategories).find((e) => e[1] === category.id)[0], dbGuild, await channel.delete());
        //         }
        //     }
        // }
    }

    private async initRoom(cfg: IOpts) {
        const LInst = await Lobby.create<Lobby>({
            active: true,
            channel: cfg.channel.id,
            guildId: cfg.guild.id,
            open: true,
        });
        return LInst.$set('leader', cfg.dbUser);
    }

    private async deleteRoom(cfg: IOpts) {
        const LInst = await Lobby.findOne({where: {
            channel: cfg.channel.id,
        }});
        LInst.active = false;
        return LInst.save();
    }

    // private async validate() {

    // }

    private async syncNames(cfg: IOpts) {
        // this.client.channels.fetch();
        const category = await this.client.channels.fetch(cfg.dbGuild.voiceCategories[cfg.category]) as CategoryChannel;
        await category.fetch();
        const voices = category.children.filter((ch) => ch.type === 'voice' && ch.id !== cfg.ignoreChannel);
        const channels = voices.array().filter((ch) => !ch.deleted).sort((a, b) => a.position - b.position).slice(cfg.dbGuild.roomsRange[0]);
        console.log('TCL: VoiceStateUpdate -> privatesyncNames -> channels', channels.map((ch) => ch.name));
        channels.map((ch, i) => ch.setName(`voice #${i + cfg.dbGuild.roomsRange[0] + 1}`));
    }
}
