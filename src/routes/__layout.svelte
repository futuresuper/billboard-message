<script>
	import '../app.css';
</script>

<svelte:head>
	<title>Future Super</title>
	<meta charset="UTF-8" />
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1.0 viewport-fit=cover"
		shrink-to-fit="no"
	/>
	<meta http-equiv="X-UA-Compatible" content="ie=edge" />
	<meta
		name="description"
		content="If you don’t know exactly what your superannuation fund invests in, your future savings could be contributing directly and significantly to the climate crisis."
	/>
	<meta property="og:title" content="Future Super | Know what your super invests in?" />
	<meta
		property="og:description"
		content="If you don’t know exactly what your superannuation fund invests in, your future savings could be contributing directly and significantly to the climate crisis."
	/>
	<meta property="og:image" content="https://www.futuresuper.com.au/images/future-super-og.png" />
	<meta property="og:type" content="website" />
	<meta property="twitter:title" content="Know what your super invests in?" />
	<meta
		property="twitter:description"
		content="If you don’t know exactly what your superannuation fund invests in, your future savings could be contributing directly and significantly to the climate crisis."
	/>
	<meta
		property="twitter:image"
		content="https://www.futuresuper.com.au/images/future-super-og.png"
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<link
		rel="icon"
		type="image/png"
		sizes="32x32"
		href="https://www.futuresuper.com.au/images/favicon/favicon-32.png"
	/>
	<link
		rel="apple-touch-icon"
		href="https://www.futuresuper.com.au/images/favicon/apple-touch-icon.png"
	/>
	<!-- Google Tag Manager -->
	<script>
		(function (w, d, s, l, i) {
			w[l] = w[l] || [];
			w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
			var f = d.getElementsByTagName(s)[0],
				j = d.createElement(s),
				dl = l != 'dataLayer' ? '&l=' + l : '';
			j.async = true;
			j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
			f.parentNode.insertBefore(j, f);
		})(window, document, 'script', 'dataLayer', 'GTM-WDKLJP');
	</script>
	<!-- Autopilot -->
	<script type="text/javascript">
		(function (o) {
			var b = 'https://briskpelican.io/anywhere/',
				t = '072396077b1c40c39e84f98a104af57eeddb872ab9a643b4ac354d41e8ae661e',
				a = (window.AutopilotAnywhere = {
					_runQueue: [],
					run: function () {
						this._runQueue.push(arguments);
					}
				}),
				c = encodeURIComponent,
				s = 'SCRIPT',
				d = document,
				l = d.getElementsByTagName(s)[0],
				p =
					't=' + c(d.title || '') + '&u=' + c(d.location.href || '') + '&r=' + c(d.referrer || ''),
				j = 'text/javascript',
				z,
				y;
			if (!window.Autopilot) window.Autopilot = a;

			if (o.app) p = 'devmode=true&' + p;

			z = function (src, asy) {
				var e = d.createElement(s);
				e.src = src;
				e.type = j;
				e.async = asy;
				l.parentNode.insertBefore(e, l);
			};
			y = function () {
				z(b + t + '?' + p, true);
			};
			if (window.attachEvent) {
				window.attachEvent('onload', y);
			} else {
				window.addEventListener('load', y, false);
			}
		})({});
	</script>
</svelte:head>

<slot />
