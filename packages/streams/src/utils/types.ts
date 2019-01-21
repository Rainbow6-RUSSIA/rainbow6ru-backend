export enum MATCH_TYPE {
    BO1 = 'bo1',
    BO2 = 'bo2',
    BO3 = 'bo3',
    BO5 = 'bo5',
    BO7 = 'bo7',
}

class IEnv {
    public PREFIX = '';
    public OWNERS = '';
    public DB = '';
}

// tslint:disable-next-line:max-classes-per-file
class IDefaultEnv extends IEnv {
    public DANGER_DROP_BEFORE_START = '';
    public PORT = '';
}

for (const key in new IEnv()) {
    if (!process.env[key]) { throw new Error(`Enviromental variable ${key} not specified`); }
}

export const ENV = process.env as any as IDefaultEnv;
