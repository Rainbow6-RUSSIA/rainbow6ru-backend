class IEnv {
    public PREFIX = '';
    public OWNERS = '';
    public DISCORD_TOKEN = '';
    public DISCORD_SECRET = '';
    public CALLBACK_URL = '';
    public DB = '';
    public LOGGING_WEBHOOK = '';
    // public VERIFIED_BADGE = '';
    // public BAN_BADGE = '';
    public KICK_LIMIT = '';
    public REBOOT_TIME = '';
    public INVITE_AGE = '';
    public LOBBY_SERVICE_URL = '';
    public MESSAGE_COOLDOWN = '';
    public DONATE_ROLE = '';
    public NITRO_ROLE = '';

    public DESCRIPTION_LENGTH_LIMIT = '';
    public DESCRIPTION_LINES_LIMIT = '';

    public VOTEKICK_TIME = '';
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
    if (!process.env[key] && !process.env.NO_ENV_CHECK) { throw new Error(`Enviromental variable ${key} not specified`); }
}

export default process.env as any as IDefaultEnv;
