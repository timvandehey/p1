import svelte from 'rollup-plugin-svelte';
import alias from '@rollup/plugin-alias';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import replace from "@rollup/plugin-replace";

const production = !process.env.ROLLUP_WATCH;
const title = process.env.TITLE || 'pwaTemplate2'
console.log({ title })

const aliases = alias({
	resolve: ['.svelte', '.js'], //optional, by default this will just look for .js files or folders
	entries: [
		{ find: 'comp', replacement: 'src' }
	]
});

export default {
	input: 'src/main.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'docs/build/bundle.js'
	},
	plugins: [
		replace({
			isProduction: production,
			pwaTemplate: title
		}),
		svelte({
			// enable run-time checks when not in production
			dev: !production,
			// we'll extract any component CSS out into
			// a separate file - better for performance
			css: css => {
				css.write('docs/build/bundle.css');
			}
			// , include: ['*.svelte', '*.js', '*.json']
		}),
		aliases,

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `docs` directory and refresh the
		// browser on changes when not in production
		!production && livereload('docs'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};

function serve () {
	let started = false;

	return {
		writeBundle () {
			if (!started) {
				started = true;

				require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
					//require('child_process').spawn('npm', ['run', 'start'], {
					stdio: ['inherit', 'inherit', 'inherit'],
					shell: true
				});
			}
		}
	};
}
