import { Listener } from 'discord-akairo';
import { VoiceState } from 'discord.js';

export default class VoiceStateUpdate extends Listener {
    public constructor() {
        super('voiceStateUpdate', {
            emitter: 'client',
            event: 'voiceStateUpdate',
        });
    }
    public exec(oldState: VoiceState, newState: VoiceState) {
        console.log('​VoiceStateUpdate -> publicexec -> oldState', oldState);
        console.log('​VoiceStateUpdate -> publicexec -> newState', newState);
    }
}
