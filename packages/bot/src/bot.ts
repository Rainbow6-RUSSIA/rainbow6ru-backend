import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } from 'discord-akairo';
import ENV from './utils/env';

class Bot extends AkairoClient {
    private commandHandler: CommandHandler;
    private inhibitorHandler: InhibitorHandler;
    private listenerHandler: ListenerHandler;
    constructor() {
        super({
            ownerID: process.env.OWNERS.split(','),
        }, {
            // messageCacheLifetime: parseInt(ENV.INVITE_AGE),
            // messageCacheMaxSize: 500,
            // messageSweepInterval: 120,
            ws: {
                compress: true,
            },
        });

        this.commandHandler = new CommandHandler(this, {
            allowMention: true,
            automateCategories: true,
            defaultCooldown: 1000,
            directory: __dirname + '/bot/commands/',
            fetchMembers: true,
            ignoreCooldown: this.ownerID,
            ignorePermissions: this.ownerID,
            loadFilter: path => path.split('.').pop() === 'js',
            prefix: ENV.PREFIX,
        });

        this.inhibitorHandler = new InhibitorHandler(this, {
            automateCategories: true,
            directory: __dirname + '/bot/inhibitors/',
            loadFilter: path => path.split('.').pop() === 'js',
        });
        this.listenerHandler = new ListenerHandler(this, {
            automateCategories: true,
            directory: __dirname + '/bot/listeners/',
            loadFilter: path => path.split('.').pop() === 'js',
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

const login = async () => {
    await bot.login(ENV.DISCORD_TOKEN);
};

const state = login();

export async function user() {
    await state;
    return bot.user;
}

export default bot;
