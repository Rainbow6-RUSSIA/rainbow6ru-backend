import { Command } from 'discord-akairo';

export default class Info extends Command {
    constructor() {
        super('info', {
           aliases: ['info'] 
        });
    }

    public exec(message) {
        return message.reply('Pong!');
    }
}