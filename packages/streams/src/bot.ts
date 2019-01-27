import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler} from 'discord-akairo';
import ENV from './utils/env';

class Bot extends AkairoClient {
    private commandHandler;
    private inhibitorHandler;
    private listenerHandler;
    constructor() {
        super({ownerID: ENV.OWNERS.split(',')});

        const loadFilter = (path) => /^.*\.js$/g.test(path);

        this.commandHandler = new CommandHandler(this, {
            directory: './build/commands',
            loadFilter,
            prefix: process.env.PREFIX,
            allowMention: true,
        });

        this.inhibitorHandler = new InhibitorHandler(this, {
            directory: './build/inhibitors/',
            loadFilter,
        });
        this.listenerHandler = new ListenerHandler(this, {
            directory: './build/listeners/',
            loadFilter,
        });

        this.listenerHandler.setEmitters({
            commandHandler: this.commandHandler,
            inhibitorHandler: this.inhibitorHandler,
            listenerHandler: this.listenerHandler,
            process,
        });

        this.commandHandler.loadAll();
        this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
        this.commandHandler.useListenerHandler(this.listenerHandler);
        this.inhibitorHandler.loadAll();
        this.listenerHandler.loadAll();
    }
}

const bot = new Bot();
bot.login(ENV.DISCORD_TOKEN);

export default bot;