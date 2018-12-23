import r6api from 'r6api';
import { ENV } from './utils/types';

export default r6api({
        email: ENV.R6API_LOGIN,
        password: ENV.R6API_PASSWORD
    }, {
        logLevel: parseInt(ENV.R6API_LOGLEVEL)
    });