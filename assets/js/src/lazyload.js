/**
 * Lazy-load images script.
 *
 * @link https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/
 */
document.addEventListener( 'DOMContentLoaded', function() {
	let lazyImages = [].slice.call( document.querySelectorAll( 'img.lazy' ) );

	if ( 'IntersectionObserver' in window ) {
		const lazyImageObserver = new IntersectionObserver( function( entries ) {
			entries.forEach( function( entry ) {
				if ( entry.isIntersecting ) {
					const lazyImage = entry.target;
					lazyImage.src = lazyImage.dataset.src;
					if ( lazyImage.dataset.srcset ) {
						lazyImage.srcset = lazyImage.dataset.srcset;
					}
					if ( lazyImage.dataset.sizes ) {
						lazyImage.sizes = lazyImage.dataset.sizes;
					}
					lazyImage.classList.remove( 'lazy' );
					lazyImageObserver.unobserve( lazyImage );
				}
			} );
		} );

		lazyImages.forEach( function( lazyImage ) {
			lazyImageObserver.observe( lazyImage );
		} );
	} else {
		// For older browsers lacking IntersectionObserver support.
		// See https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/
		let active = false;

		const lazyLoad = function() {
			if ( false === active ) {
				active = true;

				setTimeout( function() {
					lazyImages.forEach( function( lazyImage ) {
						if ( ( lazyImage.getBoundingClientRect().top <= window.innerHeight && 0 <= lazyImage.getBoundingClientRect().bottom ) && 'none' !== getComputedStyle( lazyImage ).display ) {
							lazyImage.src = lazyImage.dataset.src;
							if ( lazyImage.dataset.srcset ) {
								lazyImage.srcset = lazyImage.dataset.srcset;
							}
							if ( lazyImage.dataset.sizes ) {
								lazyImage.sizes = lazyImage.dataset.sizes;
							}
							lazyImage.classList.remove( 'lazy' );

							lazyImages = lazyImages.filter( function( image ) {
								return image !== lazyImage;
							} );

							if ( 0 === lazyImages.length ) {
								document.removeEventListener( 'scroll', lazyLoad );
								window.removeEventListener( 'resize', lazyLoad );
								window.removeEventListener( 'orientationchange', lazyLoad );
							}
						}
					} );

					active = false;
				}, 200 );
			}
		};

		document.addEventListener( 'scroll', lazyLoad );
		window.addEventListener( 'resize', lazyLoad );
		window.addEventListener( 'orientationchange', lazyLoad );
	}
} );
