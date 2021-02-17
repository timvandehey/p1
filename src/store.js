import { writable } from "svelte/store";
export const dev = !isProduction
export const prod = isProduction
export const logs = writable([])

const pad = (n, num = 2) => String(n).padStart(num, '0')

const getTime = () => {
    const d = new Date()
    const h = pad(d.getHours())
    const m = pad(d.getMinutes())
    const s = pad(d.getSeconds())
    const ms = pad(d.getMilliseconds(), 3)
    return `${h}:${m}:${s}:${ms} `
}

export function Logger (summary = "", ...details) {
    const l = details.length
    if (l == 0) details = summary
    if (l == 1) details = details[0]
    const event = { time: getTime(), summary, details }
    logs.update(prev => [...prev, event])
}