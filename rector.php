<?php
/**
 * Rector Config File
 *
 * @link https://github.com/rectorphp/rector
 *
 * @package rector
 */

declare(strict_types=1);

use Rector\Config\RectorConfig;
use Rector\Set\ValueObject\SetList;
use Rector\TypeDeclaration\Rector\Property\TypedPropertyFromStrictConstructorRector;

return static function ( RectorConfig $rector_config ): void {
	// Specify paths to analyze.
	$rector_config->paths(
		array(
			__DIR__,
		)
	);

	// Skip these directories.
	$rector_config->skip(
		array(
			__DIR__ . '/vendor',
			__DIR__ . '/node_modules',
			__DIR__ . '/tests', // Optional.
		)
	);

	$rector_config->skip(
		array(
			Rector\DeadCode\Rector\Property\RemoveUselessVarTagRector::class,
		)
	);

	// Add single rule.
	$rector_config->rule( TypedPropertyFromStrictConstructorRector::class );

	// Add prepared sets of rules.
	$rector_config->sets(
		array(
			SetList::DEAD_CODE,
			SetList::CODE_QUALITY,
		)
	);
};
