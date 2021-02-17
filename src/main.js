import { prod } from './store'
import { log } from "./utils"
import App from "./App.svelte"


const app = new App({
	target: document.body,
	props: {
	}
})

log(prod ? 'in Production' : 'In Development')
document.title = `${prod ? '' : 'Dev - '}${document.title}`
export default app;