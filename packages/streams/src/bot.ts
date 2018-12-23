import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler} from 'discord-akairo';

class Bot extends AkairoClient {
    private commandHandler;
    private inhibitorHandler;
    private listenerHandler;
    constructor() {
        super({ownerID: process.env.OWNERS.split(',')});

        this.commandHandler = new CommandHandler(this, {
            directory: './build/commands',
            loadFilter: (path) => /^.*\.js$/g.test(path),
            prefix: process.env.PREFIX,
            allowMention: true,
        });

        this.inhibitorHandler = new InhibitorHandler(this, {
            directory: './build/inhibitors/',
            loadFilter: (path) => /^.*\.js$/g.test(path),
        });
        this.listenerHandler = new ListenerHandler(this, {
            directory: './build/listeners/',
            loadFilter: (path) => /^.*\.js$/g.test(path),
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
bot.login(process.env.DISCORD_TOKEN);

export default bot;