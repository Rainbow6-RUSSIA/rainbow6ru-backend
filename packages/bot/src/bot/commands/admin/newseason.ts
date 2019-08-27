import { Guild, GuildBlacklist, User } from '@r6ru/db';
import { ONLINE_TRACKER, UUID } from '@r6ru/types';
import { Command } from 'discord-akairo';
import { Collection, Message, Snowflake } from 'discord.js';
import { Sequelize } from 'sequelize-typescript';
import ENV from '../../../utils/env';

const { Op } = Sequelize;

export default class NewSeason extends Command {
    constructor() {
        super('new_season', {
            aliases: ['new_season', 'newseason'],
            args: [
                {
                    id: 'confirmation',
                    type: ['Я согласен со сбросом данных'],
                },
            ],
            channel: 'guild',
            ownerOnly: true,
        });
    }

    public exec = async (message: Message, args) => {
        console.log(message, args);
    }
}
