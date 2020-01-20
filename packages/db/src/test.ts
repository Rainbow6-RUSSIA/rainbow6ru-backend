import * as dotenv from 'dotenv';
dotenv.config();

import db, { Lobby } from './index';
import User from './models/User';

(async () => {
    await db(process.env.DB, true);
    console.log('[TEST] CONNECTED!');
    const user = await User.findByPk('125634283258773504');
    const lobby = await Lobby.findByPk(201726, { include: [{all: true}] });
    // tslint:disable-next-line:no-debugger
    debugger;
    console.log(1, lobby);
    console.log(2, lobby.toJSON());
    console.log(3, lobby.get());
    process.exit(0);
})();
