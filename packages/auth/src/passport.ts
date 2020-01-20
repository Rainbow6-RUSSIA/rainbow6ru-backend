import { User } from '@r6ru/db';
import * as passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-oauth2';
import ENV from './utils/env';

passport.use('discord', new DiscordStrategy({
    authorizationURL: 'https://discordapp.com/api/oauth2/authorize',
    callbackURL: ENV.CALLBACK_URL,
    clientID: ENV.CLIENT_ID,
    clientSecret: ENV.DISCORD_SECRET,
    tokenURL: 'https://discordapp.com/api/oauth2/token',
}, (accessToken, refreshToken, profile, cb) => {
    User.findOrCreate({ where: profile.id });
}));
