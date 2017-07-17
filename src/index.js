/* @flow */
import { set as _fpSet, unset as _fpUnset, update as _fpUpdate } from 'lodash/fp'
import {
  get as _get, set as _set, isPlainObject, toPairs as _toPairs,
defaults as withDefaults
} from 'lodash'
import Struct, { setIn } from './struct'

export type Path = string | Array<string>
export type GetPath = Path | { [string]: Path }
export type SetPath = Path | { [string]: any }
export type Updater = (val: any) => any
export type UpdatePath = Path | { [string]: Updater }
export type DelPath = Path | { [string]: boolean }

export const fpOptions = {
  rearg: false,
  curry: false,
  fixed: false, // get defaults
}

const [fpSet, fpUnset, fpUpdate]: [typeof _fpSet, typeof _fpUnset, typeof _fpUpdate] =
  (([_fpSet, _fpUnset, _fpUpdate].map(fn => fn.convert(fpOptions))): any)

function toPairs(obj: Object) {
  return _toPairs(obj).map(([key, val]) => {
    if (key.indexOf(',') !== -1) {
      key = key.split(',')
    }
    return [key, val]
  })
}

function get<T: Object>(obj: T, path: GetPath, defaults?: *): * {
  if (isPlainObject(path)) {
    const combinedValue = toPairs((path: any)).reduce((newObj, [newKey, subPath]) =>
      _set(newObj, newKey, get(obj, subPath)), {})
    return withDefaults(combinedValue, (defaults: any))
  }
  if (path.length === 0) {
    return obj
  }
  return _get(obj, (path: any), defaults)
}

function set<T: Object>(obj: T, path: SetPath, value?: *): T {
  if (isPlainObject(path)) {
    return toPairs((path: any)).reduce((newObj: T, pair: Array<*>) =>
      fpSet(newObj, ...pair), obj)
  }
  if (path.length === 0) {
    return obj
  }
  return fpSet(obj, (path: any), value)
}

function update<T: Object>(obj: T, path: UpdatePath, fn: ?Updater): T {
  if (isPlainObject(path)) {
    return toPairs((path: any)).reduce((newObj: T, pair: Array<*>) =>
      update(newObj, ...pair), obj)
  }
  if (path.length === 0) {
    return fn ? fn(obj) : obj
  }
  return fn ? fpUpdate(obj, (path: any), fn) : obj
}

function del<T: Object>(obj: T, path: DelPath): T {
  if (isPlainObject(path)) {
    return toPairs((path: any)).reduce((newObj: T, [subPath, isDel]: Array<*>) => {
      return isDel ? del(newObj, subPath) : newObj
    }, obj)
  }
  return fpUnset(obj, (path: any))
}

class ImmuterWrapper<T: Object> {
  _obj: T
  _chain = false
  constructor(obj: T, chain: boolean = false) {
    this._obj = obj
    this._chain = chain
  }
  bindObj(wrap: boolean): ImmuterWrapper<T> {
    return bindObj(this._obj, wrap)
  }
  getObj() {
    return this._obj
  }
  get(path: GetPath, defaults?: *) {
    return get(this._obj, path, defaults)
  }
  set(path: SetPath, value?: *) {
    this._obj = set(this._obj, path, value)
    if (this._chain) return this
    return this._obj
  }
  update(path: SetPath, fn?: ?Updater) {
    this._obj = update(this._obj, path, fn)
    if (this._chain) return this
    return this._obj
  }
  del(path: DelPath) {
    this._obj = del(this._obj, path)
    if (this._chain) return this
    return this._obj
  }
  delete = this.del
}

function bindObj<T: Object>(obj: T, chain: boolean = false): ImmuterWrapper<T> {
  return new ImmuterWrapper(obj, chain)
}

export type ImmuterGet = (path: GetPath, defaults?: *) => *
export type ImmuterSet<State> = (path: SetPath, value?: *) => State
export type ImmuterUpdate<State> = (path: UpdatePath, fn?: Updater) => State
export type ImmuterDel<State> = (path: DelPath) => State

function bindComp<T: Object>(
  ns: boolean | string = false,
  includes?: ?Array<string>,
  excludes: Array<string> = ['bindObj', 'bindComp']
) {
  let names = Object.keys(immuter)
    .filter(name => excludes.indexOf(name) === -1)
    .filter(name => includes ? includes.indexOf(name) !== -1 : true)

  return (comp: React$Component<*, *, T>) => {
    ns = ns === true ? 'immuter' : ns
    const instance = ns ? ((comp: any).prototype[ns] = {}) : (comp: any).prototype
    names.forEach(name => {
      instance[name] = function (...args) {
        const ret = immuter[name](this.state, ...args)
        if (name === 'get') {
          return ret
        }
        return new Promise((resolve, reject) => {
          try {
            this.setState((ret: any), () => resolve(ret))
          } catch (e) {
            reject(e)
            console.error(e)
          }
        })
      }
    })
    return comp
  }
}
const immuter = { bindObj, bindComp, get, set, update, del, delete: del, Struct, setIn }
export { bindObj, bindComp, get, set, update, del, Struct, setIn }
export default immuter
