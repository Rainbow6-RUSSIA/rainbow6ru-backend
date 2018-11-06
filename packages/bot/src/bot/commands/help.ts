import { Command } from 'discord-akairo';

export default class Help extends Command {
    constructor() {
        super('help', {
            aliases: ['help', '', 'H'],
            cooldown: 5000,
        });
    }
    public exec = async (message) => {
        return message.reply('some help');
    }
}
