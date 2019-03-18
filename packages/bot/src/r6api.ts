// import r6api from 'r6api';
import ENV from './utils/env';

// export default r6api({
//         email: ENV.R6API_LOGIN,
//         password: ENV.R6API_PASSWORD,
//     }, {
//         logLevel: parseInt(ENV.R6API_LOGLEVEL),
//     });
import {APIService, AuthService} from '@r6s.media/r6.api';

export default new APIService(new AuthService({email: ENV.R6API_LOGIN, password: ENV.R6API_PASSWORD}));
