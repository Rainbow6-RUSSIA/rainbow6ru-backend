import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } from 'discord-akairo';
import ENV from './utils/env';

class Bot extends AkairoClient {
    private commandHandler: CommandHandler;
    private inhibitorHandler: InhibitorHandler;
    private listenerHandler: ListenerHandler;
    constructor() {
        super({
            ownerID: process.env.OWNERS.split(','),
        }, {});

        this.commandHandler = new CommandHandler(this, {
            allowMention: true,
            defaultCooldown: 1000,
            directory: __dirname + '/bot/commands/',
            fetchMembers: true,
            loadFilter: (path) => path.split('.').pop() === 'js',
            prefix: ENV.PREFIX,
            // handleEdits: true,
            // commandUtil: true,
        });
        // this.commandHandler.resolver.addType('ubi_genome', ubiGenome);
        // this.commandHandler.resolver.addType('ubi_nickname', ubiNickname);

        this.inhibitorHandler = new InhibitorHandler(this, {
            directory: __dirname + '/bot/inhibitors/',
            loadFilter: (path) => path.split('.').pop() === 'js',
        });
        this.listenerHandler = new ListenerHandler(this, {
            directory: __dirname + '/bot/listeners/',
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
