import { Guild as G, User as U } from '@r6ru/db';
import { Listener } from 'discord-akairo';
import { CategoryChannel, VoiceState } from 'discord.js';

export default class VoiceStateUpdate extends Listener {
    public constructor() {
        super('voiceStateUpdate', {
            emitter: 'client',
            event: 'voiceStateUpdate',
        });
    }
    public async exec(oldState: VoiceState, newState: VoiceState) {/*
        if (oldState.guild.id !== '216649610511384576') { return; }
        if (oldState.channelID !== newState.channelID) {
            console.log(oldState.channel && oldState.channel.name, newState.channel && newState.channel.name, new Date());
            const guild = oldState.guild || newState.guild;
            const channel = oldState.channel || newState.channel;
            const member = oldState.member || newState.member;
            const category = channel.parent;
            const dbGuild = await G.findByPk(guild.id);
            const voices = category.children.filter((ch) => ch.type === 'voice');
            console.log(channel.members.size, !newState);
            if (channel.members.size === 1 || (channel.members.size === 0 && !(newState.channel))) {
                console.log('sync');
                if (newState.channel) {
                    try {
                        await channel.clone({ name: `voice #${voices.size + 1}`});
                    } catch (err) {
                        console.log('clone err', err);
                    }
                    this.syncNames(Object.entries(dbGuild.voiceCategories).find((e) => e[1] === category.id)[0], dbGuild);
                } else {
                    try {
                        await channel.delete();
                    } catch (err) {
                        console.log('del err', err);
                    }
                    this.syncNames(Object.entries(dbGuild.voiceCategories).find((e) => e[1] === category.id)[0], dbGuild);
                }
            }
        }
     */}

    private async validate() {

    }

    private async syncNames(type: string, dbGuild: G) {/*
        // this.client.channels.fetch();
        const category = await this.client.channels.fetch(dbGuild.voiceCategories[type]) as CategoryChannel;
        await category.fetch();
        const voices = category.children.filter((ch) => ch.type === 'voice' && !ch.deleted);
        const firstVoicePos = voices.first().position;
        console.log([...voices.values()].map((ch) => ch.name));
        console.log('TCL: VoiceStateUpdate -> privatesyncNames -> firstVoicePos', firstVoicePos);
        const channels = [...voices.values()].filter((ch) => !ch.deleted).sort((a, b) => a.position - b.position).slice(dbGuild.roomsRange[0]); // dumb array() caching
        console.log('TCL: VoiceStateUpdate -> privatesyncNames -> channels', channels.map((ch) => ch.name));
        channels.map((ch) => { console.log({ch}); ch.setName(`voice #${ch.position + firstVoicePos + 1}`).catch((d) => console.log('ch', d)); });
     */}
}
