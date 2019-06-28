import { Message } from 'discord.js';
import ENV from '../env';

export function RefreshedMessage(msg: Message) {
    const i = 0;
    return new Proxy(msg, {
        get(target: Message, key) {
            return target[key];
            // return !(key === 'edit' && typeof target[key] === 'function') ? target[key] : async function(...args) {
            //     if (i > parseInt(ENV.INVITE_EDITS_LIMIT) || target.createdTimestamp < (Date.now() - parseInt(ENV.INVITE_AGE) * 1000)) {
            //         await target.delete();
            //         i = 0;
            //         return RefreshedMessage(await target.channel.send(...args) as Message);
            //     } else {
            //         i++;
            //         return target[key].apply(this, args);
            //     }
            // };
        },
    });
}
