import { prod } from './store'
import { log, logMethods, interceptMethodCalls } from "./utils"
import App from "./App.svelte"


const app = new App({
	target: document.body,
	props: {
	}
})

let myObj = {
	a: 7,
	multiply (x, y) {
		return x * y;
	},
	squared (x) {
		return x * x;
	}
};

log(13)
myObj = logMethods(myObj)
log(14)
myObj.a = 9
const x = myObj.multiply(3, 5)
log(myObj.squared(4))
log(15)
log(166, { x, }, myObj.a)

log(prod ? 'in Production' : 'In Development')
document.title = `${prod ? '' : 'Dev - '}${document.title}`
export default app;