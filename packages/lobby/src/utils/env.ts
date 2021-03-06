class IEnv {
    public PREFIX = '';
    public OWNERS = '';
    public DISCORD_TOKEN = '';
    public DISCORD_SECRET = '';
    public CALLBACK_URL = '';
    public DB = '';
    public LOGGING_WEBHOOK = '';
    public VERIFIED_BADGE = '<:verified:562059822279819265>';
    public BAN_BADGE = '<:ban:544254582637723679>';
    public KICK_LIMIT = '';
    public REBOOT_TIME = '';
    public INVITE_AGE = '';
    public LOBBY_PREVIEW_URL = '';
    public MESSAGE_COOLDOWN = '';
}

// tslint:disable-next-line:max-classes-per-file
class IDefaultEnv extends IEnv {
    public DANGER_DROP_BEFORE_START = '';
    public DISCORD_ID = '';
    public PORT = '';
    public NODE_ENV = '';
    public GOOGLE_API_KEY = '';
    public GOOGLE_AUTH = '';
}

for (const key in new IEnv()) {
    if (!process.env[key] && !process.env.NO_ENV_CHECK) {
        throw new Error(`Enviromental variable ${key} not specified`);
    }
}

export default (process.env as any) as IDefaultEnv;
