import { test, expect } from '../fixtures';

test.describe( 'Initial Setup', () => {
	test( 'Ensure WP Rig theme is active', async ( { admin } ) => {
		await admin.visitAdminPage( 'themes.php' );

		const themeName = 'WP Rig';
		const activeTheme = await admin.page
			.locator( '.theme.active .theme-name' )
			.innerText();

		if ( ! activeTheme.includes( themeName ) ) {
			const themeCard = admin.page.locator(
				`.theme:has-text("${ themeName }")`
			);
			await themeCard.hover();
			await themeCard
				.getByRole( 'button', { name: `Activate ${ themeName }` } )
				.click();

			await expect(
				admin.page.locator( '.theme.active .theme-name' )
			).toContainText( themeName );
		}
	} );
} );
