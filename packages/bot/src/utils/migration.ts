import { createClient, RedisClient, Commands } from 'redis';
import { promisifyAll } from "bluebird";
import { ENV } from './types';
import { Guild } from '../models/Guild';
import { User } from '../models/User';
import r6api from '../r6api';
import bot from '../bot';

interface IPromisifedRedis extends RedisClient {
    [x: string]: any;
}

async function main() {
    promisifyAll(RedisClient.prototype);
    const redis = createClient(ENV.REDIS_DB) as IPromisifedRedis;
    console.log('Connected!')
    let users = (await redis.keysAsync('user_*')).map((u: string) => u.split('_')[1]);
    let UMap = users.map(u => redis.hgetallAsync('user_'+u));
    // let UMap = {};
    UMap = (await Promise.all(UMap)).reduce((acc, curr: any, i) => {
            acc[users[i]]= curr.genome;
            return acc;
    }, {});
    // console.log("​main -> users", U)
    let GenomeMap = Object.entries(UMap).reduce((accum, [k, v])=>{
        accum[v as string] = k
        return accum
    },{})
	// console.log("​U -> GenomeMap", GenomeMap)
    // <= 40
    let plainGenomes = Object.keys(GenomeMap)

    for (let i = 0; i < Math.ceil(plainGenomes.length/199 ); i++) {
        let partB = plainGenomes.slice(i*199, (((i+1)*199 >= plainGenomes.length) ? (plainGenomes.length-1) : ((i+1)*199)))
        console.log("[--------]", ...partB, "[--------]");
        if (!partB.length) continue
        let temp = await r6api.getRanks(...partB)
        temp.forEach((e, i, a) => {
            let ranks = [e.apac.rank, e.emea.rank, e.ncsa.rank];
            let reg = ['apac', 'emea', 'ncsa'][ranks.indexOf(Math.max(...ranks))];
            UMap[GenomeMap[e.id]] = {
                ...UMap[GenomeMap[e.id]],
                rank: e[reg].rank,
                region: reg,
            }
        });
    }

    for (let i = 0; i < Math.ceil(plainGenomes.length/40 ); i++) {
        let partA = plainGenomes.slice(i*40, (((i+1)*40 >= plainGenomes.length) ? (plainGenomes.length-1) : ((i+1)*40)));
        console.log("​partA", partA)
        if (!partA.length) continue
        let temp = await r6api.getCurrentName(...partA)
        temp.forEach((e, i, a) => {
            UMap[GenomeMap[e.userId]] = {
                ...UMap[GenomeMap[e.id]],
                genome: e.userId,
                platform: 'PC',
                genomeHistory: [e.userId],
                nickname: e.name,
                nicknameHistory: [e.name],
                id: GenomeMap[e.userId]
            }
        });
    }

    console.log("​main -> users", UMap)


    let guilds = (await redis.keysAsync('guild_??????????????????')).map((g: string) => g.split('_')[1])
    let G = guilds.map(g => redis.hgetallAsync('guild_'+g));
    let GMap = new Map();
    G = (await Promise.all(G)).reduce((acc, curr, i) => {
        return GMap.set(guilds[i], curr);
    })
    console.log("​main -> guilds", GMap)

    let bans = (await redis.keysAsync('guild_*_banlist')).map((g: string) => g.split('_')[1]);
    let B = bans.map(b => redis.zrangeAsync('guild_'+b+'_banlist', 0, GMap.size));
    let BMap = new Map();
    B = (await Promise.all(B)).reduce((acc, curr, i) => {
        return BMap.set(bans[i], curr);
    })
    console.log("​main -> bans", BMap)


}

main().catch(console.log)