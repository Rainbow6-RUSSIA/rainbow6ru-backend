// import {Column, DataType, Model, PrimaryKey, Table, UpdatedAt} from 'sequelize-typescript';

// @Table
// export class UserDef extends Model<UserDef> {
//   @PrimaryKey
//   @Column(DataType.STRING(18))
//   public id: string;

//   @PrimaryKey
//   @Column(DataType.STRING(36))
//   public genome: string;

//   @Column(DataType.ARRAY(DataType.STRING))
//   public genomeHistory: string[];

//   @Column(DataType.STRING(15))
//   public nickname: string;

//   @Column(DataType.ARRAY(DataType.STRING))
//   public nicknameHistory: string[];

//   @Column
//   public rank: number;

//   @Column
//   public verificationLevel: number;

//   @UpdatedAt
//   @Column
//   public updatedAt: Date;
// }

// export const User = models[0];

// export const User = new Proxy(models[0], {
//     get: (target, name) => {
//         if (typeof target[name] === 'function' && name === 'upsert') {
//             console.log('get func:', name);
//             return new Proxy(Reflect.get(models[0], name), {
//                 apply: (subtarget, thisArg, args) => {
//                     // if ('id' in args) {
//                         console.log('args have id', args);
//                     // }
//                         return subtarget.apply(thisArg, args);
//                 },
//             });
//         } else {
//             console.log('get: name', name);
//             return Reflect.get(models[0], name);
//         }
//     },
//     set: (target, name, value) => {
//         console.log('set: name', name);
//         console.log('set: value', value);
//         return Reflect.set(models[0], name, value);
//     },
//     apply: (target, thisArg, args) => {
//         console.log('apply: args', args);
//         const res = models[0].apply(thisArg, ...args);
//         // console.log('apply: result', res);
//         return  res;
//     },
//     construct: (target, args) => {
//         console.log('construct: args', args);
//         if ('id' in args[0]) {
//             return Reflect.construct(models[args[0].id % HowManyDBs], args);
//         }
//         const res = new models[0](...args);
//         // console.log('construct: result', res);
//         return res;
//     },
//     has: (target, name) => {
//         console.log('has: name', name);
//         const res = name in models[0];
//         // console.log('has: result', res);
//         return res;
//     },
//     getOwnPropertyDescriptor: (target, name) => {
//         console.log('getOwnPropertyDescriptor: name', name);
//         const res = Object.getOwnPropertyDescriptor(models[0], name);
//         // console.log('getOwnPropertyDescriptor: result', res);
//         return  res;
//     },
//     ownKeys: (target) => {
//         console.log('ownKeys');
//         const res = Reflect.ownKeys(models[0]);
//         // console.log('ownKeys: result', res);
//         return res;
//     },
//     defineProperty: (target, name, propertyDescriptor) => {
//         console.log('defineProperty: name', name);
//         const res = Object.defineProperty(models[0], name, propertyDescriptor);
//         // console.log('defineProperty: result', res);
//         return res;
//     },
//     deleteProperty: (target, name) => {
//         console.log('deleteProperty: name', name);
//         return delete models[0].name;
//     },
//     preventExtensions: (target) => {
//         console.log('preventExtensions');
//         return Object.preventExtensions(models[0]);
//     },
// });
