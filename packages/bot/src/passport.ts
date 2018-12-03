import * as passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-oauth2';
import { User } from './models/User';

passport.use('discord', new DiscordStrategy({
    authorizationURL: 'https://discordapp.com/api/oauth2/authorize',
    tokenURL: 'https://discordapp.com/api/oauth2/token',
    clientID: process.env.DISCORD_ID,
    clientSecret: process.env.DISCORD_SECRET,
    callbackURL: process.env.CALLBACK_URL,
}, (accessToken, refreshToken, profile, cb) => {
    User.findOrCreate({ where: profile.id })
}))