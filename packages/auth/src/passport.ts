/* import { User } from '@r6ru/db';
import * as passport from 'passport';
import { ExtractJwt, Strategy as JWTStrategy } from 'passport-jwt';
import { Strategy as DiscordStrategy } from 'passport-oauth2';
import ENV from './utils/env';

passport.use(
    'discord',
    new DiscordStrategy(
        {
            authorizationURL: 'https://discordapp.com/api/oauth2/authorize',
            callbackURL: ENV.CALLBACK_URL,
            clientID: ENV.CLIENT_ID,
            clientSecret: ENV.DISCORD_SECRET,
            tokenURL: 'https://discordapp.com/api/oauth2/token',
        },
        (accessToken, refreshToken, profile, done) => {
            User.findByPk(profile.id)
                .then((user) => {
                    if (user) {
                        return done(null, user);
                    } else {
                        return done(null, false);
                    }
                })
                .catch(done);
        },
    ),
);

passport.use(
    'jwt',
    new JWTStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: ENV.KEY256,
            issuer: 'auth.rainbow6.ru',
            audience: 'rainbow6.ru',
        },
        (jwtPayload, done) => {
            User.findByPk(jwtPayload.sub)
                .then((user) => {
                    if (user) {
                        return done(null, user);
                    } else {
                        return done(null, false);
                    }
                })
                .catch(done);
        },
    ),
);
 */