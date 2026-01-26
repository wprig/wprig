import { test, expect } from '../fixtures';

test.describe( 'Navigation', () => {
	test.use( { viewport: { width: 375, height: 667 } } );

	test( 'Mobile menu should open and close correctly', async ( { page } ) => {
		await page.goto( '/' );

		const menuToggle = page.locator( '.menu-toggle' ).first();
		const navContainer = page.locator( '.nav--toggle-small' ).first();

		// Check if mobile menu toggle is visible
		if ( ! ( await menuToggle.isVisible() ) ) {
			test.skip( 'Mobile menu toggle is not visible at this resolution' );
		}

		// Initial state
		await expect( menuToggle ).toHaveAttribute( 'aria-expanded', 'false' );
		await expect( navContainer ).not.toHaveClass( /nav--toggled-on/ );

		// Open menu
		await menuToggle.click();
		await expect( menuToggle ).toHaveAttribute( 'aria-expanded', 'true' );
		await expect( navContainer ).toHaveClass( /nav--toggled-on/ );

		// Close menu
		await menuToggle.click( { force: true } );
		await expect( menuToggle ).toHaveAttribute( 'aria-expanded', 'false' );
		await expect( navContainer ).not.toHaveClass( /nav--toggled-on/ );
	} );
} );
