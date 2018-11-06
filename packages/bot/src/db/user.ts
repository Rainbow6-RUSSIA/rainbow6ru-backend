import * as _ from 'lodash';
import * as sequelize from 'sequelize';
import { BulkCreateOptions, CreateOptions, DestroyOptions, FindOptions, UpdateOptions, UpsertOptions} from 'sequelize';

const DBsURIs = process.env.USER_DB.split(',');

export const HowManyDBs = DBsURIs.length;
export const userDB: sequelize.Sequelize[] = [];
export const models: any[] = [];

const mergeCustomizer = (objVal, srcVal) => {
    if (_.isArray(objVal)) {
        return objVal.concat(srcVal);
    }
    if (typeof objVal === 'number') {
        return objVal + srcVal;
    }
};

const checkOrder = (method, options) => {
    if (HowManyDBs && options && options.order) {
        console.warn(`[${method}] Order isn't supported with multiple databases`);
    }
};

for (let i = 0; i < HowManyDBs; i++) {
    userDB.push(new sequelize(DBsURIs[i], {logging: false}));
    models[i] = userDB[i].define('User', {
        id: {
            type: sequelize.STRING(18),
            primaryKey: true,
            allowNull: false,
        },
        genome: sequelize.STRING(36),
        genomeHistory: sequelize.ARRAY(sequelize.STRING(36)),
        nickname: sequelize.STRING(15),
        nicknameHistory: sequelize.ARRAY(sequelize.STRING(15)),
        rank: sequelize.INTEGER,
        verificationLevel: sequelize.INTEGER,
    }, {
        timestamps: true,
    });
    userDB[i].sync();
    userDB[i].authenticate();
}

// export const User = models;
// const m0 = new sequelize(DBsURIs[0]).define('', {}); // for autocomplete
// m0.destroy;
export class User extends models[0] {
    public static bulkCreate = async (data: any[], options?: BulkCreateOptions): Promise<any> => {
        const groups = [];
        const order = [];

        for (let i = 0; i < HowManyDBs; i++) {
            groups[i] = [];
        }

        data.forEach((e, i) => {
            const DBIndex = (e.id || '0').slice(-2) % HowManyDBs;
            order[i] = DBIndex;
            groups[DBIndex].push(e);
        });

        let pool = [];

        groups.forEach((e, i) => {
            pool.push(models[i].bulkCreate(e, options));
        });
        pool = await Promise.all(pool);
        const answ = [];
        order.forEach((e) => {
            answ.push(pool[e].shift());
        });
        return answ;
    }
    // public static upsert(data: any, options?: UpsertOptions & { returning?: false | undefined }): Promise<boolean>;
    public static upsert = async (data: any, options?: UpsertOptions/* & { returning: true }*/): Promise<any/*[any, boolean]*/> => {
        const DBIndex = (data.id || '0').slice(-2) % HowManyDBs;
        return models[DBIndex].upsert(data, options);
    }
    public static update = async (data: any, options?: UpdateOptions ): Promise<[number, any]> => {
        let pool = [];
        for (let i = 0; i < HowManyDBs; i++) {
            pool.push(models[i].update(data, options));
        }
        pool = await Promise.all(pool);
        let answ = pool[0];
        for (let i = 1; i < HowManyDBs; i++) {
            answ = _.mergeWith(answ, pool[i], mergeCustomizer);
        }
        return answ;
    }
    public static create = async (data: any, options?: CreateOptions ): Promise<any> => {
        const DBIndex = (data.id || '0').slice(-2) % HowManyDBs;
        return models[DBIndex].create(data, options);
    }
    public static findAll = async (options?: FindOptions<{}>): Promise<any> => {
        checkOrder('findAll', options);
        let pool = [];
        for (let i = 0; i < HowManyDBs; i++) {
            pool.push(models[i].findAll(options));
        }
        pool = await Promise.all(pool);
        let answ = pool[0];
        for (let i = 1; i < HowManyDBs; i++) {
            answ = _.merge(answ, pool[i]);
        }
        return answ;
    }
    public static findByPk = async (data: number | string | Buffer, options?: FindOptions<{}>): Promise<any> => {
        const DBIndex = parseInt((data || '0').toString().slice(-2), 10) % HowManyDBs;
        return models[DBIndex].findByPk(data, options);
    }
    public static destroy = async (options?: DestroyOptions): Promise<number> => {
        let pool = [];
        for (let i = 0; i < HowManyDBs; i++) {
            pool.push(models[i].destroy(options));
        }
        pool = await Promise.all(pool);
        let answ = pool[0];
        for (let i = 1; i < HowManyDBs; i++) {
            answ += pool[i];
        }
        return answ;
    }

    // findOne
    // findAndCountAll
    // findOrBuild
}
