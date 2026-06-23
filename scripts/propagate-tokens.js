import { propagateTokens } from './tasks/tokens.js';

propagateTokens()
	.then( () =>
		console.log(
			'Successfully propagated tokens to theme.json, CSS variables, and Tailwind config.'
		)
	)
	.catch( console.error );
