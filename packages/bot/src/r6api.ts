// import r6api from 'r6api';
import ENV from './utils/env';

import { RainbowSixAPI } from '@r6s.media/r6.api';
import { debug } from '.';

const emails = ENV.R6API_CREDS_LOGIN.split(',');
const passwords = ENV.R6API_CREDS_PASS.split(',');
let i = 0;

let API = new RainbowSixAPI({email: ENV.R6API_LOGIN, password: ENV.R6API_PASSWORD});

export function refresh() {
    if (i >= emails.length) {
        i = 0;
    }
    API = new RainbowSixAPI({email: emails[i], password: passwords[i]});
    debug.warn(`R6API refreshed to ${emails[i]}`);
    i++;
}

export default API;
