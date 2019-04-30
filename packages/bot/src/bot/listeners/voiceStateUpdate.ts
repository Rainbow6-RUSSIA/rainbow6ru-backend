import { Guild as G, Lobby, User as U } from '@r6ru/db';
import { Listener } from 'discord-akairo';
import { CategoryChannel, Guild, GuildMember, Snowflake, VoiceChannel, VoiceState } from 'discord.js';
import { EventEmitter } from 'events';
import { lobbyStores } from '../../utils/lobby';

export default class VoiceStateUpdate extends Listener {
    public constructor() {
        super('voiceStateUpdate', {
            emitter: 'client',
            event: 'voiceStateUpdate',
        });
    }
    public async exec(oldState: VoiceState, newState: VoiceState) {
        if (!(oldState.guild.id === '216649610511384576' || newState.guild.id === '216649610511384576')) { return; }
        // console.log('OLD', oldState);
        // console.log('NEW', newState);
        // if (oldState.guild.id) { return; }

        switch (true) {
            case !oldState.channelID && Boolean(newState.channelID): {
                if (!lobbyStores.has(newState.channel.parentID)) { return; }
                // if (newState.channel.members.size)
                console.log('join', newState.channel.members.size);
                lobbyStores.get(newState.channel.parentID).join(newState.member, newState.channel);
                break;
            }
            case oldState.channelID && !newState.channelID: {
                if (!lobbyStores.has(oldState.channel.parentID)) { return; }
                console.log('leave', oldState.channel.members.size);
                lobbyStores.get(oldState.channel.parentID).leave(oldState.member, oldState.channel);
                break;
            }
            case oldState.channelID && newState.channelID && oldState.channelID !== newState.channelID && (lobbyStores.has(oldState.channel.parentID) || lobbyStores.has(newState.channel.parentID)): {
                switch (true) {
                    case !lobbyStores.has(oldState.channel.parentID): {
                        console.log('join', newState.channel.members.size);
                        lobbyStores.get(newState.channel.parentID).join(newState.member, newState.channel);
                        break;
                    }
                    case !lobbyStores.has(newState.channel.parentID): {
                        console.log('leave', oldState.channel.members.size);
                        lobbyStores.get(oldState.channel.parentID).leave(oldState.member, oldState.channel);
                        break;
                    }
                    case oldState.channel.members.size === 0 ? newState.channel.members.size !== 1 : newState.channel.members.size === 1 : {
                        console.log('j/l internal');
                        const LS = lobbyStores.get(newState.channel.parentID);
                        await LS.leave(newState.member, oldState.channel);
                        await LS.join(newState.member, newState.channel);
                        break;
                    }
                    default: {
                        console.log('internal');
                        lobbyStores.get(newState.channel.parentID).internal(newState.member, oldState.channel, newState.channel);
                        break;
                    }
                }
                break;
            }
            default:
                break;
        }

        // if (oldState.channelID !== newState.channelID) {

            // const cfg = {
            //     channel: oldState.channel || newState.channel,
            //     guild: oldState.guild || newState.guild,
            //     member: oldState.member || newState.member,
            // };
            // cfg.category = cfg.channel.parent;
            // cfg.dbGuild = await G.findByPk(cfg.guild.id);
            // const voices = cfg.category.children.filter((ch) => ch.type === 'voice');
            // console.log(cfg.channel.members.size, !newState);

            // switch (true) {
            //     case true:

            //         break;

            //     default:
            //         break;
            // }

            // if (cfg.channel.members.size === 1 || (cfg.channel.members.size === 0 && !(newState.channel))) {
            //     console.log('sync');
            //     if (newState.channel) {
            //         try {
            //             await cfg.channel.clone({ name: `voice #${voices.size + 1}`});
            //         } catch (err) {
            //             console.log('clone err', err);
            //         }
            //         await this.syncNames({dbCategory: Object.entries(cfg.dbGuild.voiceCategories).find((e) => e[1] === cfg.category.id)[0], dbGuild: cfg.dbGuild});
            //     } else {
            //         await this.syncNames({dbCategory: Object.entries(cfg.dbGuild.voiceCategories).find((e) => e[1] === cfg.category.id)[0], dbGuild: cfg.dbGuild, ignoreChannel: (await cfg.channel.delete()).id});
            //     }
            // }
        // }
    }

    // private async joinVoice(cfg) {

    // }

    // private async leaveVoice(cfg) {

    // }

    // private async initLobby(cfg) {
    //     const LInst = await Lobby.create<Lobby>({
    //         active: true,
    //         channel: cfg.channel.id,
    //         guildId: cfg.guild.id,
    //         open: true,
    //     });
    //     return LInst.$set('leader', cfg.dbUser);
    // }

    // private async deleteLobby(cfg) {
    //     const LInst = await Lobby.findOne({where: {
    //         channel: cfg.channel.id,
    //     }});
    //     LInst.active = false;
    //     return LInst.save();
    // }

    // private async validate() {

    // }

    // private async syncNames(cfg) {
    //     // this.client.channels.fetch();
    //     const category = await this.client.channels.fetch(cfg.dbGuild.voiceCategories[cfg.dbCategory]) as CategoryChannel;
    //     await category.fetch();
    //     const voices = category.children.filter((ch) => ch.type === 'voice' && ch.id !== cfg.ignoreChannel);
    //     const channels = voices.array().filter((ch) => !ch.deleted).sort((a, b) => a.position - b.position).slice(cfg.dbGuild.roomsRange[0]);
    //     console.log('TCL: VoiceStateUpdate -> privatesyncNames -> channels', channels.map((ch) => ch.name));
    //     channels.map((ch, i) => ch.setName(`voice #${i + cfg.dbGuild.roomsRange[0] + 1}`));
    // }

    // private async initFilter() {
    //     const dbGuilds = await G.findAll({ where: { premium: true }});
    //     this.guildFilter = dbGuilds.map((g) => g.id);
    // }

    private guildFilter: string[];
}
