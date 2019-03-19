// import * as dotenv from 'dotenv';
// dotenv.config();

// import { Guild, User } from '@r6ru/db';
// import { GetRankedResponse } from '@r6s.media/r6.api/build/Types';
// // import { ENV } from '@r6ru/types';
// import { promisifyAll } from 'bluebird';
// import { Commands, createClient, RedisClient } from 'redis';
// import bot from '../bot';
// import r6api from '../r6api';

// interface IPromisifedRedis extends RedisClient {
//     [x: string]: any;
// }

// async function main() {
//     promisifyAll(RedisClient.prototype);
//     const redis = createClient(process.env.REDIS_DB) as IPromisifedRedis;
//     console.log('Connected!');

//     const guilds = (await redis.keysAsync('guild_??????????????????')).map((g: string) => g.split('_')[1]);
//     let G = guilds.map((g) => redis.hgetallAsync('guild_' + g));
//     const GMap = new Map();
//     G = (await Promise.all(G)).reduce((acc, curr, i) => {
//         return GMap.set(guilds[i], curr);
//     });
//     // console.log('​main -> guilds', GMap);

//     const bans = (await redis.keysAsync('guild_*_banlist')).map((g: string) => g.split('_')[1]);
//     let B = bans.map((b) => redis.zrangeAsync('guild_' + b + '_banlist', 0, -1));
//     const BMap = new Map();
//     B = (await Promise.all(B)).reduce((acc, curr, i) => {
//         return BMap.set(bans[i], curr);
//     });
//     // console.log(...BMap.get('414757184044531722'));

//     const users = (await redis.keysAsync('user_*')).map((u: string) => u.split('_')[1]);
//     let UMap = users.map((u) => redis.hgetallAsync('user_' + u));
//     // let UMap = {};
//     UMap = (await Promise.all(UMap)).reduce((acc, curr: any, i) => {
//         acc[users[i]] = curr.genome;
//         return acc;
//     }, {});
//     const GenomeMap = Object.entries(UMap).reduce((accum, [k, v]) => {
//         accum[v as string] = k;
//         return accum;
//     }, {});
//     // console.log('TCL: GenomeMap', GenomeMap);
//     // <= 40
//     // const ResMap = UMap.reduce((acc, val) => acc[val] = null, {});
//     // console.log(ResMap);
//     console.log('Redis fetching complete');
//     const plainGenomes = Object.keys(GenomeMap);

//     // const userList = (await redis.keysAsync('user_*')).map((e) => e.slice(5));
//     // const userPool = [];
//     // const dbRequests = [];
//     // userList.forEach((u) => {
//     //     dbRequests.push(redis.hgetAsync('user_' + u, 'genome'));
//     //     userPool.push(u);
//     // });
//     // const userGens = await Promise.all(dbRequests);

//     // throw new Error();

//     for (let i = 0; i < Math.ceil(plainGenomes.length / 199); i++) {
//         const partB = plainGenomes.slice(i * 199, (((i + 1) * 199 >= plainGenomes.length) ? (plainGenomes.length - 1) : ((i + 1) * 199)));
//         // if (Math.random() < 0.005) {
//         //     console.log('[--------]', '​partB', ...partB, '[--------]');
//         // }
//         if (!partB.length) { continue; }
//         let temp: GetRankedResponse = null;
//         try {
//             temp = await r6api.getRank('PC', [...partB]);
//         } catch (err) {
//             console.log(err);
//             console.log([...partB]);
//             throw new Error();
//         }
//         Object.values(temp).forEach((e) => {
//             const ranks = [e.emea.rank, e.apac.rank, e.ncsa.rank];
//             const reg = ['emea', 'apac', 'ncsa'][ranks.indexOf(Math.max(...ranks))];
//             const genome = UMap[GenomeMap[e.id]];
//             UMap[GenomeMap[e.id]] = {
//                 genome,
//                 genomeHistory: [{record: genome, timestamp: Date.now()}],
//                 rank: e[reg].rank,
//                 region: reg,
//             };
//         });
//     }

//     console.log('Added ranks');
//     // console.log(UMap);

//     const r6ru = bot.guilds.get('414757184044531722');
//     await r6ru.members.fetch();

//     for (let i = 0; i < Math.ceil(plainGenomes.length / 40); i++) {
//         const partA = plainGenomes.slice(i * 40, (((i + 1) * 40 >= plainGenomes.length) ? (plainGenomes.length - 1) : ((i + 1) * 40)));
//         // if (Math.random() < 0.005) {
//         //     console.log('[--------]', '​partA', ...partA, '[--------]');
//         // }
//         if (!partA.length) { continue; }
//         const temp = await r6api.getCurrentName('PC', [...partA]);
//         Object.values(temp).map(async (e) => {
//             const cache = UMap[GenomeMap[e.userId]];
//             UMap[GenomeMap[e.userId]] = {
//                 ...cache,
//                 id: GenomeMap[e.userId],
//                 inactive: !r6ru.members.has(GenomeMap[e.userId]),
//                 nickname: e.name,
//                 nicknameHistory: [{record: e.name, timestamp: Date.now()}],
//                 platform: {
//                     PC: true,
//                     PS4: false,
//                     XBOX: false,
//                 },
//             };
//             // if (Math.random() < 0.005) {
//             //     console.log(cache);
//             // }
//         });
//     }

//     // console.log(UMap);
//     console.log('Added nickname');
//     console.log('DB Saving...');

//     function chunk(arr, groupsize) {
//         const sets = [];
//         let chunks;
//         let i = 0;
//         chunks = arr.length / groupsize;

//         while (i < chunks) {
//             sets[i] = arr.splice(0, groupsize);
//             i++;
//         }

//         return sets;
//     }

//     await Promise.all(chunk(Object.values(UMap).filter((u) => typeof u === 'object'), 5).map((chnk) => User.bulkCreate<User>(chnk)));
//     // (Object.values(UMap).filter((u) => typeof u === 'object'));
//     console.log('Done');

// }

// main().catch(console.log);
