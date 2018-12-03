import * as r6api from 'r6api';

export default r6api({
    email: process.env.R6API_LOGIN,
    password: process.env.R6API_PASSWORD
}, {logLevel: process.env.R6API_LOGLEVEL})