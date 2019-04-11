// import r6api from 'r6api';
import ENV from './utils/env';

import { RainbowSixAPI } from '@r6s.media/r6.api';

export default new RainbowSixAPI({email: ENV.R6API_LOGIN, password: ENV.R6API_PASSWORD});
