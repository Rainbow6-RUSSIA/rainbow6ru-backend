import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } from 'discord-akairo';
import { ENV } from './utils/types';

class Bot extends AkairoClient {
    private commandHandler;
    private inhibitorHandler;
    private listenerHandler;
    constructor() {
        super({
            ownerID: process.env.OWNERS.split(','),
        }, {});

        this.commandHandler = new CommandHandler(this, {
            directory: './build/bot/commands/',
            loadFilter: (path) => path.split('.').pop() === 'js',
            prefix: ENV.PREFIX,
            allowMention: true,
            defaultCooldown: 1000,
            fetchMembers: true,
            // handleEdits: true,
            // commandUtil: true,
        });
        // this.commandHandler.resolver.addType('ubi_genome', ubiGenome);
        // this.commandHandler.resolver.addType('ubi_nickname', ubiNickname);

        this.inhibitorHandler = new InhibitorHandler(this, {
            directory: './build/bot/inhibitors/',
            loadFilter: (path) => path.split('.').pop() === 'js',
        });
        this.listenerHandler = new ListenerHandler(this, {
            directory: './build/bot/listeners/',
            loadFilter: (path) => path.split('.').pop() === 'js',
        });
        this.listenerHandler.setEmitters({
            commandHandler: this.commandHandler,
            inhibitorHandler: this.inhibitorHandler,
            listenerHandler: this.listenerHandler,
            process,
        });
        this.commandHandler.loadAll();
        this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
        this.commandHandler.useListenerHandler(this.listenerHandler); // mb optional
        this.inhibitorHandler.loadAll();
        this.listenerHandler.loadAll();
        // TODO: Special commandHandler+inhibitorHandler for premium commands
    }
}

const bot = new Bot();
bot.login(ENV.DISCORD_TOKEN);

export default bot;
