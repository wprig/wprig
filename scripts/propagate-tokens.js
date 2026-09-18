import { propagateTokens } from './tasks/tokens.js';
import { writeTokenInventory } from './lib/token-inventory.js';

propagateTokens()
	.then( () => writeTokenInventory() )
	.then( () =>
		console.log(
			'Successfully propagated tokens to theme.json, CSS variables, and Tailwind config.'
		)
	)
	.catch( console.error );
