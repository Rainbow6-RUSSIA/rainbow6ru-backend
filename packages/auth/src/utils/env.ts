class IEnv {
    public CALLBACK_URL: string;
    public DISCORD_SECRET: string;
    public CLIENT_ID: string;
    public KEY256: string;
}

// tslint:disable-next-line:max-classes-per-file
class IOptionalEnv extends IEnv {
    public PORT = '';
}

for (const key in new IEnv()) {
    if (!process.env[key] && !process.env.NO_ENV_CHECK) {
        throw new Error(`Enviromental variable ${key} not specified`);
    }
}

export default (process.env as unknown) as IOptionalEnv;
