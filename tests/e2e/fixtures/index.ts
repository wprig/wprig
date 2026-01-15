import { test as base } from '@playwright/test';
import { admin, editor } from '@wordpress/e2e-test-utils-playwright';

export const test = base.extend( {
	admin,
	editor,
} );

export { expect } from '@playwright/test';
