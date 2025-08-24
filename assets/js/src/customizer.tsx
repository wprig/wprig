/**
 * File customizer.js.
 *
 * Theme Customizer enhancements for a better user experience.
 *
 * Contains handlers to make Theme Customizer preview reload changes asynchronously.
 */
interface BindCallback< T > {
	( to: T ): void;
}

interface CustomizeValue< T > {
	bind: ( callback: BindCallback< T > ) => void;
}

interface WPCustomize {
	< T >( id: string, callback: ( value: CustomizeValue< T > ) => void ): void;
}

declare global {
	interface Window {
		wp: { customize: WPCustomize };
	}
}

// Helper functions
function setTextContent( selector: string, text: string ): void {
	const elements = document.querySelectorAll( selector );
	elements.forEach( ( element ) => {
		element.textContent = text;
	} );
}

function setStyle(
	selector: string,
	styles: Partial< CSSStyleDeclaration >
): void {
	const elements = document.querySelectorAll( selector );
	elements.forEach( ( element ) => {
		Object.assign( element.style, styles );
	} );
}

// Site title and description.
window.wp.customize( 'blogname', function ( value ) {
	value.bind( function ( to ) {
		setTextContent( '.site-title a', to );
	} );
} );

window.wp.customize( 'blogdescription', function ( value ) {
	value.bind( function ( to ) {
		setTextContent( '.site-description', to );
	} );
} );

// Header text color.
window.wp.customize( 'header_textcolor', function ( value ) {
	value.bind( function ( to ) {
		if ( 'blank' === to ) {
			setStyle( '.site-title, .site-description', {
				clipPath: 'inset(1px)',
				position: 'absolute',
			} );
		} else {
			setStyle( '.site-title, .site-description', {
				clipPath: 'none',
				position: 'relative',
			} );
			setStyle( '.site-title a, .site-description', {
				color: to,
			} );
		}
	} );
} );
