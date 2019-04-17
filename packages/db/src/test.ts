import * as dotenv from 'dotenv';
dotenv.config();

import db from './index';
import User from './models/User';

(async () => {
    await db(process.env.DB);
    const user = await User.findByPk('125634283258773504');
    console.log(user);
})();
