import { test, expect } from '../fixtures';

test.describe( 'Initial Setup', () => {
	test( 'Ensure WP Rig theme is active', async ( { page } ) => {
		await page.goto( '/wp-login.php' );
		await page.fill( '#user_login', process.env.WP_ADMIN_USER || 'admin' );
		await page.fill( '#user_pass', process.env.WP_ADMIN_PASSWORD || 'password' );
		await page.click( '#wp-submit' );

		await page.goto( '/wp-admin/themes.php' );

		const themeName = 'WP Rig';
		const activeTheme = await page
			.locator( '.theme.active .theme-name' )
			.innerText();

		if ( ! activeTheme.includes( themeName ) ) {
			const themeCard = page.locator(
				`.theme:has-text("${ themeName }")`
			);
			await themeCard.hover();
			await themeCard
				.getByRole( 'button', { name: `Activate ${ themeName }` } )
				.click();

			await expect(
				page.locator( '.theme.active .theme-name' )
			).toContainText( themeName );
		}
	} );
} );
