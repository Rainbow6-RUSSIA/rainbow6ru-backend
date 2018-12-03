import { Command } from "discord-akairo";
import { Message } from 'discord.js'

export default class Votekick extends Command {
    public constructor() {
        super('votekick', {
            aliases: ['votekick', 'VK']
        });
    }
    public exec(message: Message) {

    }
}