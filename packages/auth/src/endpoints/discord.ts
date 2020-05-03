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
    })
    try {
        const responce = await fetch(
            'https://discordapp.com/api/v6/oauth2/token?' + params,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        
            }
        )
        const json = await responce.json();
        
    } catch (error) {
        return next(new InternalServerError());
    }
    next()
});
