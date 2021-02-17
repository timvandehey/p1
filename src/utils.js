import { Logger, dev } from './store'

export function log (...args) {
    if (dev) {
        const sampleSize = 100
        const sampleJSON = JSON.stringify([...args])
        let s1 = sampleJSON
        let s2 = ''
        let css = ''
        if (sampleJSON.length > sampleSize) {
            s1 = sampleJSON.slice(0, sampleSize)
            s2 = ' %c ...more '
            css = 'color:white;background:green;font-size:.8em;'
        }
        console.groupCollapsed(s1 + s2, css)
        console.log.apply(null, args)
        console.groupCollapsed('   ...log trace HERE collapsed')
        console.trace()
        console.groupEnd()
        console.groupEnd()
    }
    Logger.apply(null, args)
}

const handleMethodCall = (fnName, fnArgs, result) =>
    log(` Intercepted: ${fnName}(${fnArgs}) = ${result} `);

export const logMethods = (obj) => {
    return interceptMethodCalls(obj, handleMethodCall)
}

// const curriedInterceptMethodCalls = (fn) => (obj) => interceptMethodCalls(obj, fn)

export function interceptMethodCalls (obj, fn) {
    const np = new Proxy(obj, {
        get (target, prop) {
            if (typeof target[prop] === 'function') {
                return new Proxy(target[prop], {
                    apply: (target, thisArg, argumentsList) => {
                        const result = Reflect.apply(target, thisArg, argumentsList);
                        fn(prop, argumentsList, result);
                        return result
                    }
                });
            } else {
                const result = Reflect.get(target, prop);
                fn(prop, null, result)
                return result
            }
        }
        , set (target, prop, value) {
            log('set', { target, prop, value })
            fn(prop, target[prop], value)
            target[prop] = value;
            return true;
        }
    });
    return np
}

export function getStoreValue (storeVar) {
    let store_value;
    const unsubscribe = storeVar.subscribe(value => {
        store_value = value;
    });
    unsubscribe()
    return store_value
}
