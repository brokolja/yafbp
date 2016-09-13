(function (window, document, SVGInjector) {

	/**
	 * Inject SVGs to img-tags as inline-code
	 * 
	 * Example:
	 * <img class="icon-close" data-inject="svg" data-src="images/close.svg">
	 * 
	 * Why:
	 * caching, styling, only inline-SVGs could be scripted/animated... 
	 * 
	 * Usage:
	 * if you want to script an svg, use: $(document).on('all-SVGs-injected', function (event) {});
	 * 
	 * Browsersupport: IE 8+
	 */

	var event;

	if (document.createEvent) {
		event = document.createEvent('Event');
		event.initEvent('all-SVGs-injected', true, true); //can bubble, and is cancellable
	} else if (window.CustomEvent) {
		event = new window.CustomEvent('all-SVGs-injected', { bubbles: true, cancelable: true });
	}

	function injectSVGs() {

		SVGInjector(document.querySelectorAll('[data-inject="svg"]'), {
			//evalScripts: 'once',
			//pngFallback: 'images/png',
			//each: function (svg) {
			// Callback after each SVG is injected
			//console.log('SVG injected: ' + svg.getAttribute('id'));
			//}
		}, function (totalSVGs) {
			// Callback after all SVGs are injected
			if (document.dispatchEvent) {
				document.dispatchEvent(event);
			}
		});
	}

	window.injectSVGs = injectSVGs;

	injectSVGs();

})(window, document, SVGInjector)