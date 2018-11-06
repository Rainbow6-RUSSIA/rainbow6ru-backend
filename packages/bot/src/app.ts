import * as dotenv from 'dotenv';
dotenv.config();

import './bot';
// import * as DB from './db/index';
import './server';

import {HowManyDBs, User} from './db/user';

console.log(`[DB] Number of User DBs - ${HowManyDBs}`);
// setTimeout(async () => {
//     // upsert - 1 изменение или создание,
//     // bulkCreate - удаляем перед обновлением и записываем
//     User.bulkCreate([{
//         id: '1',
//         // id: Math.round(Math.random() * 100).toString(),
//         genome: '6140db04-5325-46d8-85fb-c385e68ca9b9',
//         nickname: 'FaZe1',
//         verificationLevel: 5,
//     },
//     {
//         id: '2',
//         // id: Math.round(Math.random() * 100).toString(),
//         genome: '6140db04-5325-46d8-85fb-c385e68ca9b9',
//         nickname: 'FaZe2',
//         verificationLevel: 5,
//     },
//     {
//         id: '4',
//         // id: Math.round(Math.random() * 100).toString(),
//         genome: '6140db04-5325-46d8-85fb-c385e68ca9b9',
//         nickname: 'FaZe4',
//         verificationLevel: 5,
//     }], {ignoreDuplicates: true}); // .then(console.log).catch(console.log);
//     User.findAll(
//         // {verificationLevel: 1},
//         {where:
//             { genome: '6140db04-5325-46d8-85fb-c385e68ca9b9'},
//             // returning: true,
//             // order: [],
//         }).then(console.log).catch(console.log);
//     // User.upsert({
//     //     id: '21',
//     //     genome: '6140db04-5325-46d8-85fb-c385e68ca9b9',
//     //     nickname: 'hiddenpoolblyat',
//     //     verificationLevel: 1,
//     // }).then(console.log).catch(console.log);
//     // User.upsert({
//     //     id: '12',
//     //     genome: '6140db04-5325-46d8-85fb-c385e68ca9b9',
//     //     nickname: 'twitchFaZebook',
//     //     verificationLevel: 1,
//     // }).then(console.log).catch(console.log);
//     // User.findAll({ where: { genome: '6140db04-5325-46d8-85fb-c385e68ca9b9' } }).then(console.log);
// }, 1500);
