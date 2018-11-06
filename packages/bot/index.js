// require('dotenv').config()

// const restify = require('restify');
// const fs = require('fs');
// const dirTree = require('directory-tree');

// const routes = dirTree('./routes', {extentions:/\.js/}).children;
// let endpoints = []

// function construct (child) {
//     // console.log('run');
//     for (let i = 0; i < child.length; i++) {
//         let e = child[i];
//         // console.log('---',e,'---');
//         if (e.type === 'directory') {
//             construct(e.children)
//         } else if (e.type === 'file') {
//             let path = e.path.replace('routes', '').replace(/(\\)+/g, '/').replace(/@+/g, ':').replace('.js', '')
//             let split = path.split('/');
//             endpoints.push({type: split[split.length-1], route: path.split('/').slice(0, -1).join('/'), path: './'+e.path.replace(/(\\)+/g, '/')})
//         }
//     }
// }

// construct(routes);

// // console.log(endpoints);


// const discord = require('discord.js');
// const redis = require('redis');
// const bluebird = require('bluebird');
// const r6db = require('r6api')({email: process.env.R6API_LOGIN, password: process.env.R6API_PASSWORD}, {logLevel: process.env.R6API_LOGLEVEL})

// const db = redis.createClient(process.env.REDIS_URL);
// const bot = new discord.Client();

// bluebird.promisifyAll(redis.RedisClient.prototype);

// bot.on('ready', async ()=>{
//     // let pool = [];
//     // let banpool = [];
//     // let r6ru = bot.guilds.get('414757184044531722');
//     // let bans = await r6ru.fetchBans();
//     // await r6ru.fetchMembers();
//     // console.log(r6ru.members.array().length);
//     // let users = (await db.keysAsync('user_*')).map(e=>e.slice(5));
//     // users.forEach(e => {
//     //     r6ru.members.has(e) || pool.push(e)
//     // });
//     // console.log(pool, pool.length);
//     // pool.forEach(e => {
//     //     !bans.has(e) || banpool.push(e)
//     // });
//     // console.log(banpool, banpool.length);
//     // let pool = [];
//     // let users = (await db.keysAsync('user_*')).map(e=>e.slice(5));
//     // let queue = await db.lrangeAsync('cooldown', 0, -1);
//     // console.log(queue.length, users.length);
//     // queue.forEach(e => {
//     //     if (!users.includes(e)) {
//     //         pool.push(e);
//     //     }
//     // });
//     // console.log(pool.length);
//     // pool.forEach(e => {
//     //     db.lremAsync('cooldown', 0, e);
//     // });
//     //await db.lremAsync('cooldown', 0, id);
//     // db.delAsync(banpool.map(e=>`user_${e}`))
//     // console.log('users: ', users);
// })

// bot.login(process.env.DISCORD_TOKEN)

// r6db.getAuthToken().then(console.log)