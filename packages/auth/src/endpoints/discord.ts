import * as jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { BadRequestError, InternalServerError } from 'restify-errors';
import { server } from '..';
import ENV from '../utils/env';

server.get('/discord', async (req, res, next) => {
    const code = req.query.code;
    if (!code) return next(new BadRequestError());
    const params = new URLSearchParams({
        'client_id': ENV.CLIENT_ID,
        'client_secret': ENV.DISCORD_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': ENV.CALLBACK_URL,
        'scope': 'identify email connections'
    });
    try {
        const reqToken = await fetch(
            'https://discordapp.com/api/v6/oauth2/token',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            }
        );
        const json = await reqToken.json();
        if (!json.access_token) return next(new BadRequestError());
        const reqUser = await fetch(`https://discordapp.com/api/v6/users/@me`, {
            headers: { 'Authorization': `Bearer ${json.access_token}`}
        });
        const user = await reqUser.json();
        if (!user.id) return next(new BadRequestError())
        const token = jwt.sign({
            sub: user.id,
        }, ENV.KEY256, {
            expiresIn: '7d'
        });

        res.send({ user, token });
        
    } catch (error) {
        return next(new InternalServerError());
    }
    next();
});
