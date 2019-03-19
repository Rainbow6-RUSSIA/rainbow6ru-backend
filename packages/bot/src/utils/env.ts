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
}

// tslint:disable-next-line:max-classes-per-file
class IDefaultEnv extends IEnv {
    public DANGER_DROP_BEFORE_START = '';
    public DISCORD_ID = '';
    public PORT = '';
    public REDIS_DB = '';
}

for (const key in new IEnv()) {
    if (!process.env[key] && process.env.ENV_CHECK) { throw new Error(`Enviromental variable ${key} not specified`); }
}

export default process.env as any as IDefaultEnv;
