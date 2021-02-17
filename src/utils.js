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

export function getStoreValue (storeVar) {
    let store_value;
    const unsubscribe = storeVar.subscribe(value => {
        store_value = value;
    });
    unsubscribe()
    return store_value
}
