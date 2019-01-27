class IEnv {
    public PREFIX = '';
    public OWNERS = '';
    public DB = '';
    public DISCORD_TOKEN = '';
}

// tslint:disable-next-line:max-classes-per-file
class IDefaultEnv extends IEnv {
    public DANGER_DROP_BEFORE_START = '';
    public PORT = '';
}

for (const key in new IEnv()) {
    if (!process.env[key]) { throw new Error(`Enviromental variable ${key} not specified`); }
}

export default process.env as any as IDefaultEnv;
