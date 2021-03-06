declare module 'immuter' {
  type Path = string | string[]
  type GetPath = Path | { [key: string]: Path }
  type SetPath = Path | { [key: string]: any }
  type Updater = (val: any) => any
  type UpdatePath = Path | { [key: string]: Updater }
  type DelPath = Path | { [key: string]: boolean }
  export type ImmuterGet = (path: GetPath, defaults?: any) => any
  export type ImmuterSet<State> = (path: SetPath, value?: any) => State
  export type ImmuterUpdate<State> = (path: UpdatePath, fn?: Updater) => State
  export type ImmuterDel<State> = (path: DelPath) => State
  export class ImmuterWrapper<T> {
    constructor(obj: T, chain: boolean);
    bindObj(wrap: boolean): ImmuterWrapper<T>;
    getObj(): T;
    get(path: GetPath, defaults?: any): any;
    set(path: SetPath, value?: any): T;
    update(path: SetPath, fn?: Updater): T;
    del(path: DelPath): T;
  }

  export interface ImmuterInterface {
    bindObj<T>(obj: T, wrap?: boolean): ImmuterWrapper<T>;
    bindComp(ns?: boolean | string, includes?: Array<string>, excludes?: Array<string>): Function;
    get<T>(obj: T, path: GetPath, defaults?: any): any;
    set<T>(obj: T, path: SetPath, value?: any): T;
    update<T>(obj: T, path: SetPath, fn?: Updater): T;
    del<T>(obj: T, path: DelPath): T;
    Struct: StructConstructor;
  }

  type StructT<T> = T & {
    clone(fn: (struct: StructT<T>) => (StructT<T> | void)): StructT<T>;
  }

  export function setIn<T extends Object, F>(data: T, keyPath: Array<string | number> | ((key: T) => F)): (val: F) => T;

  export interface StructConstructor {
    <T>(obj: T): StructT<T>;
    isStruct<T>(obj: T): boolean;
    clone<T>(obj: T, fn?: (struct: StructT<T>) => (StructT<T> | void)): StructT<T>;
    debug(obj: any, json?: boolean, out?: boolean);
  }

  export const Struct: StructConstructor
  export const Immuter: ImmuterInterface
  export default Immuter
}
