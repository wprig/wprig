/**
 * Load SVG sprite.
 */

( function() {
	let ajax = new XMLHttpRequest();
	ajax.open( 'GET', wpRigIcons.URI, true );
	ajax.send();
	ajax.onload = function( e ) {
		const div = document.createElement( 'div' );
		div.innerHTML = ajax.responseText;
		document.body.insertBefore( div, document.body.childNodes[0]);
	};
}() );
