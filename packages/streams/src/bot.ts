import { MapR6 } from '@r6ru/db';
import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler} from 'discord-akairo';
import { Op } from 'sequelize';
import ENV from './utils/env';

class Bot extends AkairoClient {
    private commandHandler: CommandHandler;
    private inhibitorHandler: InhibitorHandler;
    private listenerHandler: ListenerHandler;
    constructor() {
        super({ownerID: ENV.OWNERS.split(',')});

        const loadFilter = (path) => /^.*\.js$/g.test(path);

        this.commandHandler = new CommandHandler(this, {
            directory: __dirname + '/commands',
            loadFilter,
            prefix: ENV.PREFIX,
            allowMention: true,
            defaultCooldown: 1000,
        });

        this.inhibitorHandler = new InhibitorHandler(this, {
            directory: __dirname + '/inhibitors/',
            loadFilter,
        });
        this.listenerHandler = new ListenerHandler(this, {
            directory: __dirname + '/listeners/',
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

let bot: Bot;
export let pool: string[];

MapR6.findAll({where: {
    id: {
        $ne: '',
    },
}}).then((maps) => {
    pool = maps.map((map) => map.id);
    bot = new Bot();
    bot.login(ENV.DISCORD_TOKEN);
});

export default bot;
