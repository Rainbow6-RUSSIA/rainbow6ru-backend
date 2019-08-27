// import r6api from 'r6api';
import ENV from './utils/env';

import { R6API } from 'r6api.js';
import { debug } from '.';

const emails = ENV.R6API_CREDS_LOGIN.split(',');
const passwords = ENV.R6API_CREDS_PASS.split(',');
let i = 0;

let API = new R6API(ENV.R6API_LOGIN, ENV.R6API_PASSWORD);

export function refresh() {
    if (i >= emails.length) {
        i = 0;
    }
    API = new R6API(emails[i], passwords[i]);
    debug.warn(`R6API refreshed to ${emails[i]}`);
    i++;
}

export default API;
