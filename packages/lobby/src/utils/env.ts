class IEnv {
    public PREFIX = '';
    public OWNERS = '';
    public DISCORD_TOKEN = '';
    public DISCORD_SECRET = '';
    public CALLBACK_URL = '';
    public DB = '';
    public R6API_LOGIN = '';
    public R6API_PASSWORD = '';
    public PACK_SIZE = '';
    // public MIGRATE = '';
    public COOLDOWN = '';
    public KEY256 = '';
    public REQUIRED_ACCOUNT_AGE = '';
    public REQUIRED_LEVEL = '';
    public LOGGING_WEBHOOK = '';
    public EVENT_QUEUE_LENGTH = '';
    public VERIFIED_BADGE = '<:verified:562059822279819265>';
    public BAN_BADGE = '<:ban:544254582637723679>';
    public R6API_CREDS_LOGIN = '';
    public R6API_CREDS_PASS = '';
    public KICK_LIMIT = '';
    public REBOOT_TIME = '';
    public INVITE_AGE = '';
    public INVITE_EDITS_LIMIT = '';
    public LOBBY_MODE: 'on' | 'off' | 'only' = 'on';
    public LOBBY_PREVIEW_URL = '';
}

// tslint:disable-next-line:max-classes-per-file
class IDefaultEnv extends IEnv {
    public DANGER_DROP_BEFORE_START = '';
    public DISCORD_ID = '';
    public PORT = '';
    public REDIS_DB = '';
    public NODE_ENV = '';
    public QR_CHANCE = '';
}

for (const key in new IEnv()) {
    if (!process.env[key] && !process.env.NO_ENV_CHECK) { throw new Error(`Enviromental variable ${key} not specified`); }
}

export default process.env as any as IDefaultEnv;