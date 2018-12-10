import * as r6api from 'r6api';
import { IR6API } from './utils/r6api';
import { ENV } from './utils/types';

export default (r6api as any)({
        email: ENV.R6API_LOGIN,
        password: ENV.R6API_PASSWORD
    }, {logLevel: ENV.R6API_LOGLEVEL}) as IR6API