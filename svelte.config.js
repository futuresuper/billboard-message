/** @type {import('@sveltejs/kit').Config} */

import adapter from '@sveltejs/adapter-netlify';
const config = {
	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		adapter: adapter(), // currently the adapter does not take any options
		target: '#svelte'
	}
};

export default config;
