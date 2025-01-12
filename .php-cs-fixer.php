<?php

return (new PhpCsFixer\Config())
	->setRules([
		'yoda_style' => [
			'equal' => true,
			'identical' => true,
			'less_and_greater' => true,
		],
	])
	->setFinder(PhpCsFixer\Finder::create()
	                             ->in(__DIR__)
	                             ->exclude(['vendor', 'node_modules'])
	);
