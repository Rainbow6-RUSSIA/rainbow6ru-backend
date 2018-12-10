import * as passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-oauth2';
import { User } from './models/User';
import { ENV } from './utils/types';
import bot from './bot';

passport.use('discord', new DiscordStrategy({
    authorizationURL: 'https://discordapp.com/api/oauth2/authorize',
    tokenURL: 'https://discordapp.com/api/oauth2/token',
    clientID: bot.user.id,
    clientSecret: ENV.DISCORD_SECRET,
    callbackURL: ENV.CALLBACK_URL,
}, (accessToken, refreshToken, profile, cb) => {
    User.findOrCreate({ where: profile.id })
}))